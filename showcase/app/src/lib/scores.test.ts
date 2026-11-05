import { describe, expect, it } from 'vitest';
import { computeOverallScore } from './scores';

describe('computeOverallScore', () => {
  it('六维全 5 得 5.0，全 1 得 1.0', () => {
    expect(
      computeOverallScore({
        maturity: 5,
        usability: 5,
        performance: 5,
        docs: 5,
        windows: 5,
        activity: 5,
      }),
    ).toBe(5);
    expect(
      computeOverallScore({
        maturity: 1,
        usability: 1,
        performance: 1,
        docs: 1,
        windows: 1,
        activity: 1,
      }),
    ).toBe(1);
  });

  it('按权重聚合且保留一位小数', () => {
    const score = computeOverallScore({
      maturity: 5,
      usability: 4,
      performance: 3,
      docs: 4,
      windows: 2,
      activity: 5,
    });
    expect(score).toBe(3.9);
  });

  it('越界分数被钳制到 1-5', () => {
    const score = computeOverallScore({
      maturity: 99,
      usability: 4,
      performance: 4,
      docs: 4,
      windows: 4,
      activity: 4,
    });
    expect(score).toBeGreaterThanOrEqual(4);
    expect(score).toBeLessThanOrEqual(5);
  });
});
