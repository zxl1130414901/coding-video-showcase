import { useEffect, useMemo, useRef, useState } from 'react';
import type { Repo, RepoDetail } from '../../types/repo';
import type { DiscoveryScenario, DiscoveryWarning } from '../../types/discovery';
import {
  orderedRecommendations,
  repoByIdMap,
  reposForScenario,
  verdictAdvice,
  warningsForRepo,
} from '../../lib/discovery';
import { SCORE_DIMENSIONS, computeOverallScore, scorePercent } from '../../lib/scores';
import { isGifSample, resolveSampleUrl, resolveThumbUrl } from '../../lib/sample';
import { Icon } from '../../components/Icon';
import { RepoThumb } from '../../components/RepoThumb';

interface ScenarioViewProps {
  scenario: DiscoveryScenario;
  repos: Repo[];
  details: Record<string, RepoDetail>;
  warnings: DiscoveryWarning[];
  onBackHome: () => void;
  onOpenRepo: (id: string) => void;
}

function displayName(repo: Repo): string {
  return `${repo.owner}/${repo.repo}`;
}

function capabilityTags(repo: Repo, detail?: RepoDetail): string[] {
  const fromDetail = detail?.whatItMakes.map((item) => item.type).filter(Boolean) ?? [];
  const source = fromDetail.length > 0 ? fromDetail : repo.tags;
  return source.slice(0, 3);
}

const VERDICT_LABELS: Record<string, string> = {
  first: '首选',
  alt: '备选',
  heavy: '谨慎尝试',
};

export function ScenarioView({
  scenario,
  repos,
  details,
  warnings,
  onBackHome,
  onOpenRepo,
}: ScenarioViewProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [mediaError, setMediaError] = useState(false);
  const repoById = useMemo(() => repoByIdMap(repos), [repos]);
  const ordered = useMemo(() => orderedRecommendations(scenario, repoById), [scenario, repoById]);
  const first = ordered[0] ?? null;
  const firstRec = first?.recommendation ?? null;
  const firstDetail = first ? details[first.repo.id] : undefined;
  const allMatches = useMemo(() => reposForScenario(repos, scenario), [repos, scenario]);

  useEffect(() => {
    setMediaError(false);
    document.title = `${scenario.titleZh} · 代码转视频选型`;
    window.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      document.title = 'Code → Video · 65 个开源项目横评';
    };
  }, [scenario.id, scenario.titleZh]);

  if (!first || !firstRec) {
    return (
      <div className="view scenario-view">
        <button type="button" className="detail-back" onClick={onBackHome}>
          <span aria-hidden="true">←</span>
          返回选型首页
        </button>
        <div className="home-empty">
          <Icon name="alert" size={22} />
          <strong>该场景的首选项目暂时不可用</strong>
          <p>仓库数据可能已更新，请回到首页换一个需求。</p>
        </div>
      </div>
    );
  }

  const videoUrl = resolveSampleUrl(first.repo.sample.videoPath);
  const isGif = isGifSample(first.repo.sample.videoPath);
  const canPlay = first.repo.sample.status === 'ok' && Boolean(videoUrl) && !mediaError;
  const overall = computeOverallScore(first.repo.scores);
  const tags = capabilityTags(first.repo, firstDetail);
  const firstWarnings = warningsForRepo(warnings, first.repo);
  const leadWarning = firstWarnings[0] ?? null;

  return (
    <article className="view scenario-view" aria-labelledby="scenario-title">
      <nav className="detail-breadcrumb" aria-label="面包屑">
        <button type="button" className="detail-back" onClick={onBackHome}>
          <span aria-hidden="true">←</span>
          返回选型首页
        </button>
        <span className="detail-crumb mono">
          场景 · {scenario.recommended.length} 个推荐 · {allMatches.length} 个符合条件
        </span>
      </nav>

      <header className="scenario-head">
        <span className="scenario-label">{scenario.titleZh}</span>
        <h1 id="scenario-title" ref={titleRef} tabIndex={-1}>
          {scenario.questionZh}
        </h1>
        <p className="scenario-desc">{scenario.descZh}</p>
      </header>

      <section className="scenario-first-card" aria-label="首选方案">
        <div className="scenario-first-media">
          {canPlay && videoUrl ? (
            isGif ? (
              <img
                className="media-gif"
                src={videoUrl}
                alt={`${displayName(first.repo)} 能力演示动图`}
              />
            ) : (
              <video
                key={first.repo.id}
                controls
                preload="metadata"
                poster={resolveThumbUrl(first.repo.id)}
                aria-label={`${displayName(first.repo)} 首选方案视频`}
                onError={() => setMediaError(true)}
              >
                <source src={videoUrl} />
                当前浏览器不支持播放该视频。
              </video>
            )
          ) : (
            <div className="media-empty">
              <Icon name="film" size={24} />
              <strong>{mediaError ? '视频加载失败' : '暂无可用样例'}</strong>
              <span>可先查看仓库详情与实测数据。</span>
            </div>
          )}
        </div>

        <div className="scenario-first-body">
          <div className="scenario-first-head">
            <span className="scenario-first-badge">首选</span>
            <h2>{displayName(first.repo)}</h2>
            <span className="score-pill is-high mono">{overall.toFixed(1)}</span>
          </div>
          <p className="scenario-verdict">{firstRec.whyZh}</p>
          <div className="scenario-facts">
            <span>
              <span className="label">上手时间</span>
              <strong>{firstRec.timeZh}</strong>
            </span>
            <span>
              <span className="label">分类</span>
              <strong>{first.repo.category}</strong>
            </span>
          </div>

          <div className="scenario-tags">
            {tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="scenario-scores" aria-label="六维评分">
            {SCORE_DIMENSIONS.map((dimension) => {
              const value = first.repo.scores[dimension.key];
              return (
                <div className="score-row" key={dimension.key}>
                  <span className="score-name" title={dimension.hint}>
                    {dimension.label}
                  </span>
                  <span className="score-track" aria-hidden="true">
                    <span className="score-fill" style={{ width: `${scorePercent(value)}%` }} />
                  </span>
                  <span className="score-value mono">{value}/5</span>
                </div>
              );
            })}
          </div>

          {leadWarning ? (
            <div className="scenario-warning" role="status">
              <Icon name="alert" size={15} />
              <span>{leadWarning.riskZh}</span>
            </div>
          ) : null}

          <div className="scenario-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => onOpenRepo(first.repo.id)}
            >
              进入完整详情
              <Icon name="arrow-right" size={15} />
            </button>
          </div>
        </div>
      </section>

      <section className="scenario-section" aria-labelledby="scenario-alts">
        <div className="home-section-head">
          <div>
            <span className="eyebrow">备选对比</span>
            <h2 id="scenario-alts">为什么不是首选，什么时候选它</h2>
          </div>
          <span className="muted">{Math.max(0, ordered.length - 1)} 个备选</span>
        </div>

        <ul className="alt-recommend-list">
          {ordered.slice(1).map(({ repo, recommendation }) => {
            const advice = verdictAdvice(recommendation);
            return (
              <li key={repo.id}>
                <div className="alt-recommend-row">
                  <RepoThumb repo={repo} size="md" />
                  <div className="alt-recommend-main">
                    <div className="alt-recommend-title">
                      <strong>{displayName(repo)}</strong>
                      <span className={`verdict-tag is-${recommendation.verdict}`}>
                        {VERDICT_LABELS[recommendation.verdict]}
                      </span>
                      <span className="score-pill mono">
                        {computeOverallScore(repo.scores).toFixed(1)}
                      </span>
                    </div>
                    <p className="alt-recommend-why">{recommendation.whyZh}</p>
                    <dl className="alt-recommend-advice">
                      <div>
                        <dt>为什么不是首选</dt>
                        <dd>{advice.whyNotFirstZh}</dd>
                      </div>
                      <div>
                        <dt>什么时候选它</dt>
                        <dd>{advice.chooseWhenZh}</dd>
                      </div>
                    </dl>
                  </div>
                  <button
                    type="button"
                    className="ghost-button alt-open"
                    onClick={() => onOpenRepo(repo.id)}
                  >
                    看详情
                    <Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="scenario-section" aria-labelledby="scenario-all">
        <div className="home-section-head">
          <div>
            <span className="eyebrow">完整清单</span>
            <h2 id="scenario-all">该场景全部符合条件的仓库</h2>
          </div>
          <span className="muted">按分类 / 标签命中，按综合分排序</span>
        </div>

        <ul className="scenario-repo-list">
          {allMatches.map(({ repo, reasons }) => (
            <li key={repo.id}>
              <button type="button" className="result-row" onClick={() => onOpenRepo(repo.id)}>
                <RepoThumb repo={repo} size="sm" />
                <span className="result-main">
                  <span className="result-name">{displayName(repo)}</span>
                  <span className="result-desc">{repo.descriptionZh}</span>
                </span>
                <span className="result-match">
                  {reasons.slice(0, 2).map((reason) => (
                    <span className="tag is-match" key={reason}>
                      {reason}
                    </span>
                  ))}
                </span>
                <span className="result-score mono">
                  {computeOverallScore(repo.scores).toFixed(1)}
                </span>
                <Icon name="arrow-right" size={15} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
