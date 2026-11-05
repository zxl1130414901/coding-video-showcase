import type { Repo } from '../types/repo';
import { MAX_COMPARE, MIN_COMPARE } from '../lib/selection';
import { Icon } from './Icon';
import { RepoThumb } from './RepoThumb';

interface CompareBarProps {
  repos: Repo[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
  onOpenRepo: (id: string) => void;
}

export function CompareBar({ repos, onRemove, onClear, onCompare, onOpenRepo }: CompareBarProps) {
  if (repos.length === 0) return null;
  const canStart = repos.length >= MIN_COMPARE;

  return (
    <div className="compare-bar" role="region" aria-label="对比选择">
      <div className="compare-bar-info">
        <Icon name="compare" size={18} />
        <strong>对比栏</strong>
        <span className="muted mono">
          {repos.length}/{MAX_COMPARE}
        </span>
      </div>
      <div className="compare-chips">
        {repos.map((repo) => (
          <div className="compare-chip" key={repo.id}>
            <RepoThumb repo={repo} size="sm" />
            <button
              type="button"
              className="compare-chip-name"
              onClick={() => onOpenRepo(repo.id)}
              title="打开详情"
            >
              {repo.repo}
            </button>
            <button
              type="button"
              className="icon-button compare-chip-remove"
              aria-label={`移除 ${repo.repo}`}
              onClick={() => onRemove(repo.id)}
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        ))}
        {repos.length < MIN_COMPARE ? (
          <span className="compare-tip">再选 1 个项目即可开始对比</span>
        ) : null}
      </div>
      <div className="compare-bar-actions">
        <button type="button" className="ghost-button" onClick={onClear}>
          清空
        </button>
        <button type="button" className="primary-button" disabled={!canStart} onClick={onCompare}>
          开始对比
        </button>
      </div>
    </div>
  );
}
