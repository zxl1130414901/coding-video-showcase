import { describe, expect, it } from 'vitest';
import type { RepoDetail, SampleFeatures } from '../types/repo';
import { makeRepo } from './test-fixtures';
import {
  activeCalloutAt,
  activeSegmentAt,
  buildArchiveCompareRows,
  buildDetailTitle,
  buildFallbackDetail,
  capabilityFields,
  capabilityHighlights,
  detailArchiveLabel,
  detailCompleteness,
  displayName,
  evidenceSummary,
  featureSummary,
  findRepoByReference,
  formatTimeRange,
  formatTimecode,
  isFallbackDetail,
  resolveDetail,
  splitIntoSentences,
  toReadableParagraphs,
} from './detail';

function makeDetail(overrides: Partial<RepoDetail> = {}): RepoDetail {
  return {
    id: 'owner__demo',
    taglineZh: '用 React 组件逐帧生成视频的框架',
    summaryZh: '把视频拆成帧号到组件的纯函数。优势是复用前端生态，代价是需要 Chromium。',
    whatItMakes: [
      { type: '产品宣传片', exampleZh: '网页 UI 实拍与标题动画', strength: '核心能力' },
    ],
    useCases: [
      {
        scenarioZh: 'SaaS 发布片',
        whoZh: '增长团队',
        whyZh: '复用产品真实页面',
        deliverableZh: '1080p30 MP4',
        fit: '高度契合',
      },
      {
        scenarioZh: '数据报告视频化',
        whoZh: '分析师',
        whyZh: '图表与画面同源',
        deliverableZh: '3–8 分钟报告视频',
        fit: '适合',
      },
    ],
    capabilities: {
      maxResolutionZh: '无文档上限，实测 1080p 稳定',
      maxFpsZh: '常用 30/60，未声明硬上限',
      durationZh: '无硬限制，长片建议分片',
      effectsZh: ['React/CSS 画面', '弹簧动画'],
      audioZh: '支持外部音轨',
      interactivityZh: '仅离线渲染',
      automationZh: 'CLI 可进 CI',
      assetsZh: '图片、字体、视频',
      exportFormatsZh: ['MP4', 'PNG 静帧'],
      realtimePreviewZh: '有，Studio 可 scrub',
      ciFriendlyZh: '可进 CI',
    },
    ceilingZh:
      '本地单机实测约 2.4 帧每秒。搬到云端可以按帧分片横向扩展。画面复杂度没有框架级天花板。真正的边界是工程性的：必须跑 Chromium。许可证按公司规模收费。',
    workflow: [
      { stepZh: '初始化工程', detailZh: 'create-video 选模板', effortZh: '约 5 分钟' },
      { stepZh: '写 Composition', detailZh: '在 Root 注册宽高与 fps', effortZh: '1–3 天' },
    ],
    differentiators: ['组件即素材', 'Studio 时间轴', 'Lambda 分片'],
    limits: ['许可证不是 MIT', '强依赖 Chromium', '安装体量大'],
    compareTips: [{ vs: 'other__demo', adviceZh: '要成熟生态选本项' }],
    showcase: {
      demoBriefZh: '四段演示：React 组件、spring 入场、竖屏切换、CLI 渲染。',
      featureCallouts: [{ titleZh: 'React 组件化', descZh: '设计系统直接进视频' }],
    },
    evidence: [
      { field: 'taglineZh', source: 'README.md#L19', noteZh: '官方定位' },
      { field: 'ceilingZh', source: '_samples/meta.json', noteZh: '实测耗时' },
    ],
    ...overrides,
  };
}

function makeFeatures(overrides: Partial<SampleFeatures> = {}): SampleFeatures {
  return {
    durationSec: 26,
    segments: [
      { start: 0, end: 6.2, capabilityZh: '读取数据', proofZh: '解析 23 个原子' },
      { start: 6.2, end: 12.2, capabilityZh: '转图结构', proofZh: '23 节点 / 27 边' },
      { start: 12.2, end: 26, capabilityZh: '原子级动画', proofZh: '逐个高亮' },
    ],
    callouts: [
      { t: 0.5, dur: 4, titleZh: '① 解析', descZh: '读取 mol 文件' },
      { t: 6.5, dur: 4, titleZh: '② 图结构', descZh: '转成图对象' },
    ],
    pipeline: 'official',
    knownLimitsZh: ['3D 分子未纳入演示'],
    ...overrides,
  };
}

describe('详情档案解析', () => {
  it('按 id / owner/repo / 仓库名 / URL 都能解析对比目标', () => {
    const repos = [
      makeRepo({ id: 'owner__demo', owner: 'owner', repo: 'demo' }),
      makeRepo({
        id: 'other__demo',
        owner: 'other',
        repo: 'demo2',
        url: 'https://github.com/other/demo2',
      }),
    ];
    expect(findRepoByReference(repos, 'owner__demo')?.id).toBe('owner__demo');
    expect(findRepoByReference(repos, 'owner/demo')?.id).toBe('owner__demo');
    expect(findRepoByReference(repos, 'demo')?.id).toBe('owner__demo');
    expect(findRepoByReference(repos, 'https://github.com/other/demo2')?.id).toBe('other__demo');
    expect(findRepoByReference(repos, 'not-found')).toBeNull();
    expect(findRepoByReference(repos, '   ')).toBeNull();
  });

  it('档案缺失时生成带 isFallback 的完整回退档案', () => {
    const repo = makeRepo({ id: 'owner__demo', pros: ['上手快'], cons: ['依赖多'] });
    const detail = buildFallbackDetail(repo);
    expect(detail.isFallback).toBe(true);
    expect(detail.id).toBe('owner__demo');
    expect(detail.taglineZh).toBe(repo.descriptionZh);
    expect(detail.limits).toEqual(repo.cons);
    expect(detail.differentiators).toEqual(repo.pros);
    expect(detail.capabilities.maxResolutionZh).toBe('档案未就绪');
    expect(detail.capabilities.exportFormatsZh).toEqual(repo.outputFormats);
  });

  it('resolveDetail 优先真实档案，缺失时回退', () => {
    const repo = makeRepo({ id: 'owner__demo' });
    const details = { owner__demo: makeDetail() };
    expect(resolveDetail(repo, details).isFallback).toBeUndefined();
    expect(resolveDetail(repo, {}).isFallback).toBe(true);
  });

  it('档案状态标签在缺失时明确标注', () => {
    expect(isFallbackDetail(buildFallbackDetail(makeRepo()))).toBe(true);
    expect(detailArchiveLabel(buildFallbackDetail(makeRepo()))).toBe('档案未就绪');
    expect(detailArchiveLabel(makeDetail())).toBe('完整档案 · 2 条证据');
  });

  it('完整档案完整度为 100%，回退档案明显更低', () => {
    expect(detailCompleteness(makeDetail()).percent).toBe(100);
    expect(detailCompleteness(buildFallbackDetail(makeRepo())).percent).toBeLessThan(100);
  });

  it('详情标题包含完整仓库名', () => {
    expect(buildDetailTitle(makeRepo({ id: 'owner__demo', owner: 'owner', repo: 'demo' }))).toBe(
      'owner/demo · 代码转视频横评',
    );
    expect(displayName(makeRepo({ id: 'owner__demo', owner: 'owner', repo: 'demo' }))).toBe(
      'owner/demo',
    );
  });

  it('证据区在无证据时给出明确说明', () => {
    expect(evidenceSummary(makeDetail())).toContain('2 条实测证据');
    expect(evidenceSummary(buildFallbackDetail(makeRepo()))).toContain('暂无可展开');
  });
});

describe('长文重排版', () => {
  it('按中文句末标点切句并保留标点', () => {
    expect(splitIntoSentences('第一句。第二句！第三句？')).toEqual([
      '第一句。',
      '第二句！',
      '第三句？',
    ]);
    expect(splitIntoSentences('')).toEqual([]);
  });

  it('把长文按每段 3 句拆成可读段落', () => {
    const paragraphs = toReadableParagraphs(makeDetail().ceilingZh, 2);
    expect(paragraphs.length).toBe(3);
    expect(paragraphs[0]).toBe('本地单机实测约 2.4 帧每秒。搬到云端可以按帧分片横向扩展。');
    expect(paragraphs.every((item) => item.length > 0)).toBe(true);
    expect(toReadableParagraphs('')).toEqual([]);
  });

  it('能力字段表覆盖 11 个维度并保留标签数组', () => {
    const fields = capabilityFields(makeDetail().capabilities);
    expect(fields).toHaveLength(11);
    expect(fields.map((field) => field.key)).toContain('formats');
    const effects = fields.find((field) => field.key === 'effects');
    expect(effects?.tags).toEqual(['React/CSS 画面', '弹簧动画']);
    expect(capabilityHighlights(makeDetail().capabilities)).toHaveLength(3);
  });

  it('能力数组为空时用明确占位文案而不是 undefined', () => {
    const capabilities = { ...makeDetail().capabilities, effectsZh: [], exportFormatsZh: [] };
    const fields = capabilityFields(capabilities);
    expect(fields.find((field) => field.key === 'effects')?.value).toBe('档案未就绪');
    expect(fields.find((field) => field.key === 'formats')?.value).toBe('档案未就绪');
  });
});

describe('时间轴与能力分段', () => {
  it('时间码格式化为 mm:ss', () => {
    expect(formatTimecode(0)).toBe('00:00');
    expect(formatTimecode(65.4)).toBe('01:05');
    expect(formatTimecode(3599)).toBe('59:59');
    expect(formatTimecode(Number.NaN)).toBe('00:00');
    expect(formatTimeRange(makeFeatures().segments[1] as SampleFeatures['segments'][number])).toBe(
      '00:06–00:12',
    );
  });

  it('按播放时间定位能力分段，末段包含结束时刻', () => {
    const features = makeFeatures();
    expect(activeSegmentAt(features, 0)?.index).toBe(0);
    expect(activeSegmentAt(features, 6.2)?.index).toBe(1);
    expect(activeSegmentAt(features, 25.9)?.index).toBe(2);
    expect(activeSegmentAt(features, 26)?.index).toBe(2);
    expect(activeSegmentAt(features, 27)).toBeNull();
  });

  it('按播放时间定位 callout，区间为左闭右开', () => {
    const features = makeFeatures();
    expect(activeCalloutAt(features, 0.4)).toBeNull();
    expect(activeCalloutAt(features, 0.5)?.index).toBe(0);
    expect(activeCalloutAt(features, 4.4)?.index).toBe(0);
    expect(activeCalloutAt(features, 4.5)).toBeNull();
    expect(activeCalloutAt(features, 6.5)?.index).toBe(1);
  });

  it('能力分段摘要包含段数、callout 与时长', () => {
    expect(featureSummary(makeFeatures())).toBe('3 段能力 · 2 个 callout · 26.0 秒');
  });
});

describe('对比页档案行', () => {
  it('为每个仓库生成 13 行档案级差异并包含回退标记', () => {
    const repos = [
      makeRepo({ id: 'owner__demo', owner: 'owner', repo: 'demo' }),
      makeRepo({ id: 'other__demo', owner: 'other', repo: 'other' }),
    ];
    const details = { owner__demo: makeDetail({ id: 'owner__demo' }) };
    const features = { owner__demo: makeFeatures() };
    const rows = buildArchiveCompareRows(repos, details, features);
    expect(rows).toHaveLength(13);
    expect(rows.map((row) => row.key)).toContain('limits');
    const tagline = rows.find((row) => row.key === 'tagline');
    expect(tagline?.values[0]).toContain('React');
    expect(tagline?.values[1]).toBe(repos[1]?.descriptionZh);
    const useCases = rows.find((row) => row.key === 'useCases');
    expect(useCases?.kind).toBe('list');
    expect(useCases?.values[0]).toBe('SaaS 发布片（增长团队）\n数据报告视频化（分析师）');
    expect(rows.find((row) => row.key === 'features')?.values).toEqual([
      '3 段能力 · 2 个 callout · 26.0 秒',
      '未生成能力分段',
    ]);
  });

  it('档案行缺少列表时不输出 undefined / 空区块', () => {
    const repo = makeRepo({ id: 'empty__repo', pros: [], cons: [] });
    const rows = buildArchiveCompareRows([repo], {}, {});
    for (const row of rows) {
      expect(row.values).toHaveLength(1);
      expect(row.values[0]).not.toContain('undefined');
      expect((row.values[0] ?? '').length).toBeGreaterThan(0);
    }
  });
});
