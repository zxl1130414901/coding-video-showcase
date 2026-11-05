import type { Repo, Scores } from '../types/repo';

interface RepoOverrides extends Partial<Omit<Repo, 'scores' | 'sample' | 'renderPerf'>> {
  scores?: Partial<Scores>;
  sample?: Partial<Repo['sample']>;
  renderPerf?: Repo['renderPerf'];
}

export function makeRepo(overrides: RepoOverrides = {}): Repo {
  const id = overrides.id ?? 'owner/demo';
  const repo = overrides.repo ?? id.split('/')[1] ?? 'demo';
  return {
    id,
    owner: overrides.owner ?? id.split('/')[0] ?? 'owner',
    repo,
    url: overrides.url ?? `https://github.com/${id}`,
    homepage: overrides.homepage ?? null,
    stars: overrides.stars ?? 100,
    forks: overrides.forks ?? 10,
    openIssues: overrides.openIssues ?? 5,
    license: overrides.license === undefined ? 'MIT' : overrides.license,
    language: overrides.language === undefined ? 'TypeScript' : overrides.language,
    createdAt: overrides.createdAt ?? '2024-01-01T00:00:00Z',
    updatedAt: overrides.updatedAt ?? '2026-10-01T00:00:00Z',
    pushedAt: overrides.pushedAt ?? '2026-10-01T00:00:00Z',
    descriptionZh: overrides.descriptionZh ?? '用代码生成视频的演示项目。',
    category: overrides.category ?? '代码驱动/声明式框架',
    techStack: overrides.techStack ?? ['TypeScript'],
    renderBackends: overrides.renderBackends ?? ['Chromium'],
    outputFormats: overrides.outputFormats ?? ['MP4'],
    gpuAcceleration: overrides.gpuAcceleration ?? false,
    cliHeadless: overrides.cliHeadless ?? true,
    windowsSupport: overrides.windowsSupport ?? true,
    installComplexity: overrides.installComplexity ?? 2,
    renderPerf:
      overrides.renderPerf === undefined
        ? {
            totalMs: 12_000,
            frames: 120,
            width: 1280,
            height: 720,
            fps: 30,
          }
        : overrides.renderPerf,
    sample: {
      status: overrides.sample?.status ?? 'ok',
      videoPath: overrides.sample?.videoPath ?? '_samples/owner__demo/sample.mp4',
      thumbPath: overrides.sample?.thumbPath ?? '_samples/owner__demo/preview.png',
      pipeline: overrides.sample?.pipeline ?? 'Chromium 逐帧',
      spec:
        overrides.sample?.spec === undefined
          ? {
              width: 1280,
              height: 720,
              fps: 30,
              durationSec: 4,
              frames: 120,
              bytes: 5_000_000,
              codec: 'h264',
            }
          : overrides.sample.spec,
      noteZh: overrides.sample?.noteZh ?? '实机录制。',
    },
    scores: {
      maturity: overrides.scores?.maturity ?? 4,
      usability: overrides.scores?.usability ?? 4,
      performance: overrides.scores?.performance ?? 4,
      docs: overrides.scores?.docs ?? 4,
      windows: overrides.scores?.windows ?? 4,
      activity: overrides.scores?.activity ?? 4,
    },
    pros: overrides.pros ?? ['上手快'],
    cons: overrides.cons ?? ['依赖较多'],
    bestFor: overrides.bestFor ?? '产品演示视频',
    pitfalls: overrides.pitfalls ?? ['首次安装较慢'],
    alternatives: overrides.alternatives ?? [],
    tags: overrides.tags ?? ['视频', '代码'],
    localPath: overrides.localPath,
  };
}
