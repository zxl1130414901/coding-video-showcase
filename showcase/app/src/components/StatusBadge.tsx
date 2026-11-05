import { normalizeSampleStatus, type NormalizedStatus } from '../lib/filter';
import { statusLabel } from '../lib/format';

const LABELS: Record<NormalizedStatus, string> = {
  ok: '出片成功',
  failed: '渲染失败',
  skipped: '不可出片',
  unknown: '未知',
};

interface StatusBadgeProps {
  status: string;
  compact?: boolean;
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const normalized = normalizeSampleStatus(status);
  return (
    <span className={`status-badge status-${normalized}${compact ? ' is-compact' : ''}`}>
      <span className="status-dot" aria-hidden="true" />
      {compact ? LABELS[normalized] : statusLabel(normalized)}
    </span>
  );
}
