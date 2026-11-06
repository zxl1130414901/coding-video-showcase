import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FilterState, RouteState, SortKey, ViewKey } from './types/repo';
import { useDataset } from './features/data/useDataset';
import { createEmptyFilters, filterRepos } from './lib/filter';
import { computeOverviewStats } from './lib/stats';
import { nextSortDirection, sortRepos } from './lib/sort';
import { canCompare, toggleSelection, MAX_COMPARE } from './lib/selection';
import { parseRouteHash, syncLocationHash } from './lib/hash';
import { OverviewView } from './features/overview/OverviewView';
import { HomeView } from './features/home/HomeView';
import { ScenarioView } from './features/scenario/ScenarioView';
import { MatrixView } from './features/matrix/MatrixView';
import { TimelineView } from './features/timeline/TimelineView';
import { RepoDetailLanding, RepoDetailPage } from './features/detail/RepoDetailPage';
import { CompareView } from './features/compare/CompareView';
import { CompareBar } from './components/CompareBar';
import { Toast } from './components/Toast';
import { Icon, type IconName } from './components/Icon';
import { resolveDetail } from './lib/detail';
import { isFileProtocol } from './lib/sample';

const NAV: Array<{ view: ViewKey; label: string; icon: IconName }> = [
  { view: 'home', label: '选型首页', icon: 'search' },
  { view: 'matrix', label: '全部项目', icon: 'table' },
  { view: 'overview', label: '总览', icon: 'grid' },
  { view: 'timeline', label: '时间线', icon: 'clock' },
];

function BootScreen() {
  return (
    <div className="boot-screen">
      <span className="boot-mark" aria-hidden="true">
        <Icon name="logo" size={30} />
      </span>
      <span className="boot-eyebrow">正在加载数据</span>
      <h1>正在载入项目评测数据</h1>
      <div className="boot-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <span className="muted">读取构建期注入的 repos.json …</span>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="boot-screen error-screen" role="alert">
      <span className="boot-mark is-error" aria-hidden="true">
        <Icon name="alert" size={28} />
      </span>
      <span className="boot-eyebrow">数据载入错误</span>
      <h1>数据载入失败</h1>
      <p className="error-message">{message}</p>
      <p className="muted">
        请确认 <code>F:\coding视频\showcase\data\repos.json</code>{' '}
        存在且符合数据契约；开发阶段可运行
        <code> npm run dev</code> 使用占位数据。
      </p>
    </div>
  );
}

export default function App() {
  const datasetState = useDataset();
  const [route, setRoute] = useState<RouteState>(() => {
    try {
      return parseRouteHash(window.location.hash);
    } catch {
      return parseRouteHash('');
    }
  });
  const [compareOpen, setCompareOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const offlineMode = isFileProtocol();

  const notify = useCallback((message: string) => setToast(message), []);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const handler = () => setRoute(parseRouteHash(window.location.hash));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    syncLocationHash(route);
  }, [route]);

  const repos = datasetState.status === 'ready' ? datasetState.data.dataset.repos : [];
  const details = datasetState.status === 'ready' ? datasetState.data.details : {};
  const features = datasetState.status === 'ready' ? datasetState.data.features : {};
  const sampleSizes = datasetState.status === 'ready' ? datasetState.data.sampleSizes : {};
  const discovery = datasetState.status === 'ready' ? datasetState.data.discovery : null;
  const intents = datasetState.status === 'ready' ? datasetState.data.intents : null;
  const isSample = datasetState.status === 'ready' ? datasetState.data.source.isSample : false;
  const dataFile = datasetState.status === 'ready' ? datasetState.data.source.file : '';
  const detailCount = Object.keys(details).length;

  const stats = useMemo(() => computeOverviewStats(repos), [repos]);
  const filteredRepos = useMemo(() => filterRepos(repos, route.filters), [repos, route.filters]);
  const sortedRepos = useMemo(
    () => sortRepos(filteredRepos, route.sortKey, route.sortDir),
    [filteredRepos, route.sortKey, route.sortDir],
  );
  const selectedRepos = useMemo(
    () =>
      route.selected
        .map((id) => repos.find((repo) => repo.id === id))
        .filter((repo): repo is (typeof repos)[number] => Boolean(repo)),
    [route.selected, repos],
  );
  const detailRepo = useMemo(
    () => (route.repoId ? (repos.find((repo) => repo.id === route.repoId) ?? null) : null),
    [route.repoId, repos],
  );
  const detailRecord = useMemo(
    () => (detailRepo ? resolveDetail(detailRepo, details) : null),
    [detailRepo, details],
  );
  const scenario = useMemo(
    () => discovery?.scenarios.find((item) => item.id === route.scenarioId) ?? null,
    [discovery, route.scenarioId],
  );

  if (datasetState.status === 'loading') return <BootScreen />;
  if (datasetState.status === 'error') return <ErrorScreen message={datasetState.message} />;

  const setView = (view: ViewKey) =>
    setRoute((prev) => ({
      ...prev,
      view,
      repoId: view === 'detail' ? prev.repoId : null,
    }));

  const handleOpenScenario = (id: string) => {
    setRoute((prev) => ({ ...prev, view: 'scenario', scenarioId: id, repoId: null }));
  };

  const handleSort = (key: SortKey) => {
    setRoute((prev) => ({
      ...prev,
      sortKey: key,
      sortDir: nextSortDirection(key, prev.sortKey, prev.sortDir),
    }));
  };

  const handleFiltersChange = (filters: FilterState) => {
    setRoute((prev) => ({ ...prev, filters, view: 'matrix', repoId: null, scenarioId: null }));
  };

  const handleResetFilters = () => {
    setRoute((prev) => ({ ...prev, filters: createEmptyFilters() }));
  };

  const handleToggleSelect = (id: string) => {
    const result = toggleSelection(route.selected, id);
    if (result.rejected) {
      notify(`最多同时对比 ${MAX_COMPARE} 个项目，请先移除一个。`);
      return;
    }
    if (compareOpen && result.ids.length < 2) setCompareOpen(false);
    setRoute((prev) => ({ ...prev, selected: result.ids }));
  };

  const handleRemoveSelected = (id: string) => {
    const ids = route.selected.filter((item) => item !== id);
    if (ids.length < 2) setCompareOpen(false);
    setRoute((prev) => ({ ...prev, selected: ids }));
  };

  const handleClearSelected = () => {
    setCompareOpen(false);
    setRoute((prev) => ({ ...prev, selected: [] }));
  };

  const handleOpenRepo = (id: string) => {
    setCompareOpen(false);
    setRoute((prev) => ({
      ...prev,
      repoId: id,
      view: 'detail',
      fromView: prev.view === 'detail' ? (prev.fromView ?? 'matrix') : prev.view,
    }));
  };

  const handleBackFromDetail = () => {
    setRoute((prev) => ({
      ...prev,
      repoId: null,
      view: prev.fromView && prev.fromView !== 'detail' ? prev.fromView : 'matrix',
    }));
    window.scrollTo({ top: 0 });
    window.setTimeout(() => document.getElementById('view-title')?.focus(), 0);
  };

  return (
    <div className={`app-shell view-${route.view}`}>
      <a className="skip-link" href="#main">
        跳到主要内容
      </a>

      <header className="topbar">
        <div className="brand" aria-label="代码转视频开源项目横评">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="logo" size={22} />
          </span>
          <span className="brand-text">
            <strong>代码转视频</strong>
            <span>65 个开源项目横评</span>
          </span>
        </div>

        <nav className="nav" aria-label="主导航">
          {NAV.map((item) => (
            <button
              type="button"
              key={item.view}
              className={`nav-button${route.view === item.view ? ' is-active' : ''}`}
              aria-current={route.view === item.view ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              onClick={() => setView(item.view)}
            >
              <Icon name={item.icon} size={16} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="topbar-meta">
          <span className="data-pill">
            <span className={`data-dot${isSample ? ' is-sample' : ''}`} aria-hidden="true" />
            {isSample ? '占位数据' : '真实数据'}
          </span>
          <span className="topbar-count mono">{repos.length} 个项目</span>
        </div>
      </header>

      {isSample ? (
        <div className="sample-banner" role="status">
          <Icon name="alert" size={15} />
          <span>
            当前使用开发占位数据（{repos.length} 条）。真实 <code>repos.json</code> 尚未接入；运行
            <code> npm run build</code> 会在数据缺失时直接失败。
          </span>
        </div>
      ) : null}

      {offlineMode ? (
        <div className="sample-banner" role="status">
          <Icon name="alert" size={15} />
          <span>
            离线模式：单个 <code>index.html</code> 不含缩略图与视频。请把整个 <code>dist</code>{' '}
            目录一起拷贝，并保持与 <code>_samples</code> 的相对目录结构；资源缺失时样例区会提示
            「资源未随文件一起拷贝」。
          </span>
        </div>
      ) : null}

      <main id="main">
        {route.view === 'home' ? (
          <HomeView
            repos={repos}
            details={details}
            discovery={
              discovery ?? {
                scenarios: [],
                constraints: [],
                quickPicks: [],
                synonyms: {},
                warnings: [],
              }
            }
            intents={
              intents ?? {
                repos: {},
                scenarios: {},
                global: [],
              }
            }
            onOpenScenario={handleOpenScenario}
            onOpenRepo={handleOpenRepo}
            onGoAll={() => setView('matrix')}
          />
        ) : null}

        {route.view === 'scenario' && scenario ? (
          <ScenarioView
            scenario={scenario}
            repos={repos}
            details={details}
            warnings={discovery?.warnings ?? []}
            onBackHome={() => setView('home')}
            onOpenRepo={handleOpenRepo}
          />
        ) : null}

        {route.view === 'scenario' && !scenario ? (
          <div className="view scenario-view" role="alert">
            <div className="archive-warning">
              <Icon name="alert" size={16} />
              <span>
                <strong>未找到该场景</strong>：深链中的 id <code>{route.scenarioId}</code>{' '}
                不在选型数据中，已回到选型首页。
              </span>
            </div>
            <button type="button" className="primary-button" onClick={() => setView('home')}>
              回到选型首页
            </button>
          </div>
        ) : null}

        {route.view === 'overview' ? (
          <OverviewView
            repos={repos}
            stats={stats}
            isSample={isSample}
            onGoMatrix={() => setView('matrix')}
            onGoTimeline={() => setView('timeline')}
            onApplyCategory={(category) =>
              setRoute((prev) => ({
                ...prev,
                view: 'matrix',
                filters: { ...prev.filters, categories: [category] },
              }))
            }
          />
        ) : null}

        {route.view === 'matrix' ? (
          <MatrixView
            allRepos={repos}
            repos={sortedRepos}
            filters={route.filters}
            sortKey={route.sortKey}
            sortDir={route.sortDir}
            selectedIds={route.selected}
            onFiltersChange={handleFiltersChange}
            onResetFilters={handleResetFilters}
            onSort={handleSort}
            onOpenRepo={handleOpenRepo}
            onToggleSelect={handleToggleSelect}
            onGoHome={() => setView('home')}
          />
        ) : null}

        {route.view === 'timeline' ? (
          <TimelineView repos={repos} onOpenRepo={handleOpenRepo} />
        ) : null}

        {route.view === 'detail' && detailRepo && detailRecord ? (
          <RepoDetailPage
            repo={detailRepo}
            detail={detailRecord}
            features={features[detailRepo.id]}
            sampleSizes={sampleSizes[detailRepo.id]}
            allRepos={repos}
            selectedIds={route.selected}
            fromView={route.fromView}
            onBack={handleBackFromDetail}
            onOpenRepo={handleOpenRepo}
            onToggleSelect={handleToggleSelect}
            onGoMatrix={() => setView('matrix')}
            onNotify={notify}
          />
        ) : null}

        {route.view === 'detail' && route.repoId && !detailRepo ? (
          <div className="view detail-view" role="alert">
            <div className="archive-warning">
              <Icon name="alert" size={16} />
              <span>
                <strong>未找到该仓库</strong>：深链中的 id <code>{route.repoId}</code>{' '}
                不在数据集中，已回到详情入口。
              </span>
            </div>
            <RepoDetailLanding
              repos={repos}
              detailCount={detailCount}
              onOpenRepo={handleOpenRepo}
              onGoMatrix={() => setView('matrix')}
            />
          </div>
        ) : null}

        {route.view === 'detail' && !route.repoId ? (
          <RepoDetailLanding
            repos={repos}
            detailCount={detailCount}
            onOpenRepo={handleOpenRepo}
            onGoMatrix={() => setView('matrix')}
          />
        ) : null}
      </main>

      <footer className="footer">
        <span>本地离线可用 · 无外部 CDN</span>
        <span className="footer-source mono" title={dataFile}>
          数据源：{isSample ? 'repos.sample.json' : 'repos.json'} · {detailCount} 份档案 ·{' '}
          {Object.keys(features).length} 份能力分段 · 只读消费
        </span>
      </footer>

      <CompareBar
        repos={selectedRepos}
        onRemove={handleRemoveSelected}
        onClear={handleClearSelected}
        onCompare={() => {
          if (canCompare(route.selected)) setCompareOpen(true);
          else notify('至少选择 2 个项目才能对比。');
        }}
        onOpenRepo={handleOpenRepo}
      />

      {compareOpen && selectedRepos.length >= 2 ? (
        <CompareView
          repos={selectedRepos}
          details={details}
          features={features}
          onClose={() => setCompareOpen(false)}
          onOpenRepo={handleOpenRepo}
          onCopied={notify}
        />
      ) : null}

      <Toast message={toast} onClose={closeToast} />
    </div>
  );
}
