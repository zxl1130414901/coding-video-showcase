/** 样例资源地址解析，保证 dev / preview / 单文件离线三种场景都能播放。 */

export function isFileProtocol(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'file:';
}

function joinBase(base: string, path: string): string {
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${cleanBase}${cleanPath}`;
}

/** 从 videoPath（相对 F:\coding视频，形如 _samples/x/sample.mp4）解析可用 URL。 */
export function resolveSampleUrl(videoPath: string | null | undefined): string | null {
  if (!videoPath) return null;
  const normalized = videoPath.replace(/\\/g, '/');
  const relative = normalized.startsWith('_samples/')
    ? normalized.slice('_samples/'.length)
    : normalized.replace(/^samples\//, '');
  if (isFileProtocol()) {
    const base = window.__SAMPLE_BASE__ ?? '../../../_samples/';
    return joinBase(base, relative);
  }
  const httpBase = window.__SAMPLE_BASE_HTTP__ ?? '/samples/';
  return joinBase(httpBase, relative);
}

export function isGifSample(videoPath: string | null | undefined): boolean {
  return Boolean(videoPath && /\.gif(?:$|\?)/i.test(videoPath));
}

/** 与构建脚本保持一致的缩略图文件名。 */
export function thumbFileName(id: string): string {
  return `${id.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'repo'}.png`;
}

export function resolveThumbUrl(id: string): string {
  const base = typeof window !== 'undefined' ? (window.__THUMB_BASE__ ?? './thumbs/') : './thumbs/';
  return joinBase(base, thumbFileName(id));
}

/** GitHub 仓库名到本机目录（数据目录按 owner__repo 命名）。 */
export function localRepoPath(owner: string, repo: string, localPath?: string): string {
  if (localPath) return localPath;
  return `F:\\coding视频\\${owner}__${repo}`;
}

export function fileUrlFromWindowsPath(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  return `file:///${encodeURI(normalized)}`;
}
