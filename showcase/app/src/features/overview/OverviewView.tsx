import { useMemo, useState } from 'react';
import type { Repo } from '../../types/repo';
import { categoryDistribution, starDistribution, type DistributionItem } from '../../lib/stats';
import { formatBytes, formatNumber } from '../../lib/format';
import { DonutChart } from '../../components/DonutChart';
import { MetricCard } from '../../components/MetricCard';
import { Icon } from '../../components/Icon';

interface OverviewViewProps {
  repos: Repo[];
  stats: {
    total: number;
    ok: number;
    failed: number;
    skipped: number;
    sampleBytes: number;
    successRate: number;
  };
  isSample: boolean;
  onGoMatrix: () => void;
  onGoTimeline: () => void;
  onApplyCategory: (category: string) => void;
}

type ChartMode = 'category' | 'stars';

export function OverviewView({
  repos,
  stats,
  isSample,
  onGoMatrix,
  onGoTimeline,
  onApplyCategory,
}: OverviewViewProps) {
  const [mode, setMode] = useState<ChartMode>('category');
  const categories = useMemo(() => categoryDistribution(repos), [repos]);
  const stars = useMemo(() => starDistribution(repos), [repos]);
  const items: DistributionItem[] = mode === 'category' ? categories : stars;
  const topCategory = categories[0];
  const notRendered = stats.failed + stats.skipped;

  return (
    <div className="view overview-view">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">代码转视频 · 65 个开源项目</span>
          <h1 id="view-title" tabIndex={-1}>
            65 个代码转视频项目
            <br />
            <span className="accent-text">一屏看清谁能出片</span>
          </h1>
          <p>
            从 Manim、Remotion 到终端录制与 FFmpeg 合成，全部在本机 Windows 环境实测。
            横向比较渲染性能、安装成本、样例成片与踩坑记录，再决定把哪个方案接进你的工作流。
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={onGoMatrix}>
              进入对比矩阵
              <Icon name="arrow-right" size={16} />
            </button>
            <button type="button" className="ghost-button" onClick={onGoTimeline}>
              <Icon name="clock" size={16} />
              查看活跃度时间线
            </button>
          </div>
        </div>
        <aside className="hero-side">
          <div className="hero-side-row">
            <span className="label">覆盖分类</span>
            <span className="value mono">{categories.length}</span>
          </div>
          <div className="hero-side-row">
            <span className="label">出片成功率</span>
            <span className="value mono accent-text">{stats.successRate}%</span>
          </div>
          <div className="hero-side-row">
            <span className="label">样例总体积</span>
            <span className="value mono">{formatBytes(stats.sampleBytes)}</span>
          </div>
          <div className="hero-side-row">
            <span className="label">数据状态</span>
            <span className={`value ${isSample ? 'is-warning' : 'is-ok'}`}>
              {isSample ? '占位数据' : '真实评测'}
            </span>
          </div>
        </aside>
      </section>

      <section className="metrics-grid" aria-label="核心指标">
        <MetricCard
          label="收录项目"
          value={formatNumber(stats.total)}
          suffix="个"
          hint={`覆盖 ${categories.length} 个技术分类`}
        />
        <MetricCard
          label="出片成功"
          value={formatNumber(stats.ok)}
          suffix="个"
          hint={`成功率 ${stats.successRate}%`}
          tone="success"
        />
        <MetricCard
          label="未出片"
          value={formatNumber(notRendered)}
          suffix="个"
          hint={`失败 ${stats.failed} · 不可出片 ${stats.skipped}`}
          tone={notRendered > 0 ? 'danger' : 'default'}
        />
        <MetricCard
          label="样例总占用"
          value={formatBytes(stats.sampleBytes)}
          hint="本地 _samples 实际产物体积"
          tone="accent"
        />
      </section>

      <section className="chart-panel" aria-label="项目分布">
        <div className="panel-head">
          <div>
            <h2>项目分布</h2>
            <p className="muted">
              {mode === 'category' ? '按技术分类统计' : '按 GitHub Star 区间统计'}
            </p>
          </div>
          <div className="segment" role="group" aria-label="分布维度">
            <button
              type="button"
              className={`segment-button${mode === 'category' ? ' is-active' : ''}`}
              aria-pressed={mode === 'category'}
              onClick={() => setMode('category')}
            >
              分类分布
            </button>
            <button
              type="button"
              className={`segment-button${mode === 'stars' ? ' is-active' : ''}`}
              aria-pressed={mode === 'stars'}
              onClick={() => setMode('stars')}
            >
              Star 区间
            </button>
          </div>
        </div>
        <DonutChart items={items} centerValue={stats.total} centerLabel="个项目" />
        <div className="chart-foot">
          <div>
            <span className="label">最集中的分类</span>
            <span className="chart-foot-value">
              {topCategory ? `${topCategory.label} · ${topCategory.value} 个` : '—'}
            </span>
          </div>
          <div>
            <span className="label">未出片原因</span>
            <span className="chart-foot-value">
              失败 {stats.failed} 个，能力/环境不满足 {stats.skipped} 个
            </span>
          </div>
        </div>
      </section>

      <section className="category-links" aria-label="按分类进入矩阵">
        <div className="panel-head">
          <div>
            <h2>快速进入</h2>
            <p className="muted">点击分类，直接跳到带筛选的对比矩阵</p>
          </div>
        </div>
        <div className="chip-group">
          {categories.map((category) => (
            <button
              type="button"
              key={category.label}
              className="chip chip-large"
              onClick={() => onApplyCategory(category.label)}
            >
              {category.label}
              <span className="chip-count mono">{category.value}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
