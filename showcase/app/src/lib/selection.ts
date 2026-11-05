export const MIN_COMPARE = 2;
export const MAX_COMPARE = 3;

export interface ToggleSelectionResult {
  ids: string[];
  rejected: boolean;
}

/** 对比选择：2-3 个，勾选已选项即取消；超出上限时拒绝并保留原选择。 */
export function toggleSelection(current: string[], id: string): ToggleSelectionResult {
  if (current.includes(id)) {
    return { ids: current.filter((item) => item !== id), rejected: false };
  }
  if (current.length >= MAX_COMPARE) {
    return { ids: current, rejected: true };
  }
  return { ids: [...current, id], rejected: false };
}

export function sanitizeSelection(ids: string[]): string[] {
  const unique = [...new Set(ids.filter(Boolean))];
  return unique.slice(0, MAX_COMPARE);
}

export function canCompare(ids: string[]): boolean {
  return ids.length >= MIN_COMPARE && ids.length <= MAX_COMPARE;
}
