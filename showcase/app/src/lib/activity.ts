import type { Repo } from '../types/repo';
import { daysSince } from './format';

export type ActivityBucketKey = 'fresh7' | 'fresh30' | 'fresh90' | 'older';

export interface ActivityBucket {
  key: ActivityBucketKey;
  label: string;
  hint: string;
  count: number;
  percent: number;
}

export interface ActivitySummary {
  buckets: ActivityBucket[];
  recent: Repo[];
  activeCount: number;
}

const BUCKET_DEFS: Array<Omit<ActivityBucket, 'count' | 'percent'>> = [
  { key: 'fresh7', label: '近 7 天', hint: '高频活跃' },
  { key: 'fresh30', label: '近 30 天', hint: '持续维护' },
  { key: 'fresh90', label: '近 90 天', hint: '仍在迭代' },
  { key: 'older', label: '更早', hint: '低频/停更' },
];

export function bucketOf(repo: Repo, now: Date): ActivityBucketKey {
  const days = daysSince(repo.pushedAt, now);
  if (days <= 7) return 'fresh7';
  if (days <= 30) return 'fresh30';
  if (days <= 90) return 'fresh90';
  return 'older';
}

export function computeActivity(repos: Repo[], now: Date = new Date()): ActivitySummary {
  const counts: Record<ActivityBucketKey, number> = {
    fresh7: 0,
    fresh30: 0,
    fresh90: 0,
    older: 0,
  };
  for (const repo of repos) {
    counts[bucketOf(repo, now)] += 1;
  }
  const total = repos.length || 1;
  const buckets = BUCKET_DEFS.map((def) => ({
    ...def,
    count: counts[def.key],
    percent: Math.round((counts[def.key] / total) * 1000) / 10,
  }));
  const recent = [...repos]
    .sort((a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime())
    .slice(0, 10);
  return { buckets, recent, activeCount: counts.fresh7 + counts.fresh30 + counts.fresh90 };
}
