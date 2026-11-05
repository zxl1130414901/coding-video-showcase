import { describe, expect, it } from 'vitest';
import { createEmptyFilters, filterRepos, normalizeSampleStatus } from './filter';
import { makeRepo } from './test-fixtures';

const repos = [
  makeRepo({ id: 'a/one', repo: 'one', category: '数学动画', language: 'Python', tags: ['Manim'] }),
  makeRepo({
    id: 'b/two',
    repo: 'two',
    category: '声明式框架',
    language: 'TypeScript',
    tags: ['React'],
    windowsSupport: false,
    gpuAcceleration: true,
    sample: { status: 'failed' },
    license: 'Apache-2.0',
  }),
  makeRepo({
    id: 'c/three',
    repo: 'three',
    category: '终端录制',
    language: 'Go',
    sample: { status: 'skipped' },
    license: null,
    gpuAcceleration: false,
  }),
];

describe('filterRepos', () => {
  it('关键词匹配仓库名、描述与标签且不区分大小写', () => {
    const filters = createEmptyFilters();
    filters.q = 'manim';
    expect(filterRepos(repos, filters).map((repo) => repo.id)).toEqual(['a/one']);
  });

  it('分类多选为 OR 关系', () => {
    const filters = { ...createEmptyFilters(), categories: ['数学动画', '终端录制'] };
    expect(filterRepos(repos, filters).map((repo) => repo.id)).toEqual(['a/one', 'c/three']);
  });

  it('样例状态多选只保留命中项', () => {
    const filters = { ...createEmptyFilters(), statuses: ['failed', 'skipped'] };
    expect(filterRepos(repos, filters).map((repo) => repo.id)).toEqual(['b/two', 'c/three']);
  });

  it('Windows/GPU 三元条件组合生效', () => {
    const filters = { ...createEmptyFilters(), windows: 'no' as const, gpu: 'yes' as const };
    expect(filterRepos(repos, filters).map((repo) => repo.id)).toEqual(['b/two']);
  });

  it('语言与许可证筛选支持未声明值', () => {
    const filters = { ...createEmptyFilters(), languages: ['Go'], licenses: ['未声明'] };
    expect(filterRepos(repos, filters).map((repo) => repo.id)).toEqual(['c/three']);
  });

  it('未知样例状态归一为 unknown', () => {
    expect(normalizeSampleStatus('pending')).toBe('unknown');
    expect(normalizeSampleStatus('ok')).toBe('ok');
  });
});
