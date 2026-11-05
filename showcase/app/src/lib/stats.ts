import type { Repo } from '../types/repo';
import { normalizeSampleStatus } from './filter';

export interface OverviewStats {
  total: number;
  ok: number;
  failed: number;
  skipped: number;
  sampleBytes: number;
  successRate: number;
}

export interface DistributionItem {
  label: string;
  value: number;
  percent: number;
}

export function computeOverviewStats(repos: Repo[]): OverviewStats {
  let ok = 0;
  let failed = 0;
  let skipped = 0;
  let sampleBytes = 0;
  for (const repo of repos) {
    const status = normalizeSampleStatus(repo.sample.status);
    if (status === 'ok') ok += 1;
    else if (status === 'failed') failed += 1;
    else if (status === 'skipped') skipped += 1;
    sampleBytes += repo.sample.spec?.bytes ?? 0;
  }
  const total = repos.length;
  return {
    total,
    ok,
    failed,
    skipped,
    sampleBytes,
    successRate: total > 0 ? Math.round((ok / total) * 1000) / 10 : 0,
  };
}

export function categoryDistribution(repos: Repo[]): DistributionItem[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    counts.set(repo.category, (counts.get(repo.category) ?? 0) + 1);
  }
  const total = repos.length || 1;
  return [...counts.entries()]
    .map(([label, value]) => ({
      label,
      value,
      percent: Math.round((value / total) * 1000) / 10,
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'zh-CN'));
}

const STAR_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: '< 100', min: 0, max: 99 },
  { label: '100 - 999', min: 100, max: 999 },
  { label: '1k - 9.9k', min: 1000, max: 9999 },
  { label: '10k - 99k', min: 10_000, max: 99_999 },
  { label: '≥ 100k', min: 100_000, max: Number.POSITIVE_INFINITY },
];

export function starDistribution(repos: Repo[]): DistributionItem[] {
  const total = repos.length || 1;
  return STAR_BUCKETS.map((bucket) => {
    const value = repos.filter(
      (repo) => repo.stars >= bucket.min && repo.stars <= bucket.max,
    ).length;
    return {
      label: bucket.label,
      value,
      percent: Math.round((value / total) * 1000) / 10,
    };
  });
}

export function sumCategoryCount(items: DistributionItem[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}
