import type { Repo, SortDirection, SortKey } from '../types/repo';
import { normalizeSampleStatus } from './filter';
import { cliRank, gpuRank, windowsRank } from './flags';
import { computeOverallScore } from './scores';

export const SORT_LABELS: Record<SortKey, string> = {
  name: '仓库',
  stars: 'Star',
  updated: '更新时间',
  category: '分类',
  language: '语言',
  backends: '渲染后端',
  formats: '输出格式',
  gpu: 'GPU',
  cli: '无头 CLI',
  windows: 'Windows',
  install: '安装难度',
  render: '实测耗时',
  sample: '样例状态',
  overall: '综合分',
};

const STATUS_RANK: Record<string, number> = { skipped: 0, failed: 1, unknown: 2, ok: 3 };

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'zh-CN');
}

function sortValue(repo: Repo, key: SortKey): string | number | boolean | null {
  switch (key) {
    case 'name':
      return `${repo.owner}/${repo.repo}`;
    case 'stars':
      return repo.stars;
    case 'updated':
      return new Date(repo.pushedAt).getTime();
    case 'category':
      return repo.category;
    case 'language':
      return repo.language ?? '';
    case 'backends':
      return repo.renderBackends.join(' ');
    case 'formats':
      return repo.outputFormats.join(' ');
    case 'gpu':
      return gpuRank(repo.gpuAcceleration);
    case 'cli':
      return cliRank(repo.cliHeadless);
    case 'windows':
      return windowsRank(repo.windowsSupport);
    case 'install':
      return repo.installComplexity;
    case 'render':
      return repo.renderPerf?.totalMs ?? null;
    case 'sample':
      return STATUS_RANK[normalizeSampleStatus(repo.sample.status)] ?? null;
    case 'overall':
      return computeOverallScore(repo.scores);
    default:
      return null;
  }
}

function compareValues(a: string | number | boolean, b: string | number | boolean): number {
  if (typeof a === 'string' && typeof b === 'string') return compareText(a, b);
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return Number(a) - Number(b);
}

/** 稳定排序；空值永远排在最后，不受升降序影响。 */
export function sortRepos(repos: Repo[], key: SortKey, direction: SortDirection = 'asc'): Repo[] {
  const copy = [...repos];
  copy.sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (av === null && bv === null)
      return compareText(`${a.owner}/${a.repo}`, `${b.owner}/${b.repo}`);
    if (av === null) return 1;
    if (bv === null) return -1;
    const base = compareValues(av, bv);
    if (base === 0) return compareText(`${a.owner}/${a.repo}`, `${b.owner}/${b.repo}`);
    return direction === 'asc' ? base : -base;
  });
  return copy;
}

export function nextSortDirection(
  key: SortKey,
  currentKey: SortKey,
  current: SortDirection,
): SortDirection {
  if (key !== currentKey) return 'asc';
  return current === 'asc' ? 'desc' : 'asc';
}
