/** 详情页纯函数：档案回退、能力字段、文本排版、时间轴与对比行。 */

import type {
  DetailCapabilities,
  DetailRecord,
  FeatureCallout,
  FeatureSegment,
  Repo,
  RepoDetail,
  SampleFeatures,
} from '../types/repo';

export interface CapabilityField {
  key: string;
  label: string;
  value: string;
  tags?: string[];
}

export interface ArchiveCompareRow {
  key: string;
  label: string;
  hint: string;
  kind: 'text' | 'list';
  values: string[];
}

const FALLBACK = '档案未就绪';

export function displayName(repo: Repo): string {
  return `${repo.owner}/${repo.repo}`;
}

/** 把 compareTips.vs / alternatives 的引用解析成具体仓库。 */
export function findRepoByReference(repos: Repo[], reference: string): Repo | null {
  const needle = reference.trim().toLowerCase();
  if (!needle) return null;
  return (
    repos.find((repo) => {
      const full = displayName(repo).toLowerCase();
      return (
        repo.id.toLowerCase() === needle ||
        full === needle ||
        repo.repo.toLowerCase() === needle ||
        repo.url.toLowerCase() === needle
      );
    }) ?? null
  );
}

/** 深度档案缺失时，用 repos.json 的基础字段拼出一份可读的回退档案。 */
export function buildFallbackDetail(repo: Repo): DetailRecord {
  return {
    id: repo.id,
    isFallback: true,
    taglineZh: repo.descriptionZh,
    summaryZh: [repo.descriptionZh, repo.bestFor].filter(Boolean).join(' '),
    whatItMakes: [
      {
        type: '基础定位',
        exampleZh: repo.bestFor,
        strength: '基础档案',
      },
    ],
    useCases: [
      {
        scenarioZh: repo.bestFor,
        whoZh: '待补充',
        whyZh: '来自 repos.json 的基础定位，深度场景档案尚未生成。',
        deliverableZh: '待补充',
        fit: '档案未就绪',
      },
    ],
    capabilities: {
      maxResolutionZh: FALLBACK,
      maxFpsZh: FALLBACK,
      durationZh: FALLBACK,
      effectsZh: [],
      audioZh: FALLBACK,
      interactivityZh: FALLBACK,
      automationZh: FALLBACK,
      assetsZh: FALLBACK,
      exportFormatsZh: repo.outputFormats,
      realtimePreviewZh: FALLBACK,
      ciFriendlyZh: FALLBACK,
    },
    ceilingZh:
      '该项目的深度能力档案尚未生成。以下内容来自 repos.json 的基础字段，仅用于保证页面可用；补齐 details 档案后会自动替换为完整评测。',
    workflow: [],
    differentiators: repo.pros,
    limits: repo.cons,
    compareTips: repo.alternatives.map((vs) => ({
      vs,
      adviceZh: '基础档案未提供对比建议，请先查看对方详情页。',
    })),
    showcase: { demoBriefZh: repo.sample.noteZh ?? '', featureCallouts: [] },
    evidence: [],
  };
}

export function resolveDetail(repo: Repo, details: Record<string, RepoDetail>): DetailRecord {
  return details[repo.id] ?? buildFallbackDetail(repo);
}

export function isFallbackDetail(detail: DetailRecord | null | undefined): boolean {
  return Boolean(detail?.isFallback);
}

export function detailArchiveLabel(detail: DetailRecord): string {
  if (detail.isFallback) return FALLBACK;
  return `完整档案 · ${detail.evidence.length} 条证据`;
}

/** 档案完整度：用于详情页顶部的小徽章与对比行。 */
export function detailCompleteness(detail: DetailRecord): {
  filled: number;
  total: number;
  percent: number;
} {
  const checks = [
    Boolean(detail.taglineZh),
    Boolean(detail.summaryZh),
    detail.whatItMakes.length > 0,
    detail.useCases.length > 0,
    Object.values(detail.capabilities).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    ),
    Boolean(detail.ceilingZh),
    detail.workflow.length > 0,
    detail.differentiators.length > 0,
    detail.limits.length > 0,
    detail.compareTips.length > 0,
    detail.evidence.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  const total = checks.length;
  return { filled, total, percent: Math.round((filled / total) * 100) };
}

/** 按中文句末标点切句，保留标点。 */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？；])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

/** 把长文按每段最多 maxSentences 句重排，避免一整段灰字。 */
export function toReadableParagraphs(text: string, maxSentences = 3): string[] {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return [];
  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += maxSentences) {
    paragraphs.push(sentences.slice(index, index + maxSentences).join(''));
  }
  return paragraphs;
}

export function capabilityFields(capabilities: DetailCapabilities): CapabilityField[] {
  return [
    { key: 'resolution', label: '最高分辨率', value: capabilities.maxResolutionZh },
    { key: 'fps', label: '最高帧率', value: capabilities.maxFpsZh },
    { key: 'duration', label: '时长能力', value: capabilities.durationZh },
    {
      key: 'effects',
      label: '效果能力',
      value: capabilities.effectsZh.join('；') || FALLBACK,
      tags: capabilities.effectsZh,
    },
    { key: 'audio', label: '音频', value: capabilities.audioZh },
    { key: 'interactivity', label: '交互', value: capabilities.interactivityZh },
    { key: 'automation', label: '自动化', value: capabilities.automationZh },
    { key: 'assets', label: '素材', value: capabilities.assetsZh },
    {
      key: 'formats',
      label: '导出格式',
      value: capabilities.exportFormatsZh.join(' / ') || FALLBACK,
      tags: capabilities.exportFormatsZh,
    },
    { key: 'preview', label: '实时预览', value: capabilities.realtimePreviewZh },
    { key: 'ci', label: 'CI 友好', value: capabilities.ciFriendlyZh },
  ];
}

export function capabilityHighlights(capabilities: DetailCapabilities): CapabilityField[] {
  return capabilityFields(capabilities).slice(0, 3);
}

/** 秒 -> mm:ss；用于 callout 时间轴。 */
export function formatTimecode(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

export function formatTimeRange(segment: FeatureSegment): string {
  return `${formatTimecode(segment.start)}–${formatTimecode(segment.end)}`;
}

export interface ActiveFeature<T> {
  index: number;
  value: T;
}

export function activeSegmentAt(
  features: SampleFeatures,
  time: number,
): ActiveFeature<FeatureSegment> | null {
  const index = features.segments.findIndex(
    (segment, position) =>
      time >= segment.start &&
      (time < segment.end || (position === features.segments.length - 1 && time <= segment.end)),
  );
  return index >= 0 ? { index, value: features.segments[index] as FeatureSegment } : null;
}

export function activeCalloutAt(
  features: SampleFeatures,
  time: number,
): ActiveFeature<FeatureCallout> | null {
  const index = features.callouts.findIndex(
    (callout) => time >= callout.t && time < callout.t + callout.dur,
  );
  return index >= 0 ? { index, value: features.callouts[index] as FeatureCallout } : null;
}

export function featureSummary(features: SampleFeatures): string {
  const segments = features.segments.length;
  const callouts = features.callouts.length;
  return `${segments} 段能力 · ${callouts} 个 callout · ${features.durationSec.toFixed(1)} 秒`;
}

/** 对比页：档案级差异（能力上限、场景、短板），不只基础字段。 */
export function buildArchiveCompareRows(
  repos: Repo[],
  details: Record<string, RepoDetail>,
  features: Record<string, SampleFeatures>,
): ArchiveCompareRow[] {
  const resolved = repos.map((repo) => resolveDetail(repo, details));
  const row = (
    key: string,
    label: string,
    hint: string,
    map: (detail: DetailRecord, repo: Repo) => string,
    kind: 'text' | 'list' = 'text',
  ): ArchiveCompareRow => ({
    key,
    label,
    hint,
    kind,
    values: resolved.map((detail, index) => map(detail, repos[index] as Repo)),
  });

  return [
    row('tagline', '核心定位', '来自深度档案', (detail) => detail.taglineZh || FALLBACK),
    row(
      'resolution',
      '分辨率上限',
      'capabilities',
      (detail) => detail.capabilities.maxResolutionZh,
    ),
    row('fps', '帧率上限', 'capabilities', (detail) => detail.capabilities.maxFpsZh),
    row('duration', '时长能力', 'capabilities', (detail) => detail.capabilities.durationZh),
    row(
      'formats',
      '导出格式',
      'capabilities',
      (detail) => detail.capabilities.exportFormatsZh.join(' / ') || FALLBACK,
    ),
    row(
      'useCases',
      '适用场景',
      '前 2 个场景 · 人群',
      (detail) =>
        detail.useCases
          .slice(0, 2)
          .map((item) => `${item.scenarioZh}（${item.whoZh}）`)
          .join('\n') || FALLBACK,
      'list',
    ),
    row('workflow', '工作流', '步骤数 · 第一步', (detail) =>
      detail.workflow.length > 0
        ? `${detail.workflow.length} 步 · ${detail.workflow[0]?.stepZh ?? ''}`
        : FALLBACK,
    ),
    row('automation', '自动化', 'capabilities', (detail) => detail.capabilities.automationZh),
    row('preview', '实时预览', 'capabilities', (detail) => detail.capabilities.realtimePreviewZh),
    row('ci', 'CI 友好', 'capabilities', (detail) => detail.capabilities.ciFriendlyZh),
    row(
      'limits',
      '硬短板',
      '档案 limits，前 3 条',
      (detail) => detail.limits.slice(0, 3).join('\n') || FALLBACK,
      'list',
    ),
    row(
      'differentiators',
      '差异化',
      '档案 differentiators，前 3 条',
      (detail) => detail.differentiators.slice(0, 3).join('\n') || FALLBACK,
      'list',
    ),
    row('features', '能力分段', 'features.json', (_detail, repo) => {
      const feature = features[repo.id];
      return feature ? featureSummary(feature) : '未生成能力分段';
    }),
  ];
}

export function buildDetailTitle(repo: Repo): string {
  return `${displayName(repo)} · 代码转视频横评`;
}

export function evidenceSummary(detail: DetailRecord): string {
  if (detail.evidence.length === 0) return '该档案暂无可展开的实测证据。';
  return `${detail.evidence.length} 条实测证据，均来自仓库源码或本机样例产物。`;
}
