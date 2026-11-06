import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Repo, RepoDetail } from '../types/repo';
import type { DiscoveryDoc } from '../types/discovery';
import type { IntentDoc, IntentEntry } from '../types/intents';
import {
  CONSTRAINT_BONUS,
  LIGHT_OFFICIAL_BONUS,
  createLongTextSearch,
  constraintRerankBonus,
  detectConstraintQuery,
  LONG_TEXT_HIT_THRESHOLD,
  normalizeLongText,
  SCENARIO_CONFIDENCE_THRESHOLD,
  SCENARIO_MIN_SCORE,
  SCENARIO_MIN_SCORE_LIGHTWEIGHT,
  segmentLongQuery,
  tokenizeLongText,
  type LongTextSearch,
} from './discovery';

const DATA_DIR = path.resolve(fileURLToPath(new URL('../../../data/', import.meta.url)));

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

const repos = readJson<{ repos: Repo[] }>(path.join(DATA_DIR, 'repos.json')).repos;
const discovery = readJson<DiscoveryDoc>(path.join(DATA_DIR, 'discovery.json'));
const intents = readJson<IntentDoc>(path.join(DATA_DIR, 'intents.json'));
const details: Record<string, RepoDetail> = {};
for (const file of fs.readdirSync(path.join(DATA_DIR, 'details'))) {
  if (!file.endsWith('.json')) continue;
  const detail = readJson<RepoDetail>(path.join(DATA_DIR, 'details', file));
  details[detail.id] = detail;
}

let search: LongTextSearch;

beforeAll(() => {
  search = createLongTextSearch(repos, details, discovery, intents);
});

describe('意图语料', () => {
  it('每个仓库 12–20 条，场景 id 合法且句子不重复', () => {
    const scenarioIds = new Set(discovery.scenarios.map((scenario) => scenario.id));
    const seen = new Set<string>();
    let total = 0;
    for (const repo of repos) {
      const list: IntentEntry[] = intents.repos[repo.id] ?? [];
      expect(list.length, repo.id).toBeGreaterThanOrEqual(12);
      expect(list.length, repo.id).toBeLessThanOrEqual(20);
      for (const entry of list) {
        expect(scenarioIds.has(entry.scenario), `${repo.id}:${entry.scenario}`).toBe(true);
        expect(entry.q.length).toBeGreaterThanOrEqual(10);
        expect(entry.q.length).toBeLessThanOrEqual(30);
        expect(seen.has(entry.q), entry.q).toBe(false);
        seen.add(entry.q);
        total += 1;
      }
    }
    expect(total).toBeGreaterThanOrEqual(repos.length * 12);
    for (const scenario of discovery.scenarios) {
      expect((intents.scenarios[scenario.id] ?? []).length, scenario.id).toBeGreaterThanOrEqual(8);
    }
    expect(intents.global.length).toBeGreaterThanOrEqual(10);
  });
});

describe('归一化', () => {
  it('全角转半角、小写、去标点与语气词', () => {
    expect(normalizeLongText('Ｒｅａｃｔ 视频！')).toBe('react视频');
    expect(normalizeLongText('我想做个数学动画')).toBe('做个数学动画');
    expect(normalizeLongText('有没有能批量跑的命令？')).toBe('能批量跑的命令');
  });

  it('中文数字转阿拉伯，同时保护一镜到底等固定说法', () => {
    expect(normalizeLongText('两百条素材')).toBe('200条素材');
    expect(normalizeLongText('三十秒开场')).toBe('30秒开场');
    expect(normalizeLongText('一镜到底')).toBe('一镜到底');
    expect(normalizeLongText('一键出片')).toBe('一键出片');
  });
});

describe('分词与长句分段', () => {
  it('词表最长匹配优先，未登录字退化为 2-gram', () => {
    const tokens = tokenizeLongText('卷积神经网络讲解', ['卷积神经网络', '神经网络', '讲解']);
    expect(tokens).toContain('卷积神经网络');
    expect(tokens).toContain('讲解');
    expect(tokens).not.toContain('神经');
  });

  it('短句不拆分', () => {
    expect(segmentLongQuery('数学动画')).toEqual(['数学动画']);
  });

  it('按逗号与「然后 / 还要 / 最后」分段，避免长句被平均稀释', () => {
    expect(segmentLongQuery('做卷积视频，竖屏发抖音')).toHaveLength(2);
    expect(segmentLongQuery('先做动画然后加字幕最后导出')).toHaveLength(3);
  });
});

describe('长句检索与场景识别', () => {
  it('建索引规模符合 65 仓库 × 约 14 条意图', () => {
    expect(search.stats.repos).toBe(repos.length);
    expect(search.stats.intents).toBeGreaterThanOrEqual(repos.length * 12);
    expect(search.stats.scenarios).toBe(discovery.scenarios.length);
  });

  it('长句能命中代码高亮类仓库，并给出「匹配到你说的」短语', () => {
    const result = search.search('把一段代码讲明白，像视频里那种逐行高亮');
    expect(result.segments.length).toBeGreaterThanOrEqual(2);
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits.slice(0, 3).some((hit) => hit.repo.id === 'remotion-dev__template-code-hike')).toBe(
      true,
    );
    expect(
      result.hits
        .slice(0, 3)
        .some((hit) => hit.matchedPhrase?.includes('高亮')),
    ).toBe(true);
    expect(result.scenario?.scenario.id).toBe('code-terminal');
  });

  it('场景识别返回 top1 与 confidence，且低置信度可被 UI 隐藏', () => {
    const result = search.search('公司新品发布会要一段 30 秒开场动画');
    expect(result.scenario).not.toBeNull();
    expect(result.scenario!.scenario.id).toBe('product-promo');
    expect(result.scenario!.confidence).toBeGreaterThanOrEqual(SCENARIO_CONFIDENCE_THRESHOLD);
    expect(result.scenarioRanking.length).toBeLessThanOrEqual(3);
    for (const item of result.scenarioRanking) expect(item.score).toBeGreaterThan(0);
  });

  it('无命中时返回 3 个近邻与 3 条可点说法，而不是固定推荐词', () => {
    const result = search.search('深海潜艇核反应堆维护规程');
    expect(result.hits.length).toBe(0);
    expect(result.nearest).toHaveLength(3);
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions).not.toContain('数学动画');
  });

  it('无关长句即使比值置信度不低，也因场景绝对分过低而不展示「我理解为」', () => {
    const result = search.search('深海潜艇核反应堆维护规程');
    const score = result.scenario?.score ?? 0;
    expect(score).toBeLessThan(SCENARIO_MIN_SCORE);
  });

  it('约束型查询 rerank：轻量出片句把重安装 / 需独显的仓库压出 top3', () => {
    const result = search.search('Windows 上不想装一堆依赖，最好双击就能出片');
    const top3 = result.hits.slice(0, 3).map((hit) => hit.repo.id);
    expect(top3).toContain('welovemedia__ffmate');
    expect(top3).toContain('wx4766__html-to-video');
    expect(top3).not.toContain('0xS4N4TG__kinetograph');
    const kinetograph = result.hits.find((hit) => hit.repo.id === '0xS4N4TG__kinetograph');
    const best = result.hits[0]?.score ?? 0;
    expect(kinetograph?.score ?? 0).toBeLessThan(best);
    // 纯约束句没有场景名词，场景绝对分低于轻量门槛，UI 不应显示「我理解为」。
    expect(result.lightweight).toBe(true);
    expect(result.scenario?.score ?? 0).toBeLessThan(SCENARIO_MIN_SCORE_LIGHTWEIGHT);
  });

  it('约束识别与权重上限可解释', () => {
    const active = detectConstraintQuery(
      normalizeLongText('Windows 上不想装一堆依赖，最好双击就能出片'),
      discovery.constraints,
    );
    expect(active.lightweight).toBe(true);
    expect(active.constraints.map((constraint) => constraint.id)).toEqual(
      expect.arrayContaining(['install-5min', 'win-workable']),
    );
    const byId = new Map(repos.map((repo) => [repo.id, repo]));
    const ffmate = constraintRerankBonus(
      byId.get('welovemedia__ffmate')!,
      active.constraints,
      true,
    );
    const kinetograph = constraintRerankBonus(
      byId.get('0xS4N4TG__kinetograph')!,
      active.constraints,
      true,
    );
    const fframes = constraintRerankBonus(
      byId.get('dmtrKovalenko__fframes')!,
      active.constraints,
      true,
    );
    expect(ffmate).toBeGreaterThan(0);
    expect(ffmate).toBeLessThanOrEqual(2 * CONSTRAINT_BONUS + LIGHT_OFFICIAL_BONUS);
    expect(kinetograph).toBeLessThan(0);
    expect(fframes).toBeLessThan(0);
  });

  it('单次查询（65 仓库 × 910 条意图）保持在 15ms 内', () => {
    const queries = [
      '我想做个把卷积神经网络讲清楚的科普视频，竖屏发抖音',
      '我有一批素材要自动拼成短视频，一天几百条',
      '用 React 写视频，能进 CI 自动出片',
    ];
    for (const query of queries) search.search(query);
    const durations = queries.map((query) => search.search(query).elapsedMs);
    // eslint-disable-next-line no-console
    console.log(`长句检索耗时（ms）：${durations.map((value) => value.toFixed(2)).join(', ')}`);
    expect(Math.max(...durations)).toBeLessThan(15);
  });
});

describe('10 句真实口气回归（正确场景需进 top2）', () => {
  const cases: Array<{ q: string; expect: string[]; note: string }> = [
    { q: '我想做个把卷积神经网络讲清楚的科普视频，竖屏发抖音', expect: ['math-physics', 'product-promo'], note: '科普 + 竖屏' },
    { q: '公司新品发布会要一段 30 秒开场动画', expect: ['product-promo'], note: '发布会片头' },
    { q: '把一段代码讲明白，像视频里那种逐行高亮', expect: ['code-terminal'], note: '代码高亮' },
    { q: '录一段终端命令演示，做成 GIF 发文档里', expect: ['code-terminal'], note: '终端 GIF' },
    { q: '有一堆数据想做成会动的柱状图', expect: ['data-viz'], note: '动态图表' },
    { q: 'Windows 上不想装一堆依赖，最好双击就能出片', expect: ['product-promo', 'html-to-video'], note: '轻量出片约束' },
    { q: '我有一批素材要自动拼成短视频，一天几百条', expect: ['batch-production'], note: '批量产线' },
    { q: '用 React 写视频，能进 CI 自动出片', expect: ['react-stack'], note: 'React + CI' },
    { q: '已有视频想剪掉停顿、自动加字幕', expect: ['post-production'], note: '后期处理' },
    { q: '想生成一个数字人讲解视频', expect: ['ai-generated'], note: '数字人' },
  ];

  it('至少 8/10 命中，并输出逐条 top3', () => {
    let passed = 0;
    const lines: string[] = ['', '｜ # ｜ 句子 ｜ top1 ｜ top2 ｜ top3 ｜ 场景第 1 / 第 2 ｜ 结果'];
    for (const [index, item] of cases.entries()) {
      const result = search.search(item.q);
      const rank = result.scenarioRanking.map((entry) => entry.scenario.id);
      const rankText = result.scenarioRanking
        .map((entry) => `${entry.scenario.id}(${entry.score.toFixed(2)})`)
        .join(' / ');
      const ok = item.expect.some((id) => rank.slice(0, 2).includes(id));
      if (ok) passed += 1;
      const top = result.nearest
        .map((hit) => `${hit.repo.id}(${hit.score.toFixed(2)})`)
        .join(' | ');
      lines.push(
        `｜ ${index + 1} ｜ ${item.q} ｜ ${top || '无'} ｜ ${rankText || '-'} ｜ ${ok ? 'PASS' : 'FAIL'}（期望 ${item.expect.join('|')}，${item.note}）`,
      );
      expect(result.nearest).toHaveLength(3);
      expect(result.hits.length).toBeGreaterThanOrEqual(0);
      expect(result.elapsedMs).toBeLessThan(15);
    }
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));
    expect(passed).toBeGreaterThanOrEqual(8);
  });

  it('命中阈值以上的结果才进入 hits', () => {
    const result = search.search('公司新品发布会要一段 30 秒开场动画');
    for (const hit of result.hits) expect(hit.score).toBeGreaterThanOrEqual(LONG_TEXT_HIT_THRESHOLD);
  });
});
