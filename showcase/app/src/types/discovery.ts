/** 与 ..\data\discovery.json 严格对齐的选型契约（字段名不可更改）。 */

export type Verdict = 'first' | 'alt' | 'heavy';

export interface ScenarioRecommendation {
  repoId: string;
  verdict: Verdict;
  whyZh: string;
  timeZh: string;
}

export interface ScenarioFilters {
  categories: string[];
  tags: string[];
}

export interface DiscoveryScenario {
  id: string;
  titleZh: string;
  descZh: string;
  questionZh: string;
  recommended: ScenarioRecommendation[];
  filters: ScenarioFilters;
}

export type ConstraintField =
  | 'windowsTier'
  | 'needsGpu'
  | 'installComplexity'
  | 'pipeline'
  | 'hasCli'
  | 'batchable';

export type ConstraintOp = 'in' | 'eq' | 'lte' | 'gte';

export interface DiscoveryConstraint {
  id: string;
  titleZh: string;
  descZh: string;
  apply: {
    type: 'field';
    field: ConstraintField;
    op: ConstraintOp;
    value: string | string[] | number | boolean;
  };
}

export interface QuickPick {
  needZh: string;
  repoId: string;
  whyZh: string;
  timeZh: string;
}

export interface DiscoveryWarning {
  scopeZh: string;
  riskZh: string;
}

export interface DiscoveryDoc {
  updatedAt?: string;
  scenarios: DiscoveryScenario[];
  constraints: DiscoveryConstraint[];
  quickPicks: QuickPick[];
  synonyms: Record<string, string[]>;
  warnings: DiscoveryWarning[];
}

export function emptyDiscovery(): DiscoveryDoc {
  return {
    scenarios: [],
    constraints: [],
    quickPicks: [],
    synonyms: {},
    warnings: [],
  };
}
