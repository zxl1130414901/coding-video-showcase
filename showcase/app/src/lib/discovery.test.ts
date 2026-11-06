import { describe, expect, it } from 'vitest';
import type { DiscoveryConstraint, DiscoveryScenario, DiscoveryWarning } from '../types/discovery';
import type { Repo, RepoDetail } from '../types/repo';
import {
  applyConstraints,
  batchableOf,
  expandSynonyms,
  matchesConstraint,
  orderedRecommendations,
  quickPickRepos,
  repoByIdMap,
  reposForScenario,
  searchRepos,
  suggestScenarios,
  verdictAdvice,
  warningsForRepo,
} from './discovery';
import { makeRepo } from './test-fixtures';

const SYNONYMS: Record<string, string[]> = {
  数学动画: ['ManimCommunity__manim', 'academa-labs__manimgx', '3b1b__manim', '数学动画'],
  React: ['remotion-dev__remotion', 'Remocn__remocn', 'React'],
  Manim: ['ManimCommunity__manim', 'Manim'],
};

const repos: Repo[] = [
  makeRepo({
    id: 'ManimCommunity__manim',
    owner: 'ManimCommunity',
    repo: 'manim',
    category: '数学动画',
    tags: ['数学动画', 'Manim'],
    techStack: ['Python'],
    gpuAcceleration: 'none',
    installComplexity: 2,
    cliHeadless: 'yes',
    sample: { status: 'ok', pipeline: 'official' },
    scores: { maturity: 5, usability: 4, performance: 4, docs: 5, windows: 4, activity: 5 },
  }),
  makeRepo({
    id: 'academa-labs__manimgx',
    owner: 'academa-labs',
    repo: 'manimgx',
    category: '数学动画',
    tags: ['Manim 风格'],
    techStack: ['Python'],
    gpuAcceleration: 'none',
    installComplexity: 3,
    cliHeadless: 'partial',
    sample: { status: 'ok', pipeline: 'official' },
    scores: { maturity: 3, usability: 3, performance: 3, docs: 3, windows: 3, activity: 3 },
  }),
  makeRepo({
    id: 'jeertmans__manim-slides',
    owner: 'jeertmans',
    repo: 'manim-slides',
    category: '数学动画',
    tags: ['Manim 插件', '幻灯片'],
    techStack: ['Python'],
    gpuAcceleration: 'none',
    installComplexity: 3,
    cliHeadless: 'yes',
    sample: { status: 'ok', pipeline: 'wrapper' },
    scores: { maturity: 4, usability: 3, performance: 3, docs: 4, windows: 4, activity: 3 },
  }),
  makeRepo({
    id: 'remotion-dev__remotion',
    owner: 'remotion-dev',
    repo: 'remotion',
    category: '声明式框架',
    tags: ['React', 'Remotion'],
    techStack: ['React', 'TypeScript'],
    gpuAcceleration: 'none',
    installComplexity: 2,
    cliHeadless: 'yes',
    sample: { status: 'ok', pipeline: 'official' },
    scores: { maturity: 5, usability: 4, performance: 4, docs: 5, windows: 4, activity: 5 },
  }),
  makeRepo({
    id: 'Remocn__remocn',
    owner: 'Remocn',
    repo: 'remocn',
    category: '模板组件',
    tags: ['React', 'Remotion 模板'],
    techStack: ['React'],
    gpuAcceleration: 'none',
    installComplexity: 2,
    cliHeadless: 'yes',
    sample: { status: 'ok', pipeline: 'wrapper' },
    scores: { maturity: 3, usability: 5, performance: 3, docs: 3, windows: 4, activity: 4 },
  }),
  makeRepo({
    id: 'midrender__revideo',
    owner: 'midrender',
    repo: 'revideo',
    category: '声明式框架',
    tags: ['视频', 'Motion Canvas'],
    techStack: ['TypeScript'],
    descriptionZh: '用代码生成视频，带 React Player 预览。',
    gpuAcceleration: 'optional',
    installComplexity: 3,
    cliHeadless: 'partial',
    sample: { status: 'ok', pipeline: 'official' },
    scores: { maturity: 3, usability: 3, performance: 4, docs: 3, windows: 3, activity: 4 },
  }),
  makeRepo({
    id: 'terminal__demo',
    owner: 'terminal',
    repo: 'demo',
    category: '终端录制',
    tags: ['终端', '录屏'],
    techStack: ['Go'],
    descriptionZh: '把终端会话录成视频。',
    gpuAcceleration: 'required',
    installComplexity: 5,
    cliHeadless: 'yes',
    sample: { status: 'ok', pipeline: 'official' },
    scores: { maturity: 4, usability: 4, performance: 3, docs: 4, windows: 3, activity: 3 },
  }),
];

const details: Record<string, RepoDetail> = {
  midrender__revideo: {
    id: 'midrender__revideo',
    taglineZh: 'React 生态里的视频渲染器',
    summaryZh: '基于 React Player 的代码转视频工作流。',
    whatItMakes: [],
    useCases: [],
  } as unknown as RepoDetail,
};

const repoMap = repoByIdMap(repos);
function repoOf(id: string): Repo {
  const repo = repoMap.get(id);
  if (!repo) throw new Error(`测试夹具缺少仓库：${id}`);
  return repo;
}

const constraints: DiscoveryConstraint[] = [
  {
    id: 'no-gpu',
    titleZh: '没有 GPU 也要能跑',
    descZh: '不强制显卡加速',
    apply: { type: 'field', field: 'needsGpu', op: 'eq', value: 'none' },
  },
  {
    id: 'install-5min',
    titleZh: '5 分钟内装完',
    descZh: '安装复杂度不超过 2',
    apply: { type: 'field', field: 'installComplexity', op: 'lte', value: 2 },
  },
  {
    id: 'has-cli',
    titleZh: '有 CLI 可脚本化',
    descZh: '提供命令行入口',
    apply: { type: 'field', field: 'hasCli', op: 'eq', value: 'yes' },
  },
];

const mathScenario: DiscoveryScenario = {
  id: 'math-explainer',
  titleZh: '数学物理解释动画',
  descZh: '把公式与推导过程变成可读的动画讲解。',
  questionZh: '我想把数学公式讲成动画，选哪个？',
  recommended: [
    {
      repoId: 'ManimCommunity__manim',
      verdict: 'first',
      whyZh: '链路最完整',
      timeZh: '约 30 分钟',
    },
    { repoId: 'academa-labs__manimgx', verdict: 'alt', whyZh: '风格更现代', timeZh: '约 20 分钟' },
    {
      repoId: 'jeertmans__manim-slides',
      verdict: 'heavy',
      whyZh: '适合演示场景',
      timeZh: '约 40 分钟',
    },
  ],
  filters: { categories: ['数学动画'], tags: ['数学动画', 'Manim'] },
};

const reactScenario: DiscoveryScenario = {
  id: 'react-video',
  titleZh: 'React 组件做视频',
  descZh: '用熟悉的组件写法直接渲染视频。',
  questionZh: '我们团队用 React，想直接用组件做视频？',
  recommended: [
    {
      repoId: 'remotion-dev__remotion',
      verdict: 'first',
      whyZh: '生态最成熟',
      timeZh: '约 15 分钟',
    },
    { repoId: 'Remocn__remocn', verdict: 'alt', whyZh: '模板即用', timeZh: '约 5 分钟' },
  ],
  filters: { categories: ['声明式框架'], tags: ['React'] },
};

describe('同义词扩展搜索', () => {
  it('「数学动画」展开出 manim 组仓库与仓库名片段', () => {
    const expanded = expandSynonyms('数学动画', SYNONYMS);
    expect(expanded).toContain('ManimCommunity__manim');
    expect(expanded).toContain('academa-labs__manimgx');
    expect(expanded).toContain('manim');
  });

  it('搜「数学动画」能一起出 manim / manimgx / manim-slides，且 manim 排第一', () => {
    const hits = searchRepos(repos, '数学动画', SYNONYMS, details);
    const ids = hits.map((hit) => hit.repo.id);
    expect(ids).toContain('ManimCommunity__manim');
    expect(ids).toContain('academa-labs__manimgx');
    expect(ids).toContain('jeertmans__manim-slides');
    expect(ids[0]).toBe('ManimCommunity__manim');
  });

  it('搜「React 视频」同时命中 remotion 与 revideo', () => {
    const ids = searchRepos(repos, 'React 视频', SYNONYMS, details).map((hit) => hit.repo.id);
    expect(ids).toContain('remotion-dev__remotion');
    expect(ids).toContain('midrender__revideo');
  });

  it('无匹配时返回空数组，供 UI 展示推荐词', () => {
    expect(searchRepos(repos, '完全不存在的词', SYNONYMS, details)).toEqual([]);
  });

  it('空查询不返回任何结果', () => {
    expect(searchRepos(repos, '   ', SYNONYMS, details)).toEqual([]);
  });
});

describe('约束判定', () => {
  it('单条约束按真实字段口径判定（GPU / 安装复杂度 / CLI）', () => {
    expect(matchesConstraint(repoOf('ManimCommunity__manim'), constraints[0]!)).toBe(true);
    expect(matchesConstraint(repoOf('terminal__demo'), constraints[0]!)).toBe(false);
    expect(matchesConstraint(repoOf('remotion-dev__remotion'), constraints[1]!)).toBe(true);
    expect(matchesConstraint(repoOf('terminal__demo'), constraints[1]!)).toBe(false);
    expect(matchesConstraint(repoOf('academa-labs__manimgx'), constraints[2]!)).toBe(false);
  });

  it('多选约束 AND 叠加后数量下降，且每条结果都满足全部约束', () => {
    const one = applyConstraints(repos, constraints, ['no-gpu']);
    const two = applyConstraints(repos, constraints, ['no-gpu', 'install-5min']);
    expect(two.length).toBeLessThan(one.length);
    expect(two.every((item) => item.matched.length === 2)).toBe(true);
    expect(two.map((item) => item.repo.id)).toEqual([
      'ManimCommunity__manim',
      'remotion-dev__remotion',
      'Remocn__remocn',
    ]);
  });

  it('取消一条约束后结果数量回升', () => {
    const two = applyConstraints(repos, constraints, ['no-gpu', 'install-5min']);
    const reset = applyConstraints(repos, constraints, []);
    expect(reset.length).toBeGreaterThan(two.length);
    expect(reset.every((item) => item.matched.length === 0)).toBe(true);
  });

  it('batchable 需要具备 CLI 且产物链路为 official/wrapper', () => {
    expect(batchableOf(repoOf('ManimCommunity__manim'))).toBe(true);
    expect(batchableOf(repoOf('academa-labs__manimgx'))).toBe(false);
    expect(batchableOf(repoOf('midrender__revideo'))).toBe(false);
  });
});

describe('场景匹配与推荐', () => {
  it('场景符合清单按分类 / 标签命中，并优先推荐项目', () => {
    const matches = reposForScenario(repos, mathScenario);
    const ids = matches.map((item) => item.repo.id);
    expect(ids).toContain('jeertmans__manim-slides');
    expect(ids).not.toContain('remotion-dev__remotion');
    expect(matches[0]?.reasons).toContain('场景推荐');
  });

  it('推荐顺序为 first → alt → heavy，并过滤不存在的仓库', () => {
    const map = repoByIdMap(repos.filter((repo) => repo.id !== 'jeertmans__manim-slides'));
    const ordered = orderedRecommendations(mathScenario, map);
    expect(ordered.map((item) => item.recommendation.verdict)).toEqual(['first', 'alt']);
  });

  it('「数学动画」推荐到数学场景，「React 视频」推荐到 React 场景', () => {
    const math = suggestScenarios('数学动画', [mathScenario, reactScenario], SYNONYMS);
    expect(math[0]?.scenario.id).toBe('math-explainer');
    const react = suggestScenarios('React 视频', [mathScenario, reactScenario], SYNONYMS);
    expect(react[0]?.scenario.id).toBe('react-video');
  });

  it('heavy 备选给出更保守的选型建议', () => {
    const advice = verdictAdvice({
      repoId: 'jeertmans__manim-slides',
      verdict: 'heavy',
      whyZh: '适合演示场景',
      timeZh: '约 40 分钟',
    });
    expect(advice.whyNotFirstZh).toContain('环境代价');
  });

  it('quickPicks 过滤掉缺失仓库；warnings 能按仓库范围命中', () => {
    const map = repoByIdMap(repos);
    const picks = quickPickRepos(
      {
        scenarios: [],
        constraints: [],
        quickPicks: [
          {
            needZh: '数学公式动画',
            repoId: 'ManimCommunity__manim',
            whyZh: '链路完整',
            timeZh: '30 分钟',
          },
          { needZh: '缺失仓库', repoId: 'not-there', whyZh: '不存在', timeZh: '—' },
        ],
        synonyms: {},
        warnings: [],
      },
      map,
    );
    expect(picks.map((item) => item.repo.id)).toEqual(['ManimCommunity__manim']);

    const warnings: DiscoveryWarning[] = [
      { scopeZh: 'ManimCommunity__manim', riskZh: '首次渲染较慢' },
      { scopeZh: '其他项目', riskZh: '无关警告' },
    ];
    expect(warningsForRepo(warnings, repoOf('ManimCommunity__manim'))).toHaveLength(1);
  });
});
