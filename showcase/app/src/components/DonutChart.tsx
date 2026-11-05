import type { DistributionItem } from '../lib/stats';

const RING_COLORS = [
  'rgba(34, 211, 238, 1)',
  'rgba(34, 211, 238, 0.82)',
  'rgba(34, 211, 238, 0.66)',
  'rgba(34, 211, 238, 0.52)',
  'rgba(34, 211, 238, 0.4)',
  'rgba(34, 211, 238, 0.3)',
  'rgba(34, 211, 238, 0.22)',
  'rgba(34, 211, 238, 0.16)',
];

interface DonutChartProps {
  items: DistributionItem[];
  centerValue: number;
  centerLabel: string;
}

export function DonutChart({ items, centerValue, centerLabel }: DonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-layout">
      <div className="donut-canvas">
        <svg viewBox="0 0 220 220" role="img" aria-label={`${centerLabel}分布图`}>
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#172430" strokeWidth="26" />
          {items.map((item, index) => {
            const length = total > 0 ? (item.value / total) * circumference : 0;
            const dash = `${length} ${Math.max(0, circumference - length)}`;
            const currentOffset = offset;
            offset += length;
            return (
              <circle
                key={item.label}
                cx="110"
                cy="110"
                r={radius}
                fill="none"
                stroke={RING_COLORS[index % RING_COLORS.length] ?? RING_COLORS[0]}
                strokeWidth="26"
                strokeDasharray={dash}
                strokeDashoffset={-currentOffset}
                transform="rotate(-90 110 110)"
              />
            );
          })}
          <text x="110" y="106" textAnchor="middle" className="donut-center-value">
            {centerValue}
          </text>
          <text x="110" y="127" textAnchor="middle" className="donut-center-label">
            {centerLabel}
          </text>
        </svg>
      </div>
      <ul className="donut-legend">
        {items.map((item, index) => (
          <li key={item.label}>
            <span
              className="legend-dot"
              style={{ background: RING_COLORS[index % RING_COLORS.length] ?? RING_COLORS[0] }}
              aria-hidden="true"
            />
            <span className="legend-label" title={item.label}>
              {item.label}
            </span>
            <span className="legend-value mono">{item.value}</span>
            <span className="legend-percent mono">{item.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
