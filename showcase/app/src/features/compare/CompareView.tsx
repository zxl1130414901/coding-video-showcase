import { useEffect, useRef, useState } from 'react';
import type { Repo, RepoDetail, SampleFeatures } from '../../types/repo';
import { buildCompareMarkdown, buildCompareMetrics, pickExtremes } from '../../lib/compare';
import { copyText } from '../../lib/clipboard';
import { computeOverallScore } from '../../lib/scores';
import { buildArchiveCompareRows } from '../../lib/detail';
import { Icon } from '../../components/Icon';
import { RepoThumb } from '../../components/RepoThumb';

interface CompareViewProps {
  repos: Repo[];
  details: Record<string, RepoDetail>;
  features: Record<string, SampleFeatures>;
  onClose: () => void;
  onOpenRepo: (id: string) => void;
  onCopied: (message: string) => void;
}

export function CompareView({
  repos,
  details,
  features,
  onClose,
  onOpenRepo,
  onCopied,
}: CompareViewProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [copying, setCopying] = useState(false);
  const metrics = buildCompareMetrics(repos);
  const archiveRows = buildArchiveCompareRows(repos, details, features);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleCopy() {
    setCopying(true);
    const text = buildCompareMarkdown(repos);
    const ok = await copyText(text);
    setCopying(false);
    onCopied(ok ? '对比结论已复制为 Markdown' : '复制失败，请检查浏览器权限');
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="compare-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-title"
        ref={panelRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="compare-head">
          <div>
            <span className="eyebrow">逐维度差异对比</span>
            <h2 id="compare-title">项目对比</h2>
            <p className="muted">绿色为当前维度更优，红色为更差；点击列头可打开项目详情。</p>
          </div>
          <div className="compare-head-actions">
            <button
              type="button"
              className="primary-button"
              onClick={handleCopy}
              disabled={copying}
            >
              <Icon name="copy" size={15} />
              {copying ? '复制中…' : '复制 Markdown'}
            </button>
            <button
              type="button"
              className="icon-button"
              ref={closeRef}
              aria-label="关闭对比"
              onClick={onClose}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </header>

        <div className="compare-scroller">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col" className="compare-dimension-head">
                  维度
                </th>
                {repos.map((repo) => (
                  <th scope="col" key={repo.id}>
                    <button
                      type="button"
                      className="compare-repo-head"
                      onClick={() => onOpenRepo(repo.id)}
                      title="查看详情"
                    >
                      <RepoThumb repo={repo} size="sm" />
                      <span className="compare-repo-name">
                        <span className="repo-owner">{repo.owner}/</span>
                        {repo.repo}
                      </span>
                      <span className="compare-repo-score mono">
                        {computeOverallScore(repo.scores).toFixed(1)}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => {
                const extremes = metric.highlight
                  ? pickExtremes(metric.numeric, metric.higherIsBetter)
                  : { best: [], worst: [] };
                return (
                  <tr key={metric.key}>
                    <th scope="row">
                      <span className="metric-row-label">{metric.label}</span>
                      <span className="metric-row-hint">{metric.hint}</span>
                    </th>
                    {metric.values.map((value, index) => {
                      const isBest = extremes.best.includes(index);
                      const isWorst = extremes.worst.includes(index);
                      const repo = repos[index];
                      return (
                        <td
                          key={repo?.id ?? index}
                          className={`${isBest ? 'is-best' : ''}${isWorst ? ' is-worst' : ''}`}
                        >
                          <span className="mono">{value}</span>
                          {isBest ? <span className="diff-mark">更优</span> : null}
                          {isWorst ? <span className="diff-mark is-worst">更差</span> : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="compare-text-row">
                <th scope="row">
                  <span className="metric-row-label">适用场景</span>
                </th>
                {repos.map((repo) => (
                  <td key={repo.id}>{repo.bestFor}</td>
                ))}
              </tr>
              <tr className="compare-text-row">
                <th scope="row">
                  <span className="metric-row-label">主要优势</span>
                </th>
                {repos.map((repo) => (
                  <td key={repo.id}>
                    <ul className="compact-list">
                      {repo.pros.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr className="compare-text-row">
                <th scope="row">
                  <span className="metric-row-label">踩坑提示</span>
                </th>
                {repos.map((repo) => (
                  <td key={repo.id}>
                    <ul className="compact-list is-warning">
                      {repo.pitfalls.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr className="compare-group-row">
                <th scope="rowgroup" colSpan={repos.length + 1}>
                  <span className="compare-group-title">深度档案差异</span>
                  <span className="compare-group-hint">
                    能力上限、适用场景、工作流与硬短板来自 details 档案；档案缺失时回落到基础字段。
                  </span>
                </th>
              </tr>
              {archiveRows.map((row) => (
                <tr
                  key={row.key}
                  className={`compare-archive-row${row.kind === 'list' ? ' is-list' : ''}`}
                >
                  <th scope="row">
                    <span className="metric-row-label">{row.label}</span>
                    <span className="metric-row-hint">{row.hint}</span>
                  </th>
                  {row.values.map((value, index) => {
                    const repo = repos[index];
                    return (
                      <td key={repo?.id ?? index}>
                        {row.kind === 'list' ? (
                          <ul className="compact-list">
                            {value
                              .split('\n')
                              .filter(Boolean)
                              .map((item, itemIndex) => (
                                <li key={`${item}-${itemIndex}`}>{item}</li>
                              ))}
                          </ul>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
