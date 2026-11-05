import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  suffix?: string;
  hint: string;
  tone?: 'default' | 'accent' | 'success' | 'danger';
}

export function MetricCard({ label, value, suffix, hint, tone = 'default' }: MetricCardProps) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        <span className="metric-number">{value}</span>
        {suffix ? <span className="metric-suffix">{suffix}</span> : null}
      </div>
      <div className="metric-hint">{hint}</div>
    </article>
  );
}
