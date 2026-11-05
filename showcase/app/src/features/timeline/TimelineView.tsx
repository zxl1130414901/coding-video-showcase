import { useMemo } from 'react';
import type { Repo } from '../../types/repo';
import { computeActivity } from '../../lib/activity';
import { formatAge, formatIsoDate } from '../../lib/format';
import { computeOverallScore } from '../../lib/scores';
import { Icon } from '../../components/Icon';
import { RepoThumb } from '../../components/RepoThumb';
import { StatusBadge } from '../../components/StatusBadge';

interface TimelineViewProps {
  repos: Repo[];
  onOpenRepo: (id: string) => void;
}

const BUCKET_WIDTH = 640;
const BUCKET_HEIGHT = 150;
const BAR_GAP = 24;

export function TimelineView({ repos, onOpenRepo }: TimelineViewProps) {
  const now = useMemo(() => new Date(), []);
  const activity = useMemo(() => computeActivity(repos, now), [repos, now]);
  const maxCount = Math.max(1, ...activity.buckets.map((bucket) => bucket.count));
  const barWidth =
    (BUCKET_WIDTH - BAR_GAP * (activity.buckets.length - 1)) / activity.buckets.length;

  return (
    <div className="view timeline-view">
      <section className="view-head">
        <div>
          <span className="eyebrow">活跃度与项目新鲜度</span>
          <h1 id="view-title" tabIndex={-1}>
            活跃度时间线
          </h1>
          <p className="muted">
            以最近一次推送（pushedAt）衡量项目新鲜度。近 30 天仍在更新的项目有
            <strong className="accent-text">
              {' '}
              {(activity.buckets[0]?.count ?? 0) + (activity.buckets[1]?.count ?? 0)}{' '}
            </strong>
            个，直接影响框架可用性与踩坑风险。
          </p>
        </div>
        <div className="view-head-stat">
          <span className="label">近期活跃</span>
          <span className="big mono">{activity.activeCount}</span>
          <span className="muted">近 90 天有提交</span>
        </div>
      </section>

      <section className="timeline-chart panel">
        <div className="panel-head">
          <div>
            <h2>活跃度分布</h2>
            <p className="muted">共 {repos.length} 个项目，按最近推送时间分档</p>
          </div>
        </div>
        <div className="bars-scroll">
          <svg
            className="activity-bars"
            viewBox={`0 0 ${BUCKET_WIDTH} ${BUCKET_HEIGHT}`}
            role="img"
            aria-label="活跃度分布柱状图"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                x2={BUCKET_WIDTH}
                y1={BUCKET_HEIGHT - 36 - ratio * 86}
                y2={BUCKET_HEIGHT - 36 - ratio * 86}
                className="grid-line"
              />
            ))}
            {activity.buckets.map((bucket, index) => {
              const height = (bucket.count / maxCount) * 86;
              const x = index * (barWidth + BAR_GAP);
              return (
                <g key={bucket.key}>
                  <rect
                    x={x}
                    y={BUCKET_HEIGHT - 36 - height}
                    width={barWidth}
                    height={Math.max(2, height)}
                    rx="2"
                    className={`activity-bar bucket-${bucket.key}`}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={BUCKET_HEIGHT - 44 - height}
                    textAnchor="middle"
                    className="bar-value"
                  >
                    {bucket.count}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={BUCKET_HEIGHT - 18}
                    textAnchor="middle"
                    className="bar-label"
                  >
                    {bucket.label}
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={BUCKET_HEIGHT - 4}
                    textAnchor="middle"
                    className="bar-percent"
                  >
                    {bucket.percent}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="bucket-legend">
          {activity.buckets.map((bucket) => (
            <div className="bucket-item" key={bucket.key}>
              <span className={`bucket-dot bucket-${bucket.key}`} aria-hidden="true" />
              <span className="bucket-name">{bucket.label}</span>
              <span className="bucket-hint">{bucket.hint}</span>
              <span className="mono">{bucket.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="recent-panel panel">
        <div className="panel-head">
          <div>
            <h2>最近更新 Top 10</h2>
            <p className="muted">按 pushedAt 倒序，点击查看详情</p>
          </div>
          <Icon name="clock" size={18} />
        </div>
        <div className="recent-list">
          {activity.recent.map((repo, index) => {
            const overall = computeOverallScore(repo.scores);
            return (
              <button
                type="button"
                className="recent-row"
                key={repo.id}
                onClick={() => onOpenRepo(repo.id)}
              >
                <span className="recent-rank mono">{String(index + 1).padStart(2, '0')}</span>
                <RepoThumb repo={repo} size="sm" />
                <span className="recent-main">
                  <span className="recent-name">
                    <span className="repo-owner">{repo.owner}/</span>
                    {repo.repo}
                  </span>
                  <span className="recent-meta">
                    {repo.category}
                    <span className="dot-sep">·</span>
                    {formatIsoDate(repo.pushedAt)}
                  </span>
                </span>
                <StatusBadge status={repo.sample.status} compact />
                <span className="recent-age mono">{formatAge(repo.pushedAt, now)}</span>
                <span
                  className={`score-pill${overall >= 4 ? ' is-high' : overall < 3 ? ' is-low' : ''}`}
                >
                  {overall.toFixed(1)}
                </span>
                <Icon name="arrow-right" size={15} />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
