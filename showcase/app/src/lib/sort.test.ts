import { describe, expect, it } from 'vitest';
import { nextSortDirection, sortRepos } from './sort';
import { makeRepo } from './test-fixtures';

const repos = [
  makeRepo({ id: 'a/one', repo: 'one', stars: 50, pushedAt: '2026-01-01T00:00:00Z' }),
  makeRepo({ id: 'b/two', repo: 'two', stars: 900, pushedAt: '2026-10-01T00:00:00Z' }),
  makeRepo({
    id: 'c/three',
    repo: 'three',
    stars: 10,
    pushedAt: '2026-05-01T00:00:00Z',
    renderPerf: null,
    sample: { status: 'skipped' },
  }),
];

describe('sortRepos', () => {
  it('Star 升序/降序切换正确', () => {
    expect(sortRepos(repos, 'stars', 'asc').map((repo) => repo.id)).toEqual([
      'c/three',
      'a/one',
      'b/two',
    ]);
    expect(sortRepos(repos, 'stars', 'desc').map((repo) => repo.id)).toEqual([
      'b/two',
      'a/one',
      'c/three',
    ]);
  });

  it('渲染耗时缺失值始终排在最后，且不受降序影响', () => {
    const sorted = sortRepos(repos, 'render', 'desc');
    expect(sorted[sorted.length - 1]?.id).toBe('c/three');
  });

  it('更新时间按 pushedAt 排序', () => {
    expect(sortRepos(repos, 'updated', 'asc').map((repo) => repo.id)).toEqual([
      'a/one',
      'c/three',
      'b/two',
    ]);
  });

  it('点击新列默认升序，点击同列切换方向', () => {
    expect(nextSortDirection('stars', 'overall', 'desc')).toBe('asc');
    expect(nextSortDirection('stars', 'stars', 'asc')).toBe('desc');
    expect(nextSortDirection('stars', 'stars', 'desc')).toBe('asc');
  });
});
