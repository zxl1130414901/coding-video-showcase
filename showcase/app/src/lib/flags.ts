/** 真实数据中 GPU/CLI/Windows 是枚举字符串，这里统一做成可展示、可排序的语义等级。 */

export type GpuLevel = 'required' | 'optional' | 'none' | 'unknown';
export type CliLevel = 'yes' | 'partial' | 'no' | 'unknown';
export type WindowsLevel = 'works' | 'workaround' | 'broken' | 'unknown';

function text(value: boolean | string): string {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return value.trim().toLowerCase();
}

export function gpuLevel(value: boolean | string): GpuLevel {
  const raw = text(value);
  if (raw === 'required' || raw === 'yes') return 'required';
  if (raw === 'optional' || raw === 'partial') return 'optional';
  if (raw === 'none' || raw === 'no') return 'none';
  if (typeof value === 'boolean') return value ? 'optional' : 'none';
  return 'unknown';
}

export function cliLevel(value: boolean | string): CliLevel {
  const raw = text(value);
  if (raw === 'yes' || raw === 'true') return 'yes';
  if (raw === 'partial') return 'partial';
  if (raw === 'no' || raw === 'false') return 'no';
  return 'unknown';
}

export function windowsLevel(value: boolean | string): WindowsLevel {
  const raw = text(value);
  if (raw === 'works' || raw === 'yes' || raw === 'true') return 'works';
  if (raw === 'workaround') return 'workaround';
  if (raw === 'broken' || raw === 'no' || raw === 'false') return 'broken';
  return 'unknown';
}

export const GPU_LABELS: Record<GpuLevel, string> = {
  required: '必需',
  optional: '可选',
  none: '无',
  unknown: '未知',
};

export const CLI_LABELS: Record<CliLevel, string> = {
  yes: '支持',
  partial: '部分',
  no: '不支持',
  unknown: '未知',
};

export const WINDOWS_LABELS: Record<WindowsLevel, string> = {
  works: '可用',
  workaround: '需绕路',
  broken: '不可用',
  unknown: '未知',
};

/** 筛选口径：Windows「支持」包含官方可用与需绕路，「不支持」包含不可用与未验证。 */
export function windowsFilterValue(value: boolean | string): boolean {
  const level = windowsLevel(value);
  return level === 'works' || level === 'workaround';
}

/** 筛选口径：GPU「需要/支持」包含必需与可选。 */
export function gpuFilterValue(value: boolean | string): boolean {
  const level = gpuLevel(value);
  return level === 'required' || level === 'optional';
}

export function gpuRank(value: boolean | string): number {
  const order: Record<GpuLevel, number> = { unknown: 0, none: 1, optional: 2, required: 3 };
  return order[gpuLevel(value)];
}

export function cliRank(value: boolean | string): number {
  const order: Record<CliLevel, number> = { unknown: 0, no: 1, partial: 2, yes: 3 };
  return order[cliLevel(value)];
}

export function windowsRank(value: boolean | string): number {
  const order: Record<WindowsLevel, number> = {
    unknown: 0,
    broken: 1,
    workaround: 2,
    works: 3,
  };
  return order[windowsLevel(value)];
}

export function gpuTone(value: boolean | string): string {
  const level = gpuLevel(value);
  if (level === 'required') return 'is-accent';
  if (level === 'optional') return 'is-yes';
  return 'is-no';
}

export function cliTone(value: boolean | string): string {
  const level = cliLevel(value);
  if (level === 'yes') return 'is-yes';
  if (level === 'partial') return 'is-warn';
  return 'is-no';
}

export function windowsTone(value: boolean | string): string {
  const level = windowsLevel(value);
  if (level === 'works') return 'is-yes';
  if (level === 'workaround') return 'is-warn';
  if (level === 'broken') return 'is-no';
  return 'is-no';
}
