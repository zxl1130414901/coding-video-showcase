import type { Repo } from '../types/repo';
import { formatIsoDate, formatMs, statusLabel } from './format';
import {
  CLI_LABELS,
  GPU_LABELS,
  WINDOWS_LABELS,
  cliLevel,
  cliRank,
  gpuLevel,
  gpuRank,
  windowsLevel,
  windowsRank,
} from './flags';
import { computeOverallScore } from './scores';

export interface CompareMetric {
  key: string;
  label: string;
  hint: string;
  values: string[];
  numeric: Array<number | null>;
  higherIsBetter: boolean;
  highlight: boolean;
}

function overall(repo: Repo): number {
  return computeOverallScore(repo.scores);
}

function sampleRank(status: string): number {
  if (status === 'ok') return 3;
  if (status === 'failed') return 1;
  if (status === 'skipped') return 2;
  return 0;
}

export function buildCompareMetrics(repos: Repo[]): CompareMetric[] {
  const metric = (
    key: string,
    label: string,
    hint: string,
    map: (repo: Repo) => string,
    num: (repo: Repo) => number | null,
    higherIsBetter = true,
    highlight = true,
  ): CompareMetric => ({
    key,
    label,
    hint,
    values: repos.map(map),
    numeric: repos.map(num),
    higherIsBetter,
    highlight,
  });

  return [
    metric(
      'overall',
      '综合分',
      '六维加权（1-5）',
      (repo) => `${overall(repo).toFixed(1)} / 5.0`,
      overall,
    ),
    metric(
      'stars',
      'Star 数',
      '社区认可度',
      (repo) => `${repo.stars}`,
      (repo) => repo.stars,
    ),
    metric(
      'updated',
      '最近更新',
      'pushedAt',
      (repo) => formatIsoDate(repo.pushedAt),
      (repo) => new Date(repo.pushedAt).getTime(),
    ),
    metric(
      'install',
      '安装难度',
      '1 最易 - 5 最难',
      (repo) => `${repo.installComplexity} / 5`,
      (repo) => repo.installComplexity,
      false,
    ),
    metric(
      'render',
      '实测渲染耗时',
      '样例总耗时',
      (repo) => formatMs(repo.renderPerf?.totalMs),
      (repo) => repo.renderPerf?.totalMs ?? null,
      false,
    ),
    metric(
      'sample',
      '样例状态',
      '真实出片结果',
      (repo) => statusLabel(repo.sample.status),
      (repo) => sampleRank(repo.sample.status),
    ),
    metric(
      'windows',
      'Windows 支持',
      '本机可运行',
      (repo) => WINDOWS_LABELS[windowsLevel(repo.windowsSupport)],
      (repo) => windowsRank(repo.windowsSupport),
    ),
    metric(
      'gpu',
      'GPU 加速',
      '是否依赖显卡',
      (repo) => GPU_LABELS[gpuLevel(repo.gpuAcceleration)],
      (repo) => gpuRank(repo.gpuAcceleration),
      true,
      false,
    ),
    metric(
      'cli',
      '无头 CLI',
      'CI 可自动化',
      (repo) => CLI_LABELS[cliLevel(repo.cliHeadless)],
      (repo) => cliRank(repo.cliHeadless),
    ),
    metric(
      'maturity',
      '成熟度',
      '评分',
      (repo) => `${repo.scores.maturity} / 5`,
      (repo) => repo.scores.maturity,
    ),
    metric(
      'usability',
      '易用性',
      '评分',
      (repo) => `${repo.scores.usability} / 5`,
      (repo) => repo.scores.usability,
    ),
    metric(
      'performance',
      '性能',
      '评分',
      (repo) => `${repo.scores.performance} / 5`,
      (repo) => repo.scores.performance,
    ),
    metric(
      'docs',
      '文档',
      '评分',
      (repo) => `${repo.scores.docs} / 5`,
      (repo) => repo.scores.docs,
    ),
    metric(
      'activity',
      '活跃度',
      '评分',
      (repo) => `${repo.scores.activity} / 5`,
      (repo) => repo.scores.activity,
    ),
  ];
}

/** 返回最优/最差列下标；全部相同或有效值不足两个时返回空数组。 */
export function pickExtremes(
  values: Array<number | null>,
  higherIsBetter: boolean,
): {
  best: number[];
  worst: number[];
} {
  const valid = values
    .map((value, index) => ({ value, index }))
    .filter((item): item is { value: number; index: number } => item.value !== null);
  if (valid.length < 2) return { best: [], worst: [] };
  const uniqueValues = new Set(valid.map((item) => item.value));
  if (uniqueValues.size < 2) return { best: [], worst: [] };
  const max = Math.max(...valid.map((item) => item.value));
  const min = Math.min(...valid.map((item) => item.value));
  if (higherIsBetter) {
    return {
      best: valid.filter((item) => item.value === max).map((item) => item.index),
      worst: valid.filter((item) => item.value === min).map((item) => item.index),
    };
  }
  return {
    best: valid.filter((item) => item.value === min).map((item) => item.index),
    worst: valid.filter((item) => item.value === max).map((item) => item.index),
  };
}

export function compareWinner(repos: Repo[]): Repo | null {
  if (repos.length === 0) return null;
  return [...repos].sort((a, b) => overall(b) - overall(a))[0] ?? null;
}

function displayName(repo: Repo): string {
  return `${repo.owner}/${repo.repo}`;
}

function bestBy(
  repos: Repo[],
  getter: (repo: Repo) => number | null,
  higherIsBetter = true,
): Repo | null {
  const valid = repos.filter((repo) => getter(repo) !== null);
  if (valid.length === 0) return null;
  return (
    [...valid].sort((a, b) => {
      const av = getter(a) ?? 0;
      const bv = getter(b) ?? 0;
      return higherIsBetter ? bv - av : av - bv;
    })[0] ?? null
  );
}

/** 导出为可粘贴的 Markdown 对比结论。 */
export function buildCompareMarkdown(repos: Repo[], now: Date = new Date()): string {
  if (repos.length === 0) return '# 项目对比结论\n\n暂未选择项目。\n';
  const winner = compareWinner(repos);
  const mostStars = bestBy(repos, (repo) => repo.stars);
  const easiest = bestBy(repos, (repo) => repo.installComplexity, false);
  const fastest = bestBy(repos, (repo) => repo.renderPerf?.totalMs ?? null, false);
  const rows = buildCompareMetrics(repos);

  const lines: string[] = [
    '# 代码转视频项目对比结论',
    '',
    `- 生成时间：${formatIsoDate(now.toISOString())}`,
    `- 参与项目：${repos.map(displayName).join(' / ')}`,
    '',
    '## 综合结论',
    '',
    winner ? `- 综合分最高：**${displayName(winner)}**（${overall(winner).toFixed(1)} / 5.0）` : '',
    mostStars ? `- Star 最多：${displayName(mostStars)}（${mostStars.stars}）` : '',
    easiest ? `- 安装最简单：${displayName(easiest)}（难度 ${easiest.installComplexity} / 5）` : '',
    fastest
      ? `- 实测渲染最快：${displayName(fastest)}（${formatMs(fastest.renderPerf?.totalMs)}）`
      : '',
    '',
    '## 维度对比',
    '',
    `| 维度 | ${repos.map(displayName).join(' | ')} |`,
    `| --- | ${repos.map(() => '---').join(' | ')} |`,
  ].filter((line) => line !== null);

  for (const row of rows) {
    lines.push(
      `| ${row.label} | ${row.values.map((value) => value.replace(/\|/g, '\\|')).join(' | ')} |`,
    );
  }

  lines.push('', '## 适用场景', '');
  for (const repo of repos) {
    lines.push(`- **${displayName(repo)}**：${repo.bestFor}`);
  }
  lines.push('', '## 主要风险', '');
  for (const repo of repos) {
    const pitfalls = repo.pitfalls.length > 0 ? repo.pitfalls.join('；') : '暂无记录';
    lines.push(`- **${displayName(repo)}**：${pitfalls}`);
  }
  return `${lines.join('\n')}\n`;
}
