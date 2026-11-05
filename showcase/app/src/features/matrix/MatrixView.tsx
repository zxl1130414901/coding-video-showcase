import type { FilterState, Repo, SortDirection, SortKey } from '../../types/repo';
import { collectFilterOptions } from '../../lib/filter';
import { SORT_LABELS } from '../../lib/sort';
import { MAX_COMPARE } from '../../lib/selection';
import { FilterPanel } from '../../components/FilterPanel';
import { RepoTable } from '../../components/RepoTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Icon } from '../../components/Icon';

interface MatrixViewProps {
  allRepos: Repo[];
  repos: Repo[];
  filters: FilterState;
  sortKey: SortKey;
  sortDir: SortDirection;
  selectedIds: string[];
  onFiltersChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onSort: (key: SortKey) => void;
  onOpenRepo: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

export function MatrixView({
  allRepos,
  repos,
  filters,
  sortKey,
  sortDir,
  selectedIds,
  onFiltersChange,
  onResetFilters,
  onSort,
  onOpenRepo,
  onToggleSelect,
}: MatrixViewProps) {
  const options = collectFilterOptions(allRepos);

  return (
    <div className="view matrix-view">
      <section className="view-head">
        <div>
          <span className="eyebrow">横向对比矩阵</span>
          <h1 id="view-title" tabIndex={-1}>
            对比矩阵
          </h1>
          <p className="muted">
            点击表头切换升/降序，点击行打开详情；勾选 2–{MAX_COMPARE} 个项目可进入并排对比。
          </p>
        </div>
        <div className="view-head-stat">
          <span className="label">当前排序</span>
          <span className="big">
            {SORT_LABELS[sortKey]}
            <span className="mono accent-text"> {sortDir === 'asc' ? '↑' : '↓'}</span>
          </span>
          <span className="muted">
            显示 {repos.length} / {allRepos.length} 个项目
          </span>
        </div>
      </section>

      <FilterPanel
        filters={filters}
        options={options}
        shown={repos.length}
        total={allRepos.length}
        onChange={onFiltersChange}
        onReset={onResetFilters}
      />

      <section className="matrix-panel">
        <div className="matrix-legend">
          <span>
            <StatusBadge status="ok" compact />
            有真实样例
          </span>
          <span>
            <StatusBadge status="failed" compact />
            实机失败
          </span>
          <span>
            <StatusBadge status="skipped" compact />
            环境/能力不满足
          </span>
          <span className="legend-tip">
            <Icon name="compare" size={14} />
            最多对比 {MAX_COMPARE} 个
          </span>
        </div>
        <RepoTable
          repos={repos}
          sortKey={sortKey}
          sortDir={sortDir}
          selectedIds={selectedIds}
          onSort={onSort}
          onOpenRepo={onOpenRepo}
          onToggleSelect={onToggleSelect}
        />
      </section>
    </div>
  );
}
