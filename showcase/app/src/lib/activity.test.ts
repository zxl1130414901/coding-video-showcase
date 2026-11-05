import { describe, expect, it } from 'vitest';
import { computeActivity } from './activity';
import { makeRepo } from './test-fixtures';

const now = new Date('2026-11-05T00:00:00Z');
const repos = [
  makeRepo({ id: 'a/fresh', repo: 'fresh', pushedAt: '2026-11-04T00:00:00Z' }),
  makeRepo({ id: 'b/month', repo: 'month', pushedAt: '2026-10-10T00:00:00Z' }),
  makeRepo({ id: 'c/quarter', repo: 'quarter', pushedAt: '2026-09-01T00:00:00Z' }),
  makeRepo({ id: 'd/old', repo: 'old', pushedAt: '2025-01-01T00:00:00Z' }),
];

describe('computeActivity', () => {
  it('按 7/30/90 天与更早分档统计', () => {
    const summary = computeActivity(repos, now);
    expect(summary.buckets.map((bucket) => bucket.count)).toEqual([1, 1, 1, 1]);
    expect(summary.buckets[0]?.percent).toBe(25);
    expect(summary.activeCount).toBe(3);
  });

  it('最近更新榜按 pushedAt 倒序且最多 10 条', () => {
    const summary = computeActivity(repos, now);
    expect(summary.recent.map((repo) => repo.repo)).toEqual(['fresh', 'month', 'quarter', 'old']);
  });
});
