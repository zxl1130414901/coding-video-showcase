import { describe, expect, it } from 'vitest';
import { buildCompareMarkdown, pickExtremes } from './compare';
import { computeOverallScore } from './scores';
import { makeRepo } from './test-fixtures';

const strong = makeRepo({
  id: 'a/strong',
  repo: 'strong',
  stars: 70000,
  installComplexity: 2,
  renderPerf: { totalMs: 5000, frames: 150, width: 1920, height: 1080, fps: 30 },
  scores: { maturity: 5, usability: 5, performance: 4, docs: 5, windows: 5, activity: 5 },
  pros: ['生态完整'],
  pitfalls: ['依赖重'],
  bestFor: '产品演示',
});

const weak = makeRepo({
  id: 'b/weak',
  repo: 'weak',
  stars: 100,
  installComplexity: 5,
  renderPerf: null,
  scores: { maturity: 2, usability: 2, performance: 2, docs: 2, windows: 2, activity: 3 },
  sample: { status: 'failed' },
  pros: ['轻量'],
  pitfalls: ['文档少'],
  bestFor: '实验性项目',
});

describe('对比视图', () => {
  it('高分/高 Star 判为最优，低分判为最差', () => {
    const { best, worst } = pickExtremes(
      [computeOverallScore(strong.scores), computeOverallScore(weak.scores)],
      true,
    );
    expect(best).toEqual([0]);
    expect(worst).toEqual([1]);
  });

  it('安装难度这类低值更优的维度反转判定', () => {
    const { best, worst } = pickExtremes([2, 5], false);
    expect(best).toEqual([0]);
    expect(worst).toEqual([1]);
  });

  it('导出的 Markdown 含综合分最高项目与维度表', () => {
    const markdown = buildCompareMarkdown([strong, weak], new Date('2026-11-05T00:00:00Z'));
    expect(markdown).toContain('# 代码转视频项目对比结论');
    expect(markdown).toContain('综合分最高：**a/strong**');
    expect(markdown).toContain('| 维度 | a/strong | b/weak |');
    expect(markdown).toContain('## 适用场景');
  });
});
