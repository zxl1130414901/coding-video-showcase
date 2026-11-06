import type { Repo, RepoDetail } from '../types/repo';
import type {
  ConstraintField,
  DiscoveryConstraint,
  DiscoveryDoc,
  DiscoveryScenario,
  DiscoveryWarning,
  ScenarioRecommendation,
} from '../types/discovery';
import type { IntentDoc, IntentEntry } from '../types/intents';
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

/* ================================================================
   长句口语检索（零运行时依赖 · 构建期意图语料）
   ---------------------------------------------------------------
   组成：归一化 → 字段词表最长匹配分词 + 字符 3-gram → 三段加权
   打分（词重合 IDF 0.45 / 3-gram 余弦 0.35 / 短语包含 0.20）
   → 长句按标点与连接词分段后取峰值 → 场景识别与置信度。
   ================================================================ */

const LONG_TEXT_MIN_CONTENT = 6;
/** 低于该分数不视为命中，但仍可作为「也许你在找」的近邻。 */
export const LONG_TEXT_HIT_THRESHOLD = 0.15;
/** 场景置信度低于该值时不展示「我理解为」。 */
export const SCENARIO_CONFIDENCE_THRESHOLD = 0.35;
/** 场景得分过低时即使比值高也不展示，避免对无关长句强行归类；真实长句实测 ≥0.10。 */
export const SCENARIO_MIN_SCORE = 0.08;
/** 纯约束型长句（如「不想装依赖，双击出片」）本身不含场景名词，需要更高的绝对分才值得展示。 */
export const SCENARIO_MIN_SCORE_LIGHTWEIGHT = 0.15;
const INTENT_SCORE_WEIGHT = 1.15;
const SEGMENT_MERGE_WEIGHT = 0.12;

/* —— 约束型查询 rerank（文本相似度之外的结构化信号） —— */
/** 命中一条已应用约束的加分；最多累计 2 条，避免约束多者通吃。 */
export const CONSTRAINT_BONUS = 0.12;
export const CONSTRAINT_BONUS_STACK = 2;
/** 「免安装 / 少依赖」类查询里，重安装、Windows 断链、必须独显分别扣分。 */
export const HEAVY_INSTALL_PENALTY = 0.2;
export const BROKEN_WINDOWS_PENALTY = 0.25;
export const GPU_REQUIRED_PENALTY = 0.2;
/** 官方链路 + 低安装成本的小额加成（轻量出片的次要信号）。 */
export const LIGHT_OFFICIAL_BONUS = 0.08;

/** 查询词 → discovery.constraints 语义的映射；只使用契约里真实存在的约束 id。 */
const CONSTRAINT_QUERY_RULES: Array<{ id: string; pattern: RegExp }> = [
  {
    id: 'install-5min',
    pattern: /不想装|不用装|免安装|免依赖|开箱即用|双击|依赖太多|装不起来|装不上|一条命令|直接出片|轻量/,
  },
  { id: 'has-cli', pattern: /命令行|终端|cli|脚本|自动化|一键|可执行/ },
  { id: 'win-workable', pattern: /windows|win10|win11|电脑上|本机|笔记本/ },
  { id: 'official-pipeline', pattern: /双击|一条命令|官方|直接出片|自带|原生/ },
  { id: 'batchable', pattern: /批量|批处理|自动跑|跑批|无人值守|几百条|一天几百|定时/ },
  { id: 'no-gpu', pattern: /没显卡|没有显卡|无显卡|没gpu|没有gpu|核显|cpu渲染/ },
];

/** 「免安装 / 少依赖 / 双击出片」类查询：需要结构化门槛，而不是只看文本相似度。 */
const LIGHTWEIGHT_QUERY_PATTERN =
  /不想装|不用装|免安装|免依赖|开箱即用|双击|依赖太多|装不起来|装不上|轻量|一条命令|直接出片/;

/** 中文数字的常见非数量用法，先保护起来再转阿拉伯数字。 */
const NUMERAL_EXCEPTIONS = [
  '一镜到底',
  '一键',
  '一起',
  '一直',
  '一些',
  '一样',
  '一定',
  '一般',
  '第一',
  '统一',
  '唯一',
  '万一',
  '一周',
  '一边',
  '一度',
];

const FILLER_PHRASES = ['可不可以', '有没有', '能不能', '我想', '帮我', '请问', '麻烦'];

const SEGMENT_SPLITTER =
  /[，。；！？、,.;!?\n]+|(?:然后|还要|另外|同时|接着|而且|顺便|最后|最好|但是|不过|因为|如果)/g;

const CONTENT_STOP_CHARS = /[的了呢吗啊吧呀嘛哦诶]/g;

const CJK = /[\u3400-\u9fff]/;

const NUMERAL_DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const NUMERAL_UNITS: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
};

function chineseNumberToArabic(raw: string): string {
  let total = 0;
  let section = 0;
  let current = 0;
  let hasUnit = false;
  for (const char of raw) {
    if (char in NUMERAL_DIGITS) {
      current = NUMERAL_DIGITS[char] ?? 0;
      continue;
    }
    const unit = NUMERAL_UNITS[char];
    if (!unit) continue;
    hasUnit = true;
    if (unit === 10000) {
      section = (section + current) * unit;
      total += section;
      section = 0;
    } else {
      section += (current === 0 ? 1 : current) * unit;
    }
    current = 0;
  }
  if (!hasUnit) {
    const digits = [...raw]
      .map((char) => (char in NUMERAL_DIGITS ? String(NUMERAL_DIGITS[char]) : ''))
      .join('');
    return digits || raw;
  }
  return String(total + section + current);
}

/** 全角转半角、小写、中文数字转阿拉伯、去语气词与标点。 */
export function normalizeLongText(input: string): string {
  let text = input.normalize('NFKC').toLowerCase();
  const protectedWords: string[] = [];
  for (const word of NUMERAL_EXCEPTIONS) {
    if (!text.includes(word)) continue;
    const token = `zzex${protectedWords.length}zz`;
    protectedWords.push(word);
    text = text.split(word).join(token);
  }
  text = text.replace(/[零〇一二三四五六七八九十百千万两]+/g, (match) =>
    chineseNumberToArabic(match),
  );
  for (const phrase of FILLER_PHRASES) text = text.split(phrase).join('');
  text = text.replace(/[\s\p{P}\p{S}]+/gu, '');
  protectedWords.forEach((word, index) => {
    text = text.split(`zzex${index}zz`).join(word);
  });
  return text;
}

function contentLength(normalized: string): number {
  return normalized.replace(CONTENT_STOP_CHARS, '').length;
}

/** 长句按标点与「然后 / 还要 / 最后」等连接词分段；短句原样返回。 */
export function segmentLongQuery(input: string): string[] {
  const full = normalizeLongText(input);
  if (!full) return [];
  if (contentLength(full) <= LONG_TEXT_MIN_CONTENT) return [full];
  const parts = input
    .split(SEGMENT_SPLITTER)
    .map((part) => normalizeLongText(part))
    .filter((part) => part.length > 0 && contentLength(part) >= 2);
  if (parts.length <= 1) return [full];
  return [...new Set(parts)];
}

interface Lexicon {
  words: Set<string>;
  maxLength: number;
}

function buildLexicon(words: Iterable<string>): Lexicon {
  const set = new Set<string>();
  let maxLength = 2;
  for (const word of words) {
    if (word.length < 2) continue;
    set.add(word);
    if (word.length > maxLength) maxLength = Math.min(word.length, 8);
  }
  return { words: set, maxLength };
}

function tokenizeNormalized(text: string, lexicon: Lexicon): string[] {
  const tokens: string[] = [];
  let run = '';
  const flush = () => {
    if (!run) return;
    for (let i = 0; i < run.length; i += 1) {
      const char = run[i]!;
      tokens.push(char);
      if (i + 1 < run.length) tokens.push(run.slice(i, i + 2));
    }
    run = '';
  };

  let i = 0;
  while (i < text.length) {
    let matched = '';
    const limit = Math.min(lexicon.maxLength, text.length - i);
    for (let length = limit; length >= 2; length -= 1) {
      const slice = text.slice(i, i + length);
      if (lexicon.words.has(slice)) {
        matched = slice;
        break;
      }
    }
    if (matched) {
      flush();
      tokens.push(matched);
      i += matched.length;
      continue;
    }
    const char = text[i]!;
    if (/[a-z0-9]/.test(char)) {
      let j = i + 1;
      while (j < text.length && /[a-z0-9]/.test(text[j]!)) j += 1;
      flush();
      tokens.push(text.slice(i, j));
      i = j;
      continue;
    }
    if (CJK.test(char)) run += char;
    i += 1;
  }
  flush();
  return tokens;
}

/** 归一化 + 词表最长匹配 + 未登录字 2-gram 混合分词（公开给测试与调试）。 */
export function tokenizeLongText(input: string, words: string[] = []): string[] {
  const normalized = normalizeLongText(input);
  const lexicon = buildLexicon(words);
  return tokenizeNormalized(normalized, lexicon);
}

interface TextVector {
  tokens: Set<string>;
  grams: Map<string, number>;
  gramNorm: number;
}

function buildVector(normalized: string, lexicon: Lexicon): TextVector {
  const tokens = new Set(tokenizeNormalized(normalized, lexicon));
  const grams = new Map<string, number>();
  const size = Math.min(3, normalized.length);
  for (let i = 0; i + size <= normalized.length; i += 1) {
    const gram = normalized.slice(i, i + size);
    grams.set(gram, (grams.get(gram) ?? 0) + 1);
  }
  let norm = 0;
  for (const value of grams.values()) norm += value * value;
  return { tokens, grams, gramNorm: Math.sqrt(norm) };
}

function gramCosine(a: TextVector, b: TextVector): number {
  if (a.gramNorm === 0 || b.gramNorm === 0) return 0;
  const [small, large] = a.grams.size <= b.grams.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [gram, count] of small.grams) {
    const other = large.grams.get(gram);
    if (other) dot += count * other;
  }
  return dot / (a.gramNorm * b.gramNorm);
}

function containment(query: string, phrases: string[]): number {
  let best = 0;
  for (const phrase of phrases) {
    if (phrase.length < 2) continue;
    if (phrase === query) return 1;
    if (query.includes(phrase)) {
      best = Math.max(best, Math.min(1, (phrase.length / query.length) * 1.5));
    } else if (phrase.includes(query) && query.length >= 2) {
      best = Math.max(best, Math.min(1, (query.length / phrase.length) * 1.25));
    }
  }
  return best;
}

interface WeightedQuery {
  norm: string;
  vector: TextVector;
  weightSum: number;
}

function weightedQuery(
  norm: string,
  lexicon: Lexicon,
  idf: Map<string, number>,
  fallbackIdf: number,
): WeightedQuery {
  const vector = buildVector(norm, lexicon);
  let weightSum = 0;
  for (const token of vector.tokens) weightSum += idf.get(token) ?? fallbackIdf;
  return { norm, vector, weightSum };
}

interface SimilarityScore {
  total: number;
  word: number;
  gram: number;
  phrase: number;
}

function similarity(
  query: WeightedQuery,
  document: TextVector,
  phrases: string[],
  idf: Map<string, number>,
  fallbackIdf: number,
): SimilarityScore {
  let matchedWeight = 0;
  for (const token of query.vector.tokens) {
    if (!document.tokens.has(token)) continue;
    matchedWeight += idf.get(token) ?? fallbackIdf;
  }
  const word = query.weightSum > 0 ? matchedWeight / query.weightSum : 0;
  const gram = gramCosine(query.vector, document);
  const phrase = containment(query.norm, phrases);
  return { total: 0.45 * word + 0.35 * gram + 0.2 * phrase, word, gram, phrase };
}

interface IndexedIntent {
  entry: IntentEntry;
  norm: string;
  vector: TextVector;
}

interface IndexedRepo {
  repo: Repo;
  field: TextVector;
  phrases: string[];
  intents: IndexedIntent[];
}

interface IndexedScenario {
  scenario: DiscoveryScenario;
  vector: TextVector;
  phrases: string[];
}

interface CandidatePhrase {
  text: string;
  norm: string;
  vector: TextVector;
}

export interface LongTextHit extends SearchHit {
  matchedPhrase: string | null;
  matchedScenario: string | null;
  fieldScore: number;
  intentScore: number;
}

export interface LongTextScenarioGuess {
  scenario: DiscoveryScenario;
  score: number;
  confidence: number;
}

export interface LongTextScenarioRanking {
  scenario: DiscoveryScenario;
  score: number;
}

export interface LongTextResult {
  normalized: string;
  segments: string[];
  hits: LongTextHit[];
  nearest: LongTextHit[];
  scenario: LongTextScenarioGuess | null;
  scenarioRanking: LongTextScenarioRanking[];
  suggestions: string[];
  /** 查询是否命中结构化约束（安装成本 / Windows / 批量 / CLI 等）。 */
  constraintMode: boolean;
  /** 是否属于「免安装 / 少依赖 / 双击出片」类查询，需要更严格的场景绝对分门槛。 */
  lightweight: boolean;
  elapsedMs: number;
}

export interface LongTextSearch {
  search(query: string): LongTextResult;
  stats: { repos: number; intents: number; terms: number; scenarios: number };
}

function repoPhrases(repo: Repo, detail: RepoDetail | undefined): string[] {
  const phrases: string[] = [
    normalize(repo.repo),
    normalize(`${repo.owner}/${repo.repo}`),
    normalize(repo.category),
    ...repo.tags.map(normalize),
    ...repo.techStack.map(normalize),
  ];
  if (detail) {
    phrases.push(normalize(detail.taglineZh), normalize(detail.summaryZh));
    for (const item of detail.whatItMakes) {
      phrases.push(normalize(item.exampleZh), normalize(item.type));
    }
    for (const item of detail.useCases) {
      phrases.push(normalize(item.scenarioZh), normalize(item.deliverableZh));
    }
  }
  phrases.push(
    ...repo.descriptionZh
      .split(/[，。；！？、,.;!?]/)
      .map(normalize)
      .filter((part) => part.length >= 2),
  );
  return [...new Set(phrases.filter((phrase) => phrase.length >= 2))];
}

function scenarioPhrases(
  scenario: DiscoveryScenario,
  intents: IntentDoc,
): string[] {
  const lines = intents.scenarios[scenario.id] ?? [];
  return [
    normalize(scenario.titleZh),
    normalize(scenario.questionZh),
    normalize(scenario.descZh),
    ...(scenario.filters.tags ?? []).map(normalize),
    ...lines.map(normalize),
  ].filter((phrase) => phrase.length >= 2);
}

function collectTerms(repos: Repo[], details: Record<string, RepoDetail>, intents: IntentDoc): string[] {
  const words = new Set<string>();
  const add = (value: string) => {
    const norm = normalize(value);
    if (norm.length >= 2) words.add(norm);
  };
  for (const repo of repos) {
    add(repo.category);
    repo.tags.forEach(add);
    repo.techStack.forEach(add);
    add(repo.repo);
  }
  for (const list of Object.values(intents.repos)) list.forEach((entry) => add(entry.q));
  for (const lines of Object.values(intents.scenarios)) lines.forEach(add);
  intents.global.forEach(add);
  // 从语料中共现频率较高的 2/3-gram 里挖领域词（不引第三方词典）。
  const counts = new Map<string, number>();
  for (const list of Object.values(intents.repos)) {
    for (const { q } of list) {
      const norm = normalize(q);
      for (let size = 2; size <= 3; size += 1) {
        for (let i = 0; i + size <= norm.length; i += 1) {
          const gram = norm.slice(i, i + size);
          if ([...gram].every((char) => CJK.test(char))) {
            counts.set(gram, (counts.get(gram) ?? 0) + 1);
          }
        }
      }
    }
  }
  for (const [gram, count] of counts) {
    if (count >= 5) words.add(gram);
  }
  // 详情字段里的短语也进入词表（按空白/斜杠切分）。
  for (const detail of Object.values(details)) {
    for (const part of detail.taglineZh.split(/[\s/、，,]+/)) add(part);
  }
  return [...words];
}

function buildIdf(docs: TextVector[], tokens: Set<string>): { idf: Map<string, number>; fallback: number } {
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const token of tokens) {
      if (doc.tokens.has(token)) df.set(token, (df.get(token) ?? 0) + 1);
    }
  }
  const total = docs.length + 1;
  const idf = new Map<string, number>();
  for (const token of tokens) {
    idf.set(token, Math.log((total + 1) / ((df.get(token) ?? 0) + 1)) + 1);
  }
  return { idf, fallback: Math.log(total + 1) + 1 };
}

/** 从归一化查询里识别约束型意图：返回契约中真实存在的约束 + 是否属于「轻量出片」类。 */
export function detectConstraintQuery(
  normalized: string,
  constraints: DiscoveryConstraint[],
): { constraints: DiscoveryConstraint[]; lightweight: boolean } {
  const byId = new Map(constraints.map((constraint) => [constraint.id, constraint]));
  const matched: DiscoveryConstraint[] = [];
  for (const rule of CONSTRAINT_QUERY_RULES) {
    const constraint = byId.get(rule.id);
    if (constraint && rule.pattern.test(normalized)) matched.push(constraint);
  }
  return { constraints: matched, lightweight: LIGHTWEIGHT_QUERY_PATTERN.test(normalized) };
}

/** 轻量出片的硬门槛：低安装成本、Windows 可用、非 GPU 必需、官方链路、有可执行入口。 */
function lightweightReady(repo: Repo): boolean {
  return (
    repo.installComplexity <= 2 &&
    windowsLevel(repo.windowsSupport) !== 'broken' &&
    gpuLevel(repo.gpuAcceleration) !== 'required' &&
    pipelineOf(repo) === 'official' &&
    cliLevel(repo.cliHeadless) === 'yes'
  );
}

/** 约束型查询的结构化 rerank：命中约束加分，不符合轻量门槛的按字段扣分。 */
export function constraintRerankBonus(
  repo: Repo,
  active: DiscoveryConstraint[],
  lightweight: boolean,
): number {
  if (active.length === 0) return 0;
  if (lightweight && !lightweightReady(repo)) {
    let penalty = 0;
    if (repo.installComplexity >= 4) penalty -= HEAVY_INSTALL_PENALTY;
    if (windowsLevel(repo.windowsSupport) === 'broken') penalty -= BROKEN_WINDOWS_PENALTY;
    if (gpuLevel(repo.gpuAcceleration) === 'required') penalty -= GPU_REQUIRED_PENALTY;
    return penalty;
  }
  const passed = active.filter((constraint) => matchesConstraint(repo, constraint)).length;
  let bonus = Math.min(passed, CONSTRAINT_BONUS_STACK) * CONSTRAINT_BONUS;
  if (pipelineOf(repo) === 'official' && repo.installComplexity <= 2) {
    bonus += LIGHT_OFFICIAL_BONUS;
  }
  return bonus;
}

/** 一次性建索引：65 仓库约 910 条意图，首屏构建后单次查询走纯内存。 */
export function createLongTextSearch(
  repos: Repo[],
  details: Record<string, RepoDetail>,
  discovery: DiscoveryDoc,
  intents: IntentDoc,
): LongTextSearch {
  const lexWords = collectTerms(repos, details, intents);
  const lexicon = buildLexicon(lexWords);

  const repoDocs: IndexedRepo[] = repos.map((repo) => {
    const haystack = buildHaystack(repo, details[repo.id]);
    const field = buildVector(haystack, lexicon);
    const phrases = repoPhrases(repo, details[repo.id]);
    const entries = intents.repos[repo.id] ?? [];
    const indexedIntents: IndexedIntent[] = entries.map((entry) => {
      const norm = normalize(entry.q);
      return { entry, norm, vector: buildVector(norm, lexicon) };
    });
    phrases.push(...indexedIntents.map((item) => item.norm));
    return { repo, field, phrases: [...new Set(phrases)], intents: indexedIntents };
  });

  const repoIdf = buildIdf(
    repoDocs.map((doc) => doc.field),
    new Set(lexWords),
  );

  const scenarioDocs: IndexedScenario[] = discovery.scenarios.map((scenario) => {
    const phrases = scenarioPhrases(scenario, intents);
    const vector = buildVector(phrases.join(''), lexicon);
    return { scenario, vector, phrases };
  });
  const scenarioIdf = buildIdf(
    scenarioDocs.map((doc) => doc.vector),
    new Set(lexWords),
  );

  const suggestionPool: CandidatePhrase[] = [];
  const pushCandidate = (text: string) => {
    const norm = normalize(text);
    if (!norm) return;
    suggestionPool.push({ text, norm, vector: buildVector(norm, lexicon) });
  };
  intents.global.forEach(pushCandidate);
  for (const lines of Object.values(intents.scenarios)) lines.forEach(pushCandidate);

  const intentsCount = repoDocs.reduce((sum, doc) => sum + doc.intents.length, 0);

  function scoreSegments(
    queries: WeightedQuery[],
    doc: IndexedRepo,
  ): { score: number; fieldScore: number; intentScore: number; phrase: string | null; scenario: string | null } {
    let best = -1;
    let bestField = 0;
    let bestIntent = 0;
    let bestPhrase: string | null = null;
    let bestScenario: string | null = null;
    let bestIntentGlobal = 0;
    let bestPhraseGlobal: string | null = null;
    let bestScenarioGlobal: string | null = null;
    let sum = 0;
    let count = 0;
    for (const query of queries) {
      const field = similarity(query, doc.field, doc.phrases, repoIdf.idf, repoIdf.fallback);
      let intentScore = 0;
      let intentEntry: IndexedIntent | null = null;
      for (const intent of doc.intents) {
        const score = similarity(query, intent.vector, [intent.norm], repoIdf.idf, repoIdf.fallback)
          .total;
        if (score > intentScore) {
          intentScore = score;
          intentEntry = intent;
        }
      }
      if (intentEntry && intentScore > bestIntentGlobal) {
        bestIntentGlobal = intentScore;
        bestPhraseGlobal = intentScore >= 0.12 ? intentEntry.entry.q : null;
        bestScenarioGlobal = intentScore >= 0.2 ? intentEntry.entry.scenario : null;
      }
      const score = Math.max(field.total, intentScore * INTENT_SCORE_WEIGHT);
      sum += score;
      count += 1;
      if (score > best) {
        best = score;
        bestField = field.total;
        bestIntent = intentScore;
        bestPhrase = intentEntry && intentScore >= 0.12 ? intentEntry.entry.q : null;
        bestScenario = intentEntry && intentScore >= 0.2 ? intentEntry.entry.scenario : null;
      }
    }
    const averageRest = count > 0 ? (sum - best) / Math.max(1, count - 1) : 0;
    return {
      score: best + (count > 1 ? SEGMENT_MERGE_WEIGHT * averageRest : 0),
      fieldScore: bestField,
      intentScore: bestIntentGlobal || bestIntent,
      phrase: bestPhraseGlobal ?? bestPhrase,
      scenario: bestScenarioGlobal ?? bestScenario,
    };
  }

  function detectScenario(
    queries: WeightedQuery[],
    hits: LongTextHit[],
  ): { guess: LongTextScenarioGuess | null; ranking: LongTextScenarioRanking[] } {
    if (scenarioDocs.length === 0) return { guess: null, ranking: [] };
    const scored = scenarioDocs.map((doc) => {
      let best = 0;
      let sum = 0;
      for (const query of queries) {
        const value = similarity(query, doc.vector, doc.phrases, scenarioIdf.idf, scenarioIdf.fallback)
          .total;
        sum += value;
        if (value > best) best = value;
      }
      const averageRest = queries.length > 1 ? (sum - best) / (queries.length - 1) : 0;
      return {
        doc,
        score: best + (queries.length > 1 ? SEGMENT_MERGE_WEIGHT * averageRest : 0),
      };
    });
    scored.sort((a, b) => b.score - a.score);
    for (const hit of hits.slice(0, 5)) {
      if (!hit.matchedScenario) continue;
      const target = scored.find((item) => item.doc.scenario.id === hit.matchedScenario);
      if (target) target.score += 0.04;
    }
    const ranking = scored
      .slice(0, 3)
      .map(({ doc, score }) => ({ scenario: doc.scenario, score }));
    const top = scored[0];
    const second = scored[1];
    if (!top || top.score <= 0) return { guess: null, ranking };
    const confidence =
      second && second.score > 0 ? top.score / (top.score + second.score) : 1;
    return {
      guess: { scenario: top.doc.scenario, score: top.score, confidence },
      ranking,
    };
  }

  function suggest(
    queries: WeightedQuery[],
    scenario: DiscoveryScenario | null,
    near: LongTextHit[],
  ): string[] {
    const scenarioLines = scenario ? intents.scenarios[scenario.id] ?? [] : [];
    const nearbyIntents = near.flatMap((hit) => {
      const doc = repoDocs.find((item) => item.repo.id === hit.repo.id);
      return doc?.intents ?? [];
    });
    const pool = [
      ...nearbyIntents.map((item) => ({ text: item.entry.q, norm: item.norm, vector: item.vector })),
      ...scenarioLines.map((text) => {
        const norm = normalize(text);
        return (
          suggestionPool.find((item) => item.norm === norm) ?? {
            text,
            norm,
            vector: buildVector(norm, lexicon),
          }
        );
      }),
      ...suggestionPool,
    ];
    const scored = pool.map((item, index) => {
      let best = 0;
      for (const query of queries) {
        const gram = gramCosine(query.vector, item.vector);
        const phrase = containment(query.norm, [item.norm]);
        best = Math.max(best, 0.6 * gram + 0.4 * phrase);
      }
      return { item, score: best, index };
    });
    scored.sort((a, b) => b.score - a.score || a.index - b.index);
    const out: string[] = [];
    for (const { item } of scored) {
      if (out.some((text) => normalize(text) === item.norm)) continue;
      out.push(item.text);
      if (out.length >= 3) break;
    }
    return out;
  }

  function search(query: string): LongTextResult {
    const started = performance.now();
    const segments = segmentLongQuery(query);
    const normalized = normalizeLongText(query);
    if (segments.length === 0) {
      return {
        normalized,
        segments,
        hits: [],
        nearest: [],
        scenario: null,
        scenarioRanking: [],
        suggestions: [],
        constraintMode: false,
        lightweight: false,
        elapsedMs: performance.now() - started,
      };
    }
    const queries = segments.map((segment) =>
      weightedQuery(segment, lexicon, repoIdf.idf, repoIdf.fallback),
    );
    const constraintIntent = detectConstraintQuery(normalized, discovery.constraints);
    const scored: LongTextHit[] = repoDocs.map((doc) => {
      const result = scoreSegments(queries, doc);
      // 只对已命中用户说法的仓库做结构化 rerank：避免「字段结构完美但与需求无关」的项目被抬上来。
      const rerank = result.phrase
        ? constraintRerankBonus(doc.repo, constraintIntent.constraints, constraintIntent.lightweight)
        : 0;
      return {
        repo: doc.repo,
        score: result.score + rerank,
        matchedTerms: result.phrase ? [result.phrase] : [],
        matchedPhrase: result.phrase,
        matchedScenario: result.scenario,
        fieldScore: result.fieldScore,
        intentScore: result.intentScore,
      };
    });
    scored.sort(
      (a, b) =>
        b.score - a.score ||
        computeOverallScore(b.repo.scores) - computeOverallScore(a.repo.scores) ||
        a.repo.id.localeCompare(b.repo.id),
    );
    const topScore = scored[0]?.score ?? 0;
    const cutoff = Math.max(LONG_TEXT_HIT_THRESHOLD, topScore * 0.4);
    const hits = scored.filter((hit) => hit.score >= cutoff).slice(0, 12);
    const nearest = scored.slice(0, 3);
    const detected = detectScenario(queries, hits);
    const suggestions =
      hits.length === 0 ? suggest(queries, detected.guess?.scenario ?? null, nearest) : [];
    return {
      normalized,
      segments,
      hits,
      nearest,
      scenario: detected.guess,
      scenarioRanking: detected.ranking,
      suggestions,
      constraintMode: constraintIntent.constraints.length > 0,
      lightweight: constraintIntent.lightweight,
      elapsedMs: performance.now() - started,
    };
  }

  return {
    search,
    stats: {
      repos: repoDocs.length,
      intents: intentsCount,
      terms: lexWords.length,
      scenarios: scenarioDocs.length,
    },
  };
}
