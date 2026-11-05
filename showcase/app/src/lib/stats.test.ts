import { describe, expect, it } from 'vitest';
import { categoryDistribution, computeOverviewStats, starDistribution } from './stats';
import { makeRepo } from './test-fixtures';

const repos = [
  makeRepo({ id: 'a/one', repo: 'one', category: '数学动画', stars: 50, sample: { status: 'ok' } }),
  makeRepo({
    id: 'b/two',
    repo: 'two',
    category: '数学动画',
    stars: 2500,
    sample: {
      status: 'failed',
      spec: {
        width: 1280,
        height: 720,
        fps: 30,
        durationSec: 4,
        frames: 120,
        bytes: 2_000_000,
        codec: 'h264',
      },
    },
  }),
  makeRepo({
    id: 'c/three',
    repo: 'three',
    category: '终端录制',
    stars: 120_000,
    sample: { status: 'skipped', spec: null },
  }),
];

describe('概览聚合', () => {
  it('统计总数、出片/失败/不可出片与产物体积', () => {
    const stats = computeOverviewStats(repos);
    expect(stats.total).toBe(3);
    expect(stats.ok).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.skipped).toBe(1);
    expect(stats.sampleBytes).toBe(7_000_000);
    expect(stats.successRate).toBe(33.3);
  });

  it('分类分布按数量降序', () => {
    const distribution = categoryDistribution(repos);
    expect(distribution[0]?.label).toBe('数学动画');
    expect(distribution[0]?.value).toBe(2);
  });

  it('Star 区间覆盖边界值', () => {
    const distribution = starDistribution(repos);
    expect(distribution.map((item) => item.value)).toEqual([1, 0, 1, 0, 1]);
  });
});
