import { useEffect, useMemo, useRef, useState } from 'react';
import type { Repo, RepoDetail } from '../../types/repo';
import type { DiscoveryDoc } from '../../types/discovery';
import {
  FALLBACK_QUERIES,
  applyConstraints,
  matchesConstraint,
  orderedRecommendations,
  quickPickRepos,
  repoByIdMap,
  searchRepos,
  suggestScenarios,
} from '../../lib/discovery';
import { computeOverallScore } from '../../lib/scores';
import { RepoThumb } from '../../components/RepoThumb';
import { Icon } from '../../components/Icon';

interface HomeViewProps {
  repos: Repo[];
  details: Record<string, RepoDetail>;
  discovery: DiscoveryDoc;
  onOpenScenario: (id: string) => void;
  onOpenRepo: (id: string) => void;
  onGoAll: () => void;
}

const MAX_RESULTS = 12;

function displayName(repo: Repo): string {
  return `${repo.owner}/${repo.repo}`;
}

export function HomeView({
  repos,
  details,
  discovery,
  onOpenScenario,
  onOpenRepo,
  onGoAll,
}: HomeViewProps) {
  const [query, setQuery] = useState('');
  const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const repoById = useMemo(() => repoByIdMap(repos), [repos]);
  const scenarios = discovery.scenarios;
  const constraints = discovery.constraints;

  const activeConstraints = useMemo(
    () => constraints.filter((constraint) => selectedConstraints.includes(constraint.id)),
    [constraints, selectedConstraints],
  );

  const searchHits = useMemo(
    () => searchRepos(repos, query, discovery.synonyms, details),
    [repos, query, discovery.synonyms, details],
  );
  const suggestions = useMemo(
    () => suggestScenarios(query, scenarios, discovery.synonyms, 2),
    [query, scenarios, discovery.synonyms],
  );

  const constraintResults = useMemo(() => {
    const base = query ? searchHits.map((hit) => hit.repo) : repos;
    const matched = applyConstraints(base, constraints, selectedConstraints);
    if (query) return matched;
    return [...matched].sort(
      (a, b) => computeOverallScore(b.repo.scores) - computeOverallScore(a.repo.scores),
    );
  }, [query, searchHits, repos, constraints, selectedConstraints]);

  const searching = query.trim().length > 0;
  const filtering = activeConstraints.length > 0;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggleConstraint = (id: string) => {
    setSelectedConstraints((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const visibleResults = constraintResults.slice(0, MAX_RESULTS);
  const leadSuggestion = suggestions[0] ?? null;

  const resultSummary = filtering
    ? `满足全部 ${activeConstraints.length} 条 · 剩余 ${constraintResults.length} 个`
    : `${searchHits.length} 个结果`;

  return (
    <div className="view home-view">
      <section className="home-hero" aria-labelledby="home-title">
        <span className="eyebrow">按需求选型 · 65 个实测仓库</span>
        <h1 id="home-title" tabIndex={-1}>
          告诉我想做什么，
          <span className="accent-text">直接挑到能出片的仓库</span>
        </h1>
        <p className="home-lead">
          不用先读完 65 个项目：说一句需求、选几个硬条件，或直接搜能力，就能拿到首选方案与备选对比。
        </p>

        <div className="home-search">
          <div className="home-search-field">
            <Icon name="search" size={18} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="试试搜：数学动画 / 终端录制 / 竖屏科普"
              aria-label="搜索仓库、能力或需求"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className="home-search-clear"
                onClick={() => setQuery('')}
                aria-label="清空搜索"
              >
                <Icon name="close" size={15} />
              </button>
            ) : null}
          </div>
          <span className={`home-search-count${searching ? ' is-active' : ''}`}>
            {searching ? `${searchHits.length} 个结果` : '支持 / 聚焦、Esc 清空'}
          </span>
        </div>
      </section>

      {searching ? (
        <section className="home-results" aria-live="polite" aria-label="搜索结果">
          {leadSuggestion ? (
            <div className="scenario-suggest">
              <span>
                按你的说法，最接近的是
                <strong className="accent-text">{leadSuggestion.scenario.titleZh}</strong>
              </span>
              <button
                type="button"
                className="ghost-button"
                onClick={() => onOpenScenario(leadSuggestion.scenario.id)}
              >
                {leadSuggestion.scenario.questionZh}
                <Icon name="arrow-right" size={14} />
              </button>
            </div>
          ) : null}

          <div className="results-head">
            <h2>搜索结果</h2>
            <span className="results-count mono">{resultSummary}</span>
          </div>

          {visibleResults.length > 0 ? (
            <ul className="result-list">
              {visibleResults.map(({ repo, matched }) => (
                <li key={repo.id}>
                  <button type="button" className="result-row" onClick={() => onOpenRepo(repo.id)}>
                    <RepoThumb repo={repo} size="md" />
                    <span className="result-main">
                      <span className="result-name">{displayName(repo)}</span>
                      <span className="result-desc">{repo.descriptionZh}</span>
                      <span className="result-tags">
                        <span className="tag">{repo.category}</span>
                        {matched.slice(0, 2).map((constraint) => (
                          <span className="tag is-match" key={constraint.id}>
                            {constraint.titleZh}
                          </span>
                        ))}
                        {repo.tags.slice(0, 2).map((tag) => (
                          <span className="tag is-subtle" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </span>
                    </span>
                    <span className="result-score mono">
                      {computeOverallScore(repo.scores).toFixed(1)}
                    </span>
                    <Icon name="arrow-right" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="home-empty">
              <Icon name="search" size={22} />
              <strong>没有匹配的仓库</strong>
              <p>换个说法试试，或者从这些常用需求开始：</p>
              <div className="fallback-terms">
                {FALLBACK_QUERIES.map((term) => (
                  <button
                    type="button"
                    className="chip chip-large"
                    key={term}
                    onClick={() => setQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchHits.length > MAX_RESULTS ? (
            <div className="results-more">
              <button type="button" className="ghost-button" onClick={onGoAll}>
                在全部项目里继续筛
                <Icon name="arrow-right" size={14} />
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <>
          <section className="home-section" aria-labelledby="home-scenarios">
            <div className="home-section-head">
              <div>
                <span className="eyebrow">先按需求</span>
                <h2 id="home-scenarios">你想做什么</h2>
              </div>
              <span className="muted">10 个常见需求，每个都给出首选与备选</span>
            </div>

            <div className="scenario-grid">
              {scenarios.map((scenario) => {
                const ordered = orderedRecommendations(scenario, repoById);
                const first = ordered[0];
                if (!first) return null;
                return (
                  <button
                    type="button"
                    className="scenario-card"
                    key={scenario.id}
                    onClick={() => onOpenScenario(scenario.id)}
                  >
                    <span className="scenario-label">{scenario.titleZh}</span>
                    <span className="scenario-question">{scenario.questionZh}</span>
                    <span className="scenario-first">
                      <RepoThumb repo={first.repo} size="md" />
                      <span className="scenario-first-main">
                        <span className="scenario-first-name">
                          {displayName(first.repo)}
                          <span className="scenario-first-verdict">首选</span>
                        </span>
                        <span className="scenario-why">{first.recommendation.whyZh}</span>
                      </span>
                      <Icon name="arrow-right" size={15} />
                    </span>
                    <span className="scenario-meta mono">
                      {first.recommendation.timeZh} · 备选 {Math.max(0, ordered.length - 1)} 个
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="home-section" aria-labelledby="home-constraints">
            <div className="home-section-head">
              <div>
                <span className="eyebrow">再按条件</span>
                <h2 id="home-constraints">先按条件筛</h2>
              </div>
              <span className="muted">可多选，条件之间是「并且」关系</span>
            </div>

            <div className="constraint-chips" role="group" aria-label="筛选条件">
              {constraints.map((constraint) => {
                const pressed = selectedConstraints.includes(constraint.id);
                const count = repos.filter((repo) => matchesConstraint(repo, constraint)).length;
                return (
                  <button
                    type="button"
                    key={constraint.id}
                    className={`chip chip-large${pressed ? ' is-active' : ''}`}
                    aria-pressed={pressed}
                    title={constraint.descZh}
                    onClick={() => toggleConstraint(constraint.id)}
                  >
                    {pressed ? <Icon name="check" size={13} /> : null}
                    {constraint.titleZh}
                    <span className="chip-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {filtering ? (
            <section className="home-results" aria-live="polite" aria-label="条件筛选结果">
              <div className="results-head">
                <h2>满足条件的仓库</h2>
                <span className="results-count mono">{resultSummary}</span>
              </div>
              {visibleResults.length > 0 ? (
                <ul className="result-list">
                  {visibleResults.map(({ repo, matched }) => (
                    <li key={repo.id}>
                      <button
                        type="button"
                        className="result-row"
                        onClick={() => onOpenRepo(repo.id)}
                      >
                        <RepoThumb repo={repo} size="md" />
                        <span className="result-main">
                          <span className="result-name">{displayName(repo)}</span>
                          <span className="result-desc">{repo.descriptionZh}</span>
                        </span>
                        <span className="result-match">
                          {matched.map((constraint) => (
                            <span className="tag is-match" key={constraint.id}>
                              {constraint.titleZh}
                            </span>
                          ))}
                        </span>
                        <Icon name="arrow-right" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="home-empty">
                  <Icon name="alert" size={22} />
                  <strong>没有仓库同时满足这些条件</strong>
                  <p>取消一条最严格的条件，或去全部项目里逐项放宽。</p>
                </div>
              )}
              {constraintResults.length > MAX_RESULTS ? (
                <div className="results-more">
                  <span className="muted">
                    仅显示前 {MAX_RESULTS} 个，共 {constraintResults.length} 个
                  </span>
                  <button type="button" className="ghost-button" onClick={onGoAll}>
                    在全部项目里继续筛
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="home-section" aria-labelledby="home-quick">
            <div className="home-section-head">
              <div>
                <span className="eyebrow">等不及了</span>
                <h2 id="home-quick">我现在就要一条片</h2>
              </div>
              <span className="muted">需求已经写好的 8 条直达路径</span>
            </div>

            <div className="quick-picks">
              {quickPickRepos(discovery, repoById).map(({ pick, repo }) => (
                <button
                  type="button"
                  className="quick-card"
                  key={`${pick.repoId}-${pick.needZh}`}
                  onClick={() => onOpenRepo(repo.id)}
                >
                  <span className="quick-need">{pick.needZh}</span>
                  <span className="quick-repo">
                    <RepoThumb repo={repo} size="sm" />
                    <span>{displayName(repo)}</span>
                  </span>
                  <span className="quick-time mono">{pick.timeZh}</span>
                  <span className="quick-why">{pick.whyZh}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="home-compare-entry">
            <div>
              <strong>拿不定？选 2–3 个并排看</strong>
              <span className="muted">
                到全部项目里勾选候选项，按基础指标与 13 行档案差异逐项对比。
              </span>
            </div>
            <button type="button" className="primary-button" onClick={onGoAll}>
              <Icon name="compare" size={15} />
              进全部项目
            </button>
          </section>
        </>
      )}

      {!searching && scenarios.length === 0 ? (
        <div className="home-empty">
          <Icon name="alert" size={22} />
          <strong>选型数据未就绪</strong>
          <p>请先生成 discovery.json 并重新构建。</p>
        </div>
      ) : null}
    </div>
  );
}
