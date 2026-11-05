import { describe, expect, it } from 'vitest';
import { MAX_COMPARE, sanitizeSelection, toggleSelection } from './selection';

describe('toggleSelection', () => {
  it('依次添加直到上限 3 个，超出后拒绝且保持原选择', () => {
    const first = toggleSelection([], 'a');
    expect(first.ids).toEqual(['a']);
    const second = toggleSelection(first.ids, 'b');
    expect(second.ids).toEqual(['a', 'b']);
    const third = toggleSelection(second.ids, 'c');
    expect(third.ids).toHaveLength(MAX_COMPARE);
    const rejected = toggleSelection(third.ids, 'd');
    expect(rejected.rejected).toBe(true);
    expect(rejected.ids).toEqual(['a', 'b', 'c']);
  });

  it('再次点击已选项即移除', () => {
    const result = toggleSelection(['a', 'b'], 'a');
    expect(result.ids).toEqual(['b']);
    expect(result.rejected).toBe(false);
  });

  it('深链选择去重并截断到上限', () => {
    expect(sanitizeSelection(['a', 'a', 'b', 'c', 'd'])).toEqual(['a', 'b', 'c']);
  });
});
