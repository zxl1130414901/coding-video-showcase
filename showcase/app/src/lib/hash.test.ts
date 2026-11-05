import { describe, expect, it } from 'vitest';
import { buildRouteHash, createDefaultRoute, parseRouteHash } from './hash';

describe('深链解析与生成', () => {
  it('repo 详情 + 筛选 + 排序 + 对比选择可完整还原', () => {
    const state = createDefaultRoute();
    state.view = 'matrix';
    state.repoId = 'owner/demo';
    state.fromView = 'matrix';
    state.filters.categories = ['数学动画'];
    state.filters.statuses = ['ok'];
    state.filters.q = 'manim';
    state.sortKey = 'stars';
    state.sortDir = 'asc';
    state.selected = ['a', 'b'];
    const hash = buildRouteHash(state);
    expect(hash.startsWith('#/repo/owner%2Fdemo?')).toBe(true);
    const parsed = parseRouteHash(hash);
    expect(parsed.repoId).toBe('owner/demo');
    expect(parsed.view).toBe('detail');
    expect(parsed.fromView).toBe('matrix');
    expect(parsed.filters.categories).toEqual(['数学动画']);
    expect(parsed.filters.statuses).toEqual(['ok']);
    expect(parsed.filters.q).toBe('manim');
    expect(parsed.sortKey).toBe('stars');
    expect(parsed.sortDir).toBe('asc');
    expect(parsed.selected).toEqual(['a', 'b']);
  });

  it('#/?category=... 无 view 时默认落到矩阵', () => {
    const parsed = parseRouteHash('#/?category=数学动画');
    expect(parsed.view).toBe('matrix');
    expect(parsed.filters.categories).toEqual(['数学动画']);
  });

  it('默认状态收敛为 #/', () => {
    expect(buildRouteHash(createDefaultRoute())).toBe('#/');
  });

  it('#/repo/<id> 直接进入详情页并保留返回来源', () => {
    const parsed = parseRouteHash('#/repo/remotion-dev__remotion?from=timeline');
    expect(parsed.repoId).toBe('remotion-dev__remotion');
    expect(parsed.view).toBe('detail');
    expect(parsed.fromView).toBe('timeline');
    expect(buildRouteHash(parsed)).toContain('from=timeline');
  });

  it('无 repoId 时 #/?view=detail 进入详情入口', () => {
    const parsed = parseRouteHash('#/?view=detail');
    expect(parsed.repoId).toBeNull();
    expect(parsed.view).toBe('detail');
    expect(buildRouteHash(parsed)).toBe('#/?view=detail');
  });
});
