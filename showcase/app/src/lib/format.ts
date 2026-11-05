/** 展示层格式化：数值、时间、体积、路径映射。全部为纯函数。 */

const zhNumber = new Intl.NumberFormat('zh-CN');

export function formatNumber(value: number): string {
  return zhNumber.format(value);
}

/** 紧凑数字：70471 -> 70.5k，42215 -> 42.2k。 */
export function formatCompactNumber(value: number): string {
  if (value >= 10_000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return formatNumber(value);
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const decimals = value >= 100 || unit === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit] ?? 'B'}`;
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '—';
  return `${seconds.toFixed(1)} s`;
}

export function formatIsoDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysSince(iso: string, now: Date = new Date()): number {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - time) / 86_400_000);
}

export function formatAge(iso: string, now: Date = new Date()): string {
  const days = daysSince(iso, now);
  if (!Number.isFinite(days)) return '—';
  if (days < 1) return '今天';
  if (days < 7) return `${Math.floor(days)} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

export function formatResolution(
  width: number | null | undefined,
  height: number | null | undefined,
): string {
  if (!width || !height) return '—';
  return `${width}×${height}`;
}

export function statusLabel(status: string): string {
  if (status === 'ok') return '出片成功';
  if (status === 'failed') return '渲染失败';
  if (status === 'skipped') return '不可出片';
  return '未知状态';
}

export function formatBool(value: boolean): string {
  return value ? '支持' : '不支持';
}
