import type { Repo, SortDirection, SortKey } from '../types/repo';
import { formatAge, formatCompactNumber, formatIsoDate, formatMs } from '../lib/format';
import {
  CLI_LABELS,
  GPU_LABELS,
  WINDOWS_LABELS,
  cliLevel,
  cliTone,
  gpuLevel,
  gpuTone,
  windowsLevel,
  windowsTone,
} from '../lib/flags';
import { computeOverallScore } from '../lib/scores';
import { MAX_COMPARE } from '../lib/selection';
import { Icon } from './Icon';
import { RepoThumb } from './RepoThumb';
import { StatusBadge } from './StatusBadge';

interface RepoTableProps {
  repos: Repo[];
  sortKey: SortKey;
  sortDir: SortDirection;
  selectedIds: string[];
  onSort: (key: SortKey) => void;
  onOpenRepo: (id: string) => void;
  onToggleSelect: (id: string) => void;
}

interface ColumnDef {
  key: SortKey;
  label: string;
  className?: string;
  hint?: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'name', label: '仓库', className: 'col-repo' },
  { key: 'stars', label: 'Star', className: 'col-num' },
  { key: 'updated', label: '最近更新', className: 'col-date' },
  { key: 'category', label: '分类', className: 'col-category' },
  { key: 'language', label: '语言', className: 'col-language' },
  { key: 'backends', label: '渲染后端', className: 'col-list' },
  { key: 'formats', label: '输出格式', className: 'col-list' },
  { key: 'gpu', label: 'GPU', className: 'col-bool' },
  { key: 'cli', label: '无头 CLI', className: 'col-bool' },
  { key: 'windows', label: 'Windows', className: 'col-bool' },
  { key: 'install', label: '安装难度', className: 'col-num' },
  { key: 'render', label: '实测耗时', className: 'col-time' },
  { key: 'sample', label: '样例', className: 'col-status' },
  { key: 'overall', label: '综合分', className: 'col-score' },
];

function SortHeader({
  column,
  active,
  direction,
  onSort,
}: {
  column: ColumnDef;
  active: boolean;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const ariaSort = active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';
  return (
    <th scope="col" className={column.className} aria-sort={ariaSort}>
      <button
        type="button"
        className={`th-sort${active ? ' is-active' : ''}`}
        onClick={() => onSort(column.key)}
        title={`按${column.label}排序`}
      >
        {column.label}
        <span className={`sort-arrow${active ? ' is-active' : ''}`} aria-hidden="true">
          {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

function FlagCell({ label, tone }: { label: string; tone: string }) {
  return <span className={`bool-cell ${tone}`}>{label}</span>;
}

function TagList({ items, empty = '—' }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <span className="muted">{empty}</span>;
  const primary = items.slice(0, 2);
  return (
    <span className="tag-list">
      {primary.map((item) => (
        <span className="tag" key={item}>
          {item}
        </span>
      ))}
      {items.length > primary.length ? (
        <span className="tag is-more">+{items.length - primary.length}</span>
      ) : null}
    </span>
  );
}

export function RepoTable({
  repos,
  sortKey,
  sortDir,
  selectedIds,
  onSort,
  onOpenRepo,
  onToggleSelect,
}: RepoTableProps) {
  const selectionFull = selectedIds.length >= MAX_COMPARE;

  return (
    <div className="table-scroller">
      <table className="repo-table">
        <thead>
          <tr>
            <th scope="col" className="col-check">
              <span className="sr-only">加入对比</span>
            </th>
            {COLUMNS.map((column) => (
              <SortHeader
                key={column.key}
                column={column}
                active={sortKey === column.key}
                direction={sortDir}
                onSort={onSort}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => {
            const selected = selectedIds.includes(repo.id);
            const disabled = selectionFull && !selected;
            const overall = computeOverallScore(repo.scores);
            return (
              <tr
                key={repo.id}
                className={selected ? 'is-selected' : undefined}
                tabIndex={0}
                onClick={() => onOpenRepo(repo.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenRepo(repo.id);
                  }
                }}
                aria-label={`查看 ${repo.owner}/${repo.repo} 详情`}
              >
                <td className="col-check">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selected}
                    disabled={disabled}
                    title={disabled ? `最多同时对比 ${MAX_COMPARE} 个` : '加入对比'}
                    aria-label={`将 ${repo.repo} 加入对比`}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    onChange={() => onToggleSelect(repo.id)}
                  />
                </td>
                <td className="col-repo">
                  <div className="repo-cell">
                    <RepoThumb repo={repo} />
                    <div className="repo-cell-text">
                      <span className="repo-name">
                        <span className="repo-owner">{repo.owner}/</span>
                        {repo.repo}
                      </span>
                      <span className="repo-desc">{repo.descriptionZh}</span>
                    </div>
                  </div>
                </td>
                <td className="col-num mono">{formatCompactNumber(repo.stars)}</td>
                <td className="col-date mono" title={formatIsoDate(repo.pushedAt)}>
                  {formatAge(repo.pushedAt)}
                  <span className="cell-sub">{formatIsoDate(repo.pushedAt).slice(5)}</span>
                </td>
                <td className="col-category">
                  <span className="category-label">{repo.category}</span>
                </td>
                <td className="col-language mono">{repo.language ?? '—'}</td>
                <td className="col-list">
                  <TagList items={repo.renderBackends} />
                </td>
                <td className="col-list">
                  <TagList items={repo.outputFormats} />
                </td>
                <td className="col-bool">
                  <FlagCell
                    label={GPU_LABELS[gpuLevel(repo.gpuAcceleration)]}
                    tone={gpuTone(repo.gpuAcceleration)}
                  />
                </td>
                <td className="col-bool">
                  <FlagCell
                    label={CLI_LABELS[cliLevel(repo.cliHeadless)]}
                    tone={cliTone(repo.cliHeadless)}
                  />
                </td>
                <td className="col-bool">
                  <FlagCell
                    label={WINDOWS_LABELS[windowsLevel(repo.windowsSupport)]}
                    tone={windowsTone(repo.windowsSupport)}
                  />
                </td>
                <td className="col-num mono">
                  {repo.installComplexity}
                  <span className="muted">/5</span>
                </td>
                <td className="col-time mono">{formatMs(repo.renderPerf?.totalMs)}</td>
                <td className="col-status">
                  <StatusBadge status={repo.sample.status} compact />
                </td>
                <td className="col-score">
                  <span
                    className={`score-pill${overall >= 4 ? ' is-high' : overall < 3 ? ' is-low' : ''}`}
                  >
                    {overall.toFixed(1)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {repos.length === 0 ? (
        <div className="table-empty">
          <Icon name="search" size={20} />
          <span>没有匹配的项目，试试减少筛选条件。</span>
        </div>
      ) : null}
    </div>
  );
}
