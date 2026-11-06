import type { Repo, RepoDetail } from '../types/repo';
import type {
  ConstraintField,
  DiscoveryConstraint,
  DiscoveryDoc,
  DiscoveryScenario,
  DiscoveryWarning,
  ScenarioRecommendation,
} from '../types/discovery';
import { computeOverallScore } from './scores';
import { cliLevel, gpuLevel, windowsLevel } from './flags';

/* ================================================================
   约束判定（与 showcase/scripts/validate-discovery.mjs 同一口径）
   ================================================================ */

export function pipelineOf(repo: Repo): string {
  return repo.sample?.pipeline ?? 'none';
}

export function batchableOf(repo: Repo): boolean {
  return cliLevel(repo.cliHeadless) === 'yes' && ['official', 'wrapper'].includes(pipelineOf(repo));
}

export function constraintValue(
  repo: Repo,
  field: ConstraintField,
): string | number | boolean | null {
  switch (field) {
    case 'windowsTier':
      return windowsLevel(repo.windowsSupport);
    case 'needsGpu':
      return gpuLevel(repo.gpuAcceleration);
    case 'installComplexity':
      return repo.installComplexity;
    case 'pipeline':
      return pipelineOf(repo);
    case 'hasCli':
      return cliLevel(repo.cliHeadless);
    case 'batchable':
      return batchableOf(repo);
    default:
      return null;
  }
}

export function matchesConstraint(repo: Repo, constraint: DiscoveryConstraint): boolean {
  const { apply } = constraint;
  const value = constraintValue(repo, apply.field);
  if (value === null) return false;
  if (apply.op === 'in') {
    const list = Array.isArray(apply.value)
      ? (apply.value as Array<string | number | boolean>)
      : [];
    return list.includes(value);
  }
  if (apply.op === 'eq') return value === apply.value;
  const left = Number(value);
  const right = Number(apply.value);
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  return apply.op === 'lte' ? left <= right : left >= right;
}

export interface ConstraintResult {
  repo: Repo;
  matched: DiscoveryConstraint[];
}

/** 多选约束为 AND 叠加；返回通过全部约束的仓库与它们满足的约束列表。 */
export function applyConstraints(
  repos: Repo[],
  constraints: DiscoveryConstraint[],
  selectedIds: string[],
): ConstraintResult[] {
  const active = constraints.filter((constraint) => selectedIds.includes(constraint.id));
  if (active.length === 0) return repos.map((repo) => ({ repo, matched: [] }));
  return repos
    .filter((repo) => active.every((constraint) => matchesConstraint(repo, constraint)))
    .map((repo) => ({ repo, matched: active }));
}

/* ================================================================
   场景匹配
   ================================================================ */

export function scenarioFirst(scenario: DiscoveryScenario): ScenarioRecommendation | null {
  return scenario.recommended.find((item) => item.verdict === 'first') ?? null;
}

export function scenarioRecommendation(
  scenario: DiscoveryScenario,
  repoId: string,
): ScenarioRecommendation | null {
  return scenario.recommended.find((item) => item.repoId === repoId) ?? null;
}

export interface ScenarioRepoMatch {
  repo: Repo;
  reasons: string[];
}

/** 场景的「全部符合条件仓库」：分类或标签命中即算，首选与推荐项目始终包含。 */
export function reposForScenario(repos: Repo[], scenario: DiscoveryScenario): ScenarioRepoMatch[] {
  const recommendedIds = new Set(scenario.recommended.map((item) => item.repoId));
  const categories = scenario.filters.categories ?? [];
  const tags = scenario.filters.tags ?? [];

  const matches = repos
    .map((repo) => {
      const reasons: string[] = [];
      if (categories.includes(repo.category)) reasons.push(`分类：${repo.category}`);
      for (const tag of tags) {
        if (repo.tags.includes(tag)) reasons.push(`标签：${tag}`);
      }
      if (recommendedIds.has(repo.id)) reasons.push('场景推荐');
      return { repo, reasons };
    })
    .filter((item) => item.reasons.length > 0);

  matches.sort((a, b) => {
    const firstA = a.reasons.includes('场景推荐') ? 1 : 0;
    const firstB = b.reasons.includes('场景推荐') ? 1 : 0;
    if (firstA !== firstB) return firstB - firstA;
    return computeOverallScore(b.repo.scores) - computeOverallScore(a.repo.scores);
  });
  return matches;
}

/** 场景卡片按 first → alt → heavy 排序，仅保留仓库真实存在的条目。 */
export function orderedRecommendations(
  scenario: DiscoveryScenario,
  repoById: Map<string, Repo>,
): Array<{ recommendation: ScenarioRecommendation; repo: Repo }> {
  const order: Record<ScenarioRecommendation['verdict'], number> = { first: 0, alt: 1, heavy: 2 };
  return scenario.recommended
    .filter((item) => repoById.has(item.repoId))
    .sort((a, b) => order[a.verdict] - order[b.verdict])
    .map((recommendation) => ({ recommendation, repo: repoById.get(recommendation.repoId)! }));
}

/* ================================================================
   同义词扩展搜索
   ================================================================ */

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

function isRepoId(value: string): boolean {
  return value.includes('__');
}

function repoTokens(value: string): string[] {
  if (!isRepoId(value)) return [];
  const name = value.slice(value.indexOf('__') + 2);
  return name.length >= 3 ? [name] : [];
}

/** 找出与查询相关的同义词映射，并展开为仓库 id、仓库名片段与能力词。 */
export function expandSynonyms(query: string, synonyms: Record<string, string[]>): string[] {
  const needle = normalize(query);
  if (!needle) return [];
  const out = new Set<string>();
  for (const [key, values] of Object.entries(synonyms)) {
    const normalizedKey = normalize(key);
    if (!normalizedKey) continue;
    if (
      normalizedKey === needle ||
      normalizedKey.includes(needle) ||
      needle.includes(normalizedKey)
    ) {
      for (const value of values) {
        out.add(value);
        for (const token of repoTokens(value)) out.add(token);
      }
    }
  }
  return [...out];
}

function buildHaystack(repo: Repo, detail?: RepoDetail): string {
  const parts: string[] = [
    repo.descriptionZh,
    repo.category,
    repo.language ?? '',
    ...repo.tags,
    ...repo.techStack,
  ];
  if (detail) {
    parts.push(detail.taglineZh, detail.summaryZh);
    for (const item of detail.whatItMakes) parts.push(item.type, item.exampleZh);
    for (const item of detail.useCases) {
      parts.push(item.scenarioZh, item.whoZh, item.whyZh, item.deliverableZh);
    }
  }
  return normalize(parts.join(' '));
}

export interface SearchHit {
  repo: Repo;
  score: number;
  matchedTerms: string[];
}

interface RepoSearchScore {
  score: number;
  matchedTerms: string[];
}

function scoreRepo(
  haystack: string,
  repo: Repo,
  terms: Set<string>,
  priority: Map<string, number>,
): RepoSearchScore {
  const id = repo.id.toLowerCase();
  const name = repo.repo.toLowerCase();
  let bestIdScore = 0;
  let exactRepo = false;
  let idBonus = 0;
  const matched = new Set<string>();
  const textMatched = new Set<string>();

  for (const term of terms) {
    const t = normalize(term);
    if (!t) continue;
    let idHit = false;
    if (id === t) {
      bestIdScore = Math.max(bestIdScore, 120);
      exactRepo = true;
      idBonus = Math.max(idBonus, priority.get(term) ?? 0);
      idHit = true;
    } else if (id.includes(t)) {
      bestIdScore = Math.max(bestIdScore, 60);
      idBonus = Math.max(idBonus, priority.get(term) ?? 0);
      idHit = true;
    } else if (name === t) {
      bestIdScore = Math.max(bestIdScore, 50);
      idBonus = Math.max(idBonus, priority.get(term) ?? 0);
      idHit = true;
    } else if (name.includes(t)) {
      bestIdScore = Math.max(bestIdScore, 40);
      idBonus = Math.max(idBonus, priority.get(term) ?? 0);
      idHit = true;
    }
    if (idHit) matched.add(term);
    else if (haystack.includes(t)) {
      matched.add(term);
      textMatched.add(t);
    }
  }

  let score = bestIdScore + (exactRepo ? 40 : 0) + idBonus + Math.min(textMatched.size, 3) * 18;
  if (matched.size >= 2) score += 30;
  return { score, matchedTerms: [...matched] };
}

/** 搜索仓库：原词 + 同义词展开，命中仓库名 / tagline / 分类 / 技术栈 / 标签 / useCases。 */
export function searchRepos(
  repos: Repo[],
  query: string,
  synonyms: Record<string, string[]>,
  details: Record<string, RepoDetail> = {},
): SearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const expanded = expandSynonyms(trimmed, synonyms);
  const priority = new Map<string, number>();
  expanded.forEach((term, index) => {
    if (!priority.has(term)) priority.set(term, Math.max(0, 18 - index * 4));
  });

  const terms = new Set<string>([trimmed, ...trimmed.split(/\s+/).filter(Boolean), ...expanded]);

  const hits: SearchHit[] = [];
  for (const repo of repos) {
    const haystack = buildHaystack(repo, details[repo.id]);
    const result = scoreRepo(haystack, repo, terms, priority);
    if (result.score > 0)
      hits.push({ repo, score: result.score, matchedTerms: result.matchedTerms });
  }

  return hits.sort(
    (a, b) =>
      b.score - a.score ||
      computeOverallScore(b.repo.scores) - computeOverallScore(a.repo.scores) ||
      a.repo.id.localeCompare(b.repo.id),
  );
}

/* ================================================================
   「按你的说法，最接近的是 …」场景推荐
   ================================================================ */

export interface ScenarioSuggestion {
  scenario: DiscoveryScenario;
  score: number;
}

export function suggestScenarios(
  query: string,
  scenarios: DiscoveryScenario[],
  synonyms: Record<string, string[]>,
  limit = 2,
): ScenarioSuggestion[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const tokens = [normalize(trimmed), ...trimmed.split(/\s+/).map(normalize).filter(Boolean)];
  const targets = expandSynonyms(trimmed, synonyms);
  const normalizedTargets = targets.map(normalize).filter(Boolean);

  const results: ScenarioSuggestion[] = [];
  for (const scenario of scenarios) {
    let score = 0;
    const text = normalize(
      [
        scenario.titleZh,
        scenario.descZh,
        scenario.questionZh,
        ...(scenario.filters.tags ?? []),
      ].join(' '),
    );
    for (const token of tokens) {
      if (token && text.includes(token)) score += token === normalize(trimmed) ? 30 : 14;
    }
    for (const recommendation of scenario.recommended) {
      const repoId = recommendation.repoId.toLowerCase();
      if (normalizedTargets.some((target) => repoId.includes(target))) {
        score += 18;
        if (recommendation.verdict === 'first') score += 10;
      }
    }
    if (score > 0) results.push({ scenario, score });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** 无结果时的可点推荐词。 */
export const FALLBACK_QUERIES = ['数学动画', '终端录屏', 'React 视频'] as const;

/* ================================================================
   其他
   ================================================================ */

export function repoByIdMap(repos: Repo[]): Map<string, Repo> {
  return new Map(repos.map((repo) => [repo.id, repo]));
}

export function quickPickRepos(
  doc: DiscoveryDoc,
  repoById: Map<string, Repo>,
): Array<{ pick: DiscoveryDoc['quickPicks'][number]; repo: Repo }> {
  return doc.quickPicks
    .filter((pick) => repoById.has(pick.repoId))
    .map((pick) => ({ pick, repo: repoById.get(pick.repoId)! }));
}

export function warningsForRepo(warnings: DiscoveryWarning[], repo: Repo): DiscoveryWarning[] {
  return warnings.filter((warning) => {
    const scope = warning.scopeZh.toLowerCase();
    return (
      scope.includes(repo.id.toLowerCase()) ||
      scope.includes(`${repo.owner}/${repo.repo}`.toLowerCase()) ||
      scope.includes(repo.repo.toLowerCase())
    );
  });
}

/** 场景备选项的推荐语与使用建议（由 verdict 与实测时间派生，不新增事实）。 */
export function verdictAdvice(recommendation: ScenarioRecommendation): {
  whyNotFirstZh: string;
  chooseWhenZh: string;
} {
  if (recommendation.verdict === 'heavy') {
    return {
      whyNotFirstZh: '安装或运行环境代价明显更高，适合当能力参考而不是默认起点。',
      chooseWhenZh: `只有确实需要它的独有能力时再试；先准备 ${recommendation.timeZh}。`,
    };
  }
  return {
    whyNotFirstZh: '综合链路比首选多一步取舍，差异点见右侧说明。',
    chooseWhenZh: `需要它的差异点、且能接受「${recommendation.timeZh}」时选它。`,
  };
}
