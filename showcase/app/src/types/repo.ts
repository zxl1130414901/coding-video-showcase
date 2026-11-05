/** 与 ..\data\repos.json 严格对齐的数据契约（字段名不可更改）。 */

export type SampleStatus = 'ok' | 'failed' | 'skipped' | 'unknown';

export interface RenderPerf {
  totalMs: number;
  frames: number;
  width: number;
  height: number;
  fps: number;
}

export interface SampleSpec {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  frames: number;
  bytes: number;
  codec: string;
}

export interface SampleInfo {
  status: SampleStatus | string;
  videoPath: string | null;
  thumbPath: string | null;
  pipeline: string | null;
  spec: SampleSpec | null;
  noteZh: string;
}

export interface Scores {
  maturity: number;
  usability: number;
  performance: number;
  docs: number;
  windows: number;
  activity: number;
}

export interface Repo {
  id: string;
  owner: string;
  repo: string;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number | null;
  openIssues: number | null;
  license: string | null;
  language: string | null;
  createdAt: string;
  updatedAt: string | null;
  pushedAt: string;
  descriptionZh: string;
  category: string;
  techStack: string[];
  renderBackends: string[];
  outputFormats: string[];
  /** 真实数据为枚举字符串（required/optional/none/unknown）。 */
  gpuAcceleration: boolean | string;
  /** 真实数据为枚举字符串（yes/partial/no）。 */
  cliHeadless: boolean | string;
  /** 真实数据为枚举字符串（works/workaround/broken/unknown）。 */
  windowsSupport: boolean | string;
  installComplexity: number;
  renderPerf: RenderPerf | null;
  sample: SampleInfo;
  scores: Scores;
  pros: string[];
  cons: string[];
  bestFor: string;
  pitfalls: string[];
  alternatives: string[];
  tags: string[];
  /** 数据文件若额外提供本地目录，则优先使用。 */
  localPath?: string;
  /** 文章新增条目的来源标记，如 article:xxx。 */
  source?: string;
}

export interface DatasetMeta {
  title?: string;
  generatedAt?: string;
  note?: string;
  [key: string]: unknown;
}

export interface Dataset {
  meta: DatasetMeta;
  repos: Repo[];
}

export type ViewKey = 'overview' | 'matrix' | 'timeline' | 'detail';

/* ================================================================
   深度档案：与 ..\data\details\<id>.json 严格对齐
   ================================================================ */

export interface WhatItMakesItem {
  type: string;
  exampleZh: string;
  strength: string;
}

export interface UseCaseItem {
  scenarioZh: string;
  whoZh: string;
  whyZh: string;
  deliverableZh: string;
  fit: string;
}

export interface DetailCapabilities {
  maxResolutionZh: string;
  maxFpsZh: string;
  durationZh: string;
  effectsZh: string[];
  audioZh: string;
  interactivityZh: string;
  automationZh: string;
  assetsZh: string;
  exportFormatsZh: string[];
  realtimePreviewZh: string;
  ciFriendlyZh: string;
}

export interface WorkflowStep {
  stepZh: string;
  detailZh: string;
  effortZh: string;
}

export interface CompareTip {
  vs: string;
  adviceZh: string;
}

export interface ShowcaseCallout {
  titleZh: string;
  descZh: string;
}

export interface ShowcaseInfo {
  demoBriefZh: string;
  featureCallouts: ShowcaseCallout[];
}

export interface DetailEvidence {
  field: string;
  source: string;
  noteZh: string;
}

export interface RepoDetail {
  id: string;
  taglineZh: string;
  summaryZh: string;
  whatItMakes: WhatItMakesItem[];
  useCases: UseCaseItem[];
  capabilities: DetailCapabilities;
  ceilingZh: string;
  workflow: WorkflowStep[];
  differentiators: string[];
  limits: string[];
  compareTips: CompareTip[];
  showcase: ShowcaseInfo;
  evidence: DetailEvidence[];
}

/** _samples/<id>/features.json：能力分段与 callout 时间轴（可能尚未生成）。 */
export interface FeatureSegment {
  start: number;
  end: number;
  capabilityZh: string;
  proofZh: string;
}

export interface FeatureCallout {
  t: number;
  dur: number;
  titleZh: string;
  descZh: string;
}

export interface SampleFeatures {
  id?: string;
  durationSec: number;
  segments: FeatureSegment[];
  callouts: FeatureCallout[];
  pipeline?: string;
  renderMs?: number;
  knownLimitsZh?: string[];
}

/** 详情页运行时档案：缺失时由基础字段合成的回退档案。 */
export interface DetailRecord extends RepoDetail {
  isFallback?: boolean;
}

export type SortKey =
  | 'name'
  | 'stars'
  | 'updated'
  | 'category'
  | 'language'
  | 'backends'
  | 'formats'
  | 'gpu'
  | 'cli'
  | 'windows'
  | 'install'
  | 'render'
  | 'sample'
  | 'overall';

export type SortDirection = 'asc' | 'desc';

export type TriState = 'all' | 'yes' | 'no';

export interface FilterState {
  q: string;
  categories: string[];
  statuses: string[];
  languages: string[];
  licenses: string[];
  windows: TriState;
  gpu: TriState;
}

export interface RouteState {
  view: ViewKey;
  repoId: string | null;
  /** 从哪个视图进入详情，用于返回时保留上下文。 */
  fromView: ViewKey | null;
  filters: FilterState;
  sortKey: SortKey;
  sortDir: SortDirection;
  selected: string[];
}
