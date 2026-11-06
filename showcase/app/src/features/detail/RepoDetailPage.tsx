import { useEffect, useMemo, useRef, useState } from 'react';
import type { DetailRecord, Repo, SampleFeatures, ViewKey } from '../../types/repo';
import type { SampleSizes } from '../../data';
import {
  formatBytes,
  formatCompactNumber,
  formatIsoDate,
  formatMs,
  formatResolution,
  formatSeconds,
} from '../../lib/format';
import {
  fileUrlFromWindowsPath,
  isFileProtocol,
  isGifSample,
  localRepoPath,
  resolveSampleUrl,
  resolveThumbUrl,
} from '../../lib/sample';
import { SCORE_DIMENSIONS, computeOverallScore, scorePercent } from '../../lib/scores';
import { MAX_COMPARE } from '../../lib/selection';
import {
  activeCalloutAt,
  activeSegmentAt,
  buildDetailTitle,
  capabilityFields,
  detailArchiveLabel,
  detailCompleteness,
  displayName,
  evidenceSummary,
  featureSummary,
  findRepoByReference,
  formatTimeRange,
  formatTimecode,
  toReadableParagraphs,
} from '../../lib/detail';
import { Icon } from '../../components/Icon';
import { RepoThumb } from '../../components/RepoThumb';
import { StatusBadge } from '../../components/StatusBadge';

interface RepoDetailPageProps {
  repo: Repo;
  detail: DetailRecord;
  features?: SampleFeatures;
  sampleSizes?: SampleSizes;
  allRepos: Repo[];
  selectedIds: string[];
  fromView: ViewKey | null;
  onBack: () => void;
  onOpenRepo: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onGoMatrix: () => void;
  onNotify: (message: string) => void;
}

const BASE_TITLE = 'Code → Video · 65 个开源项目横评';
const VIEW_LABELS: Record<Exclude<ViewKey, 'detail'>, string> = {
  home: '选型首页',
  scenario: '场景页',
  overview: '总览',
  matrix: '全部项目',
  timeline: '时间线',
};

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className="spec-value mono">{value}</span>
    </div>
  );
}

function SectionHead({
  step,
  title,
  hint,
  id,
}: {
  step: string;
  title: string;
  hint?: string;
  id: string;
}) {
  return (
    <div className="detail-section-head">
      <span className="detail-step mono" aria-hidden="true">
        {step}
      </span>
      <div>
        <h2 id={id}>{title}</h2>
        {hint ? <p className="muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export function RepoDetailPage({
  repo,
  detail,
  features,
  sampleSizes,
  allRepos,
  selectedIds,
  fromView,
  onBack,
  onOpenRepo,
  onToggleSelect,
  onGoMatrix,
  onNotify,
}: RepoDetailPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [sampleMode, setSampleMode] = useState<'feature' | 'basic'>('feature');
  const [mediaError, setMediaError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const overall = computeOverallScore(repo.scores);
  const isFallback = Boolean(detail.isFallback);
  const selected = selectedIds.includes(repo.id);
  const selectionFull = selectedIds.length >= MAX_COMPARE && !selected;
  const completeness = detailCompleteness(detail);
  const backLabel = VIEW_LABELS[fromView && fromView !== 'detail' ? fromView : 'matrix'];

  useEffect(() => {
    document.title = buildDetailTitle(repo);
    return () => {
      document.title = BASE_TITLE;
    };
  }, [repo]);

  useEffect(() => {
    setSampleMode('feature');
    setMediaError(false);
    setCurrentTime(0);
    setVideoDuration(null);
    window.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
  }, [repo.id]);

  const basicPath = `_samples/${repo.id}/sample_basic.mp4`;
  const activeVideoPath = sampleMode === 'basic' ? basicPath : repo.sample.videoPath;
  const videoUrl = resolveSampleUrl(activeVideoPath);
  const isGif = sampleMode === 'feature' && isGifSample(repo.sample.videoPath);
  const thumbUrl = resolveThumbUrl(repo.id);
  const canPlay = repo.sample.status === 'ok' && Boolean(videoUrl) && !mediaError;
  const offlineMode = isFileProtocol();
  const spec = repo.sample.spec;
  const isBasicMode = sampleMode === 'basic';
  const effectiveDuration =
    (isBasicMode
      ? spec?.durationSec
      : (features?.durationSec ?? videoDuration ?? spec?.durationSec)) ?? null;
  const effectiveFrames =
    isBasicMode && spec
      ? spec.frames
      : spec && effectiveDuration !== null
        ? Math.round(effectiveDuration * spec.fps)
        : null;
  const effectiveBytes =
    (isBasicMode ? sampleSizes?.basicBytes : sampleSizes?.mainBytes) ?? spec?.bytes;
  const localPath = localRepoPath(repo.owner, repo.repo, repo.localPath);

  const altTargets = useMemo(
    () =>
      repo.alternatives.map((reference) => ({
        reference,
        target: findRepoByReference(allRepos, reference),
      })),
    [repo.alternatives, allRepos],
  );

  const compareTips = useMemo(
    () =>
      detail.compareTips.map((tip) => ({
        ...tip,
        target: findRepoByReference(allRepos, tip.vs),
      })),
    [detail.compareTips, allRepos],
  );

  const fields = capabilityFields(detail.capabilities);
  const secondaryFields = fields.filter(
    (field) => !['resolution', 'fps', 'duration', 'formats'].includes(field.key),
  );
  const ceilingParagraphs = toReadableParagraphs(detail.ceilingZh, 3);
  const activeSegment = features ? activeSegmentAt(features, currentTime) : null;
  const activeCallout = features ? activeCalloutAt(features, currentTime) : null;
  const timelineDuration = features?.durationSec ?? spec?.durationSec ?? videoDuration ?? 1;

  function handleSelect() {
    if (selectionFull) {
      onNotify(`最多同时对比 ${MAX_COMPARE} 个项目，请先移除一个。`);
      return;
    }
    onToggleSelect(repo.id);
  }

  function seek(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    try {
      video.currentTime = seconds;
      setCurrentTime(seconds);
      void video.play().catch(() => undefined);
    } catch {
      // 不支持 seek 的格式（如 GIF）保持静态展示。
    }
  }

  return (
    <article className="view detail-view" aria-labelledby="detail-title">
      <nav className="detail-breadcrumb" aria-label="面包屑">
        <button type="button" className="detail-back" onClick={onBack}>
          <span aria-hidden="true">←</span>
          返回{backLabel}
        </button>
        <span className="detail-crumb mono">
          {repo.category}
          <span className="dot-sep">·</span>
          {String(repo.stars)} Star
          <span className="dot-sep">·</span>
          档案 {isFallback ? '未就绪' : `${completeness.filled}/${completeness.total}`}
        </span>
      </nav>

      <header className="detail-hero">
        <div className="detail-hero-main">
          <div className="detail-tags">
            <span className="category-badge">{repo.category}</span>
            <StatusBadge status={repo.sample.status} compact />
            <span className={`archive-badge${isFallback ? ' is-missing' : ''}`}>
              <span className="status-dot" aria-hidden="true" />
              {detailArchiveLabel(detail)}
            </span>
            {features ? (
              <span className="archive-badge is-feature">
                <span className="status-dot" aria-hidden="true" />
                能力分段 {features.segments.length} 段
              </span>
            ) : null}
          </div>

          <h1 id="detail-title" ref={titleRef} tabIndex={-1}>
            <span className="repo-owner">{repo.owner}/</span>
            {repo.repo}
          </h1>
          <p className="detail-tagline">{detail.taglineZh}</p>

          {detail.summaryZh ? (
            <div className="detail-summary">
              {toReadableParagraphs(detail.summaryZh, 2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          <div className="detail-meta" aria-label="仓库基础信息">
            <span className="detail-meta-item">
              <Icon name="star" size={14} />
              <strong className="mono">{formatCompactNumber(repo.stars)}</strong> Star
            </span>
            <span className="detail-meta-item mono">{repo.license ?? '未声明许可证'}</span>
            <span className="detail-meta-item mono">{repo.language ?? '未知语言'}</span>
            <span className="detail-meta-item mono">最近推送 {formatIsoDate(repo.pushedAt)}</span>
            {repo.homepage ? (
              <a
                className="detail-meta-item is-link"
                href={repo.homepage}
                target="_blank"
                rel="noreferrer noopener"
              >
                主页
                <Icon name="external" size={12} />
              </a>
            ) : null}
          </div>

          <div className="detail-actions">
            <a className="primary-button" href={repo.url} target="_blank" rel="noreferrer noopener">
              <Icon name="external" size={15} />
              GitHub 仓库
            </a>
            <button
              type="button"
              className={`ghost-button${selected ? ' is-selected' : ''}`}
              onClick={handleSelect}
              disabled={selectionFull}
              aria-pressed={selected}
              title={selectionFull ? `最多同时对比 ${MAX_COMPARE} 个` : undefined}
            >
              <Icon name={selected ? 'check' : 'compare'} size={15} />
              {selected ? `已在对比（${selectedIds.length}）` : '加入对比'}
            </button>
            <a
              className="ghost-button"
              href={fileUrlFromWindowsPath(localPath)}
              target="_blank"
              rel="noreferrer noopener"
              title={localPath}
            >
              <Icon name="folder" size={15} />
              本地目录
            </a>
          </div>
        </div>

        <aside className="detail-hero-side" aria-label="评分与基础档案">
          <div className="detail-poster">
            {repo.sample.thumbPath ? (
              <img src={thumbUrl} alt={`${displayName(repo)} 样例缩略图`} />
            ) : (
              <div className="detail-poster-empty">
                <Icon name="film" size={22} />
                <span>暂无缩略图</span>
              </div>
            )}
          </div>
          <div className="detail-score-head">
            <span className="label">综合评分</span>
            <span className="detail-score-value mono">{overall.toFixed(1)}</span>
          </div>
          <div className="score-list">
            {SCORE_DIMENSIONS.map((dimension) => {
              const value = repo.scores[dimension.key];
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
        </aside>
      </header>

      {isFallback ? (
        <div className="archive-warning" role="status">
          <Icon name="alert" size={16} />
          <span>
            <strong>档案未就绪</strong>
            ：该项目的深度档案（details/{repo.id}.json）尚未生成，本页已回落到 repos.json
            基础字段。能力上限、工作流与实测证据会在档案补齐后自动出现。
          </span>
        </div>
      ) : null}

      <section className="detail-section" aria-labelledby="detail-what">
        <SectionHead
          step="01"
          id="detail-what"
          title="它到底能做什么"
          hint="按产出物类型拆分，强度标签来自深度档案。"
        />
        <div className="what-grid">
          {detail.whatItMakes.map((item, index) => (
            <article className="what-card" key={`${index}-${item.type}`}>
              <div className="what-card-head">
                <h3>{item.type}</h3>
                <span className={`strength-tag${item.strength.includes('核心') ? ' is-core' : ''}`}>
                  {item.strength}
                </span>
              </div>
              <p>{item.exampleZh}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section" aria-labelledby="detail-usecases">
        <SectionHead
          step="02"
          id="detail-usecases"
          title="适用场景"
          hint="场景 / 人群 / 为什么选它 / 交付物 / 契合度。"
        />
        <div className="use-grid">
          {detail.useCases.map((item, index) => (
            <article className="use-card" key={`${index}-${item.scenarioZh}`}>
              <div className="use-card-head">
                <h3>{item.scenarioZh}</h3>
                <span className={`fit-tag${item.fit.includes('高度') ? ' is-high' : ''}`}>
                  {item.fit}
                </span>
              </div>
              <dl className="use-facts">
                <div>
                  <dt>人群</dt>
                  <dd>{item.whoZh}</dd>
                </div>
                <div>
                  <dt>为什么选它</dt>
                  <dd>{item.whyZh}</dd>
                </div>
                <div>
                  <dt>交付物</dt>
                  <dd className="mono">{item.deliverableZh}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section" aria-labelledby="detail-capability">
        <SectionHead
          step="03"
          id="detail-capability"
          title="能力上限"
          hint="分辨率、帧率与时长优先；长文按句重排为可读段落。"
        />
        <div className="capability-stats">
          <div className="capability-stat">
            <span className="label">最高分辨率</span>
            <strong className="mono">{detail.capabilities.maxResolutionZh}</strong>
          </div>
          <div className="capability-stat">
            <span className="label">最高帧率</span>
            <strong className="mono">{detail.capabilities.maxFpsZh}</strong>
          </div>
          <div className="capability-stat">
            <span className="label">时长能力</span>
            <strong className="mono">{detail.capabilities.durationZh}</strong>
          </div>
          <div className="capability-stat">
            <span className="label">导出格式</span>
            <span className="tag-cloud">
              {detail.capabilities.exportFormatsZh.length > 0 ? (
                detail.capabilities.exportFormatsZh.map((format, index) => (
                  <span className="tag" key={`${index}-${format}`}>
                    {format}
                  </span>
                ))
              ) : (
                <span className="muted">档案未就绪</span>
              )}
            </span>
          </div>
        </div>

        <div className="capability-layout">
          <div className="capability-table">
            {secondaryFields.map((field) => (
              <div className="capability-row" key={field.key}>
                <span className="capability-label">{field.label}</span>
                <div className="capability-value">
                  {field.tags && field.tags.length > 0 ? (
                    <span className="tag-cloud">
                      {field.tags.map((value, index) => (
                        <span className="tag" key={`${index}-${value}`}>
                          {value}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span>{field.value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="detail-prose">
            <h3 className="detail-prose-title">实测天花板</h3>
            {ceilingParagraphs.length > 0 ? (
              ceilingParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            ) : (
              <p className="muted">该项目的天花板长文尚未生成。</p>
            )}
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="detail-workflow">
        <SectionHead
          step="04"
          id="detail-workflow"
          title="完整工作流"
          hint="从初始化到导出，每一步标注投入成本。"
        />
        {detail.workflow.length > 0 ? (
          <ol className="workflow-list">
            {detail.workflow.map((step, index) => (
              <li className="workflow-step" key={`${step.stepZh}-${index}`}>
                <span className="workflow-index mono">{String(index + 1).padStart(2, '0')}</span>
                <div className="workflow-body">
                  <div className="workflow-head">
                    <h3>{step.stepZh}</h3>
                    <span className="effort-tag">{step.effortZh}</span>
                  </div>
                  <p>{step.detailZh}</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted section-placeholder">该项目的完整工作流尚未生成。</p>
        )}
      </section>

      <section className="detail-section" aria-labelledby="detail-gap">
        <SectionHead
          step="05"
          id="detail-gap"
          title="差异化与硬短板"
          hint="短板不隐藏；先看清边界，再决定是否采用。"
        />
        <div className="gap-grid">
          <div className="gap-column is-positive">
            <h3>
              <Icon name="check" size={15} />
              差异化
            </h3>
            {detail.differentiators.length > 0 ? (
              <ul>
                {detail.differentiators.map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">暂无差异化记录。</p>
            )}
          </div>
          <div className="gap-column is-negative">
            <h3>
              <Icon name="alert" size={15} />
              硬短板
            </h3>
            {detail.limits.length > 0 ? (
              <ul>
                {detail.limits.map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">暂无短板记录。</p>
            )}
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="detail-compare">
        <SectionHead
          step="06"
          id="detail-compare"
          title="和谁比、怎么选"
          hint="点击右侧项目名可直接跳转到对应详情页。"
        />
        {compareTips.length > 0 ? (
          <div className="compare-tip-list">
            {compareTips.map(({ vs, adviceZh, target }, index) => (
              <article className="compare-tip-row" key={`${index}-${vs}`}>
                <div className="compare-tip-vs">
                  <span className="label">VS</span>
                  {target ? (
                    <button
                      type="button"
                      className="compare-tip-link"
                      onClick={() => onOpenRepo(target.id)}
                    >
                      {displayName(target)}
                      <Icon name="arrow-right" size={13} />
                    </button>
                  ) : (
                    <span className="chip is-static">{vs}</span>
                  )}
                </div>
                <p>{adviceZh}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted section-placeholder">
            暂无对比建议；可回到对比矩阵中选择同类项目并排查看。
          </p>
        )}
        {altTargets.length > 0 ? (
          <div className="alt-block">
            <span className="label">替代项目</span>
            <div className="alt-list">
              {altTargets.map(({ reference, target }, index) =>
                target ? (
                  <button
                    type="button"
                    className="chip"
                    key={`${index}-${reference}`}
                    onClick={() => onOpenRepo(target.id)}
                  >
                    {target.owner}/{target.repo}
                    <Icon name="arrow-right" size={13} />
                  </button>
                ) : (
                  <span className="chip is-static" key={`${index}-${reference}`}>
                    {reference}
                  </span>
                ),
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="detail-section" aria-labelledby="detail-sample">
        <SectionHead
          step="07"
          id="detail-sample"
          title="样例"
          hint="主视频为 20–40 秒新能力演示，可切换到旧基础样例。"
        />
        {detail.showcase.demoBriefZh ? (
          <div className="demo-brief">
            <span className="label">演示脚本</span>
            <p>{detail.showcase.demoBriefZh}</p>
          </div>
        ) : null}

        <div className="sample-panel">
          <div className="sample-toolbar">
            <div className="segment" role="group" aria-label="样例类型">
              <button
                type="button"
                className={`segment-button${sampleMode === 'feature' ? ' is-active' : ''}`}
                aria-pressed={sampleMode === 'feature'}
                onClick={() => {
                  setSampleMode('feature');
                  setMediaError(false);
                  setCurrentTime(0);
                }}
              >
                能力演示
              </button>
              <button
                type="button"
                className={`segment-button${sampleMode === 'basic' ? ' is-active' : ''}`}
                aria-pressed={sampleMode === 'basic'}
                onClick={() => {
                  setSampleMode('basic');
                  setMediaError(false);
                  setCurrentTime(0);
                }}
              >
                基础样例
              </button>
            </div>
            <span className="muted mono sample-mode-note">
              {sampleMode === 'feature' ? 'sample.mp4' : 'sample_basic.mp4'}
            </span>
          </div>

          <div className="media-frame detail-media">
            {canPlay && videoUrl ? (
              isGif ? (
                <img
                  src={videoUrl}
                  alt={`${displayName(repo)} 能力演示动图`}
                  className="media-gif"
                />
              ) : (
                <video
                  key={`${repo.id}-${sampleMode}`}
                  ref={videoRef}
                  controls
                  preload="metadata"
                  poster={repo.sample.thumbPath ? thumbUrl : undefined}
                  aria-label={`${displayName(repo)} ${sampleMode === 'feature' ? '能力演示' : '基础样例'}视频`}
                  onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration;
                    if (Number.isFinite(duration)) setVideoDuration(duration);
                  }}
                  onError={() => setMediaError(true)}
                >
                  <source src={videoUrl} />
                  当前浏览器不支持播放该视频。
                </video>
              )
            ) : (
              <div className="media-empty">
                <Icon name="film" size={26} />
                <strong>
                  {mediaError
                    ? sampleMode === 'basic'
                      ? '基础样例不可用'
                      : '视频加载失败'
                    : '暂无可用样例'}
                </strong>
                <span>
                  {mediaError
                    ? offlineMode
                      ? '资源未随文件一起拷贝：离线模式需把 index.html 与 thumbs/、_samples/ 按原目录结构一并拷贝。'
                      : sampleMode === 'basic'
                        ? '该仓库的 sample_basic.mp4 尚未生成，可继续查看能力演示。'
                        : '请确认 _samples 目录与样例文件存在。'
                    : repo.sample.status === 'failed'
                      ? '该仓库在实机上渲染失败，详见上方实测备注。'
                      : '该仓库被判定为不可出片，未生成样例。'}
                </span>
              </div>
            )}
            {activeCallout ? (
              <div className="media-callout" aria-live="polite">
                <strong>{activeCallout.value.titleZh}</strong>
                <span>{activeCallout.value.descZh}</span>
              </div>
            ) : null}
          </div>
          {repo.sample.noteZh ? <p className="media-note">{repo.sample.noteZh}</p> : null}

          {features ? (
            <div className="features-block">
              <div className="features-head">
                <span className="label">能力分段</span>
                <span className="muted mono">{featureSummary(features)}</span>
              </div>
              <div className="feature-track" aria-hidden="true">
                {features.segments.map((segment, index) => {
                  const width = Math.max(
                    2,
                    ((segment.end - segment.start) / timelineDuration) * 100,
                  );
                  return (
                    <span
                      key={`${segment.start}-${segment.end}`}
                      className={`feature-track-segment${activeSegment?.index === index ? ' is-active' : ''}`}
                      style={{ width: `${width}%` }}
                    />
                  );
                })}
              </div>
              <ol className="feature-segments">
                {features.segments.map((segment, index) => (
                  <li
                    className={`feature-segment${activeSegment?.index === index ? ' is-active' : ''}`}
                    key={`${segment.start}-${segment.end}`}
                  >
                    <button
                      type="button"
                      className="feature-segment-button"
                      onClick={() => seek(segment.start)}
                    >
                      <span className="feature-time mono">{formatTimeRange(segment)}</span>
                      <span className="feature-main">
                        <strong>{segment.capabilityZh}</strong>
                        <span>{segment.proofZh}</span>
                      </span>
                      <Icon name="play" size={14} />
                    </button>
                  </li>
                ))}
              </ol>
              <div className="callout-list">
                {features.callouts.map((callout, index) => (
                  <button
                    type="button"
                    className={`callout-chip${activeCallout?.index === index ? ' is-active' : ''}`}
                    key={`${index}-${callout.t}-${callout.titleZh}`}
                    onClick={() => seek(callout.t)}
                    title={callout.descZh}
                  >
                    <span className="mono">{formatTimecode(callout.t)}</span>
                    {callout.titleZh}
                  </button>
                ))}
              </div>
              {features.knownLimitsZh && features.knownLimitsZh.length > 0 ? (
                <ul className="feature-limits">
                  {features.knownLimitsZh.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="features-empty" role="status">
              <Icon name="alert" size={15} />
              <span>
                该仓库的能力分段档案（features.json）尚未生成，下方仅展示样例视频与实测规格。
              </span>
            </div>
          )}

          {detail.showcase.featureCallouts.length > 0 ? (
            <div className="showcase-callouts">
              <span className="label">演示设计</span>
              <div className="showcase-callout-list">
                {detail.showcase.featureCallouts.map((item, index) => (
                  <div className="showcase-callout" key={`${index}-${item.titleZh}`}>
                    <strong>{item.titleZh}</strong>
                    <span>{item.descZh}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="sample-specs">
            {spec ? (
              <div className="spec-grid">
                <SpecRow label="分辨率" value={formatResolution(spec.width, spec.height)} />
                <SpecRow label="帧率" value={`${spec.fps} fps`} />
                <SpecRow
                  label="时长"
                  value={effectiveDuration !== null ? formatSeconds(effectiveDuration) : '—'}
                />
                <SpecRow
                  label={isBasicMode ? '帧数' : '帧数（推算）'}
                  value={effectiveFrames !== null ? `${effectiveFrames} 帧` : '—'}
                />
                <SpecRow label="体积" value={formatBytes(effectiveBytes)} />
                <SpecRow label="编码" value={spec.codec} />
                <SpecRow label="基础管线" value={repo.sample.pipeline ?? '—'} />
                <SpecRow label="能力分段管线" value={features?.pipeline ?? '未生成'} />
                <SpecRow label="基础渲染耗时" value={formatMs(repo.renderPerf?.totalMs)} />
                <SpecRow label="能力演示耗时" value={formatMs(features?.renderMs)} />
              </div>
            ) : (
              <p className="muted">无样例规格数据。</p>
            )}
          </div>
        </div>
      </section>

      <section className="detail-section" aria-labelledby="detail-evidence">
        <SectionHead
          step="08"
          id="detail-evidence"
          title="实测证据"
          hint={evidenceSummary(detail)}
        />
        {detail.evidence.length > 0 ? (
          <details className="evidence-panel">
            <summary>
              展开 {detail.evidence.length} 条来源记录
              <Icon name="chevron" size={14} />
            </summary>
            <div className="evidence-list">
              {detail.evidence.map((item, index) => (
                <div className="evidence-row" key={`${index}-${item.field}-${item.source}`}>
                  <span className="evidence-field mono">{item.field}</span>
                  <span className="evidence-source mono">{item.source}</span>
                  <span className="evidence-note">{item.noteZh}</span>
                </div>
              ))}
            </div>
          </details>
        ) : (
          <p className="muted section-placeholder">{evidenceSummary(detail)}</p>
        )}
      </section>

      <footer className="detail-foot">
        <span className="muted">
          档案来源：<code>..\data\details\{repo.id}.json</code> · 只读消费
        </span>
        <button type="button" className="ghost-button" onClick={onGoMatrix}>
          回到对比矩阵
          <Icon name="arrow-right" size={15} />
        </button>
      </footer>
    </article>
  );
}

/** 详情入口：导航点「详情」但尚未选项目时的兜底，避免空白页。 */
export function RepoDetailLanding({
  repos,
  detailCount,
  onOpenRepo,
  onGoMatrix,
}: {
  repos: Repo[];
  detailCount: number;
  onOpenRepo: (id: string) => void;
  onGoMatrix: () => void;
}) {
  const top = useMemo(
    () =>
      [...repos]
        .sort((a, b) => computeOverallScore(b.scores) - computeOverallScore(a.scores))
        .slice(0, 6),
    [repos],
  );

  return (
    <article className="view detail-view detail-landing">
      <span className="eyebrow">深度档案</span>
      <h1 id="view-title" tabIndex={-1}>
        详情页
      </h1>
      <p className="detail-tagline">
        从对比矩阵、时间线或任意对比项打开一个项目，即可查看完整档案。当前可用档案{' '}
        <strong className="mono accent-text">{detailCount}</strong> / {repos.length} 份。
      </p>
      <div className="detail-actions">
        <button type="button" className="primary-button" onClick={onGoMatrix}>
          去对比矩阵选择
          <Icon name="arrow-right" size={15} />
        </button>
      </div>
      <section className="detail-section" aria-labelledby="detail-landing-top">
        <SectionHead
          step="TOP"
          id="detail-landing-top"
          title="综合分最高的项目"
          hint="点击任意卡片直接进入详情页。"
        />
        <div className="landing-grid">
          {top.map((repo) => (
            <button
              type="button"
              className="landing-card"
              key={repo.id}
              onClick={() => onOpenRepo(repo.id)}
            >
              <RepoThumb repo={repo} size="md" />
              <span className="landing-card-main">
                <span className="recent-name">
                  <span className="repo-owner">{repo.owner}/</span>
                  {repo.repo}
                </span>
                <span className="recent-meta">{repo.descriptionZh}</span>
              </span>
              <span className="score-pill is-high mono">
                {computeOverallScore(repo.scores).toFixed(1)}
              </span>
              <Icon name="arrow-right" size={15} />
            </button>
          ))}
        </div>
      </section>
    </article>
  );
}
