import type { FilterState, RouteState, SortDirection, SortKey, ViewKey } from '../types/repo';
import { createEmptyFilters } from './filter';
import { sanitizeSelection } from './selection';

const VIEWS: readonly ViewKey[] = ['overview', 'matrix', 'timeline', 'detail'];
const SORTS: readonly SortKey[] = [
  'name',
  'stars',
  'updated',
  'category',
  'language',
  'backends',
  'formats',
  'gpu',
  'cli',
  'windows',
  'install',
  'render',
  'sample',
  'overall',
];

export const DEFAULT_SORT_KEY: SortKey = 'overall';
export const DEFAULT_SORT_DIR: SortDirection = 'desc';

export function createDefaultRoute(): RouteState {
  return {
    view: 'overview',
    repoId: null,
    fromView: null,
    filters: createEmptyFilters(),
    sortKey: DEFAULT_SORT_KEY,
    sortDir: DEFAULT_SORT_DIR,
    selected: [],
  };
}

function isView(value: string | null): value is ViewKey {
  return value !== null && (VIEWS as readonly string[]).includes(value);
}

function isSortKey(value: string | null): value is SortKey {
  return value !== null && (SORTS as readonly string[]).includes(value);
}

function splitParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTri(value: string | null): 'all' | 'yes' | 'no' {
  return value === 'yes' || value === 'no' ? value : 'all';
}

/** 解析 #/repo/<id> 与 #/?category=... 两类深链。 */
export function parseRouteHash(hash: string): RouteState {
  const state = createDefaultRoute();
  const raw = hash.replace(/^#/, '');
  const queryIndex = raw.indexOf('?');
  const pathPart = (queryIndex >= 0 ? raw.slice(0, queryIndex) : raw).replace(/^\//, '');
  const queryPart = queryIndex >= 0 ? raw.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(queryPart);

  const hasRepoPath = pathPart.startsWith('repo/') && pathPart.length > 'repo/'.length;
  if (hasRepoPath) {
    const encoded = pathPart.slice('repo/'.length);
    state.repoId = decodeURIComponent(encoded);
    state.view = 'detail';
  }

  const hasQueryFilters = Boolean(
    params.get('q') ||
      params.get('category') ||
      params.get('status') ||
      params.get('language') ||
      params.get('license') ||
      params.get('windows') ||
      params.get('gpu'),
  );

  if (!hasRepoPath) {
    const viewParam = params.get('view');
    if (isView(viewParam)) state.view = viewParam;
    else if (hasQueryFilters) state.view = 'matrix';
  }

  const fromParam = params.get('from');
  if (
    fromParam === 'overview' ||
    fromParam === 'matrix' ||
    fromParam === 'timeline' ||
    fromParam === 'detail'
  ) {
    state.fromView = fromParam;
  }

  const sortParam = params.get('sort');
  if (isSortKey(sortParam)) state.sortKey = sortParam;
  const dirParam = params.get('dir');
  if (dirParam === 'asc' || dirParam === 'desc') state.sortDir = dirParam;

  const filters: FilterState = {
    q: params.get('q') ?? '',
    categories: splitParam(params, 'category'),
    statuses: splitParam(params, 'status'),
    languages: splitParam(params, 'language'),
    licenses: splitParam(params, 'license'),
    windows: parseTri(params.get('windows')),
    gpu: parseTri(params.get('gpu')),
  };
  state.filters = filters;
  state.selected = sanitizeSelection(splitParam(params, 'sel'));
  return state;
}

/** 生成稳定、可分享的 hash；空状态收敛为 #/。 */
export function buildRouteHash(state: RouteState): string {
  const path = state.repoId ? `/repo/${encodeURIComponent(state.repoId)}` : '/';
  const params = new URLSearchParams();

  if (!state.repoId && state.view !== 'overview') params.set('view', state.view);
  if (state.fromView && state.fromView !== 'detail') params.set('from', state.fromView);
  if (state.sortKey !== DEFAULT_SORT_KEY) params.set('sort', state.sortKey);
  if (state.sortDir !== DEFAULT_SORT_DIR) params.set('dir', state.sortDir);
  if (state.filters.q.trim()) params.set('q', state.filters.q.trim());
  if (state.filters.categories.length > 0)
    params.set('category', state.filters.categories.join(','));
  if (state.filters.statuses.length > 0) params.set('status', state.filters.statuses.join(','));
  if (state.filters.languages.length > 0) params.set('language', state.filters.languages.join(','));
  if (state.filters.licenses.length > 0) params.set('license', state.filters.licenses.join(','));
  if (state.filters.windows !== 'all') params.set('windows', state.filters.windows);
  if (state.filters.gpu !== 'all') params.set('gpu', state.filters.gpu);
  if (state.selected.length > 0) params.set('sel', state.selected.join(','));

  const query = params.toString();
  return `#${path}${query ? `?${query}` : ''}`;
}

export function syncLocationHash(state: RouteState): void {
  const next = buildRouteHash(state);
  if (window.location.hash === next) return;
  try {
    window.history.replaceState(null, '', next);
  } catch {
    // file:// 下 Chrome/Edge 可能因 opaque origin 拒绝 replaceState，退回 hash 赋值。
    try {
      window.location.hash = next;
    } catch {
      // 极端限制下忽略写入，路由仍由内存状态驱动。
    }
  }
}

export function navigateToRepo(repoId: string | null): void {
  const current = parseRouteHash(window.location.hash);
  const next: RouteState = { ...current, repoId };
  window.location.hash = buildRouteHash(next);
}
