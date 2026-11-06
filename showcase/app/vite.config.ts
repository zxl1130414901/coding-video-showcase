import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Dataset, Repo, RepoDetail, SampleFeatures } from './src/types/repo';
import { emptyDiscovery, type DiscoveryDoc } from './src/types/discovery';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = path.resolve(ROOT, 'public');
const THUMB_DIR = path.resolve(PUBLIC_DIR, 'thumbs');
const DIST_DIR = path.resolve(ROOT, 'dist');
const SAMPLE_ROOT = path.resolve('F:\\coding视频\\_samples');
const SAMPLE_LINK = path.join(PUBLIC_DIR, 'samples');

/** 优先通过 public/samples junction 提供，未建立时回退到真实目录。 */
function activeSampleRoot(): string {
  return fs.existsSync(SAMPLE_LINK) ? SAMPLE_LINK : SAMPLE_ROOT;
}

const VIRTUAL_ID = 'virtual:repos';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const MIN_REPOS = 65;

function formatError(message: string): Error {
  return new Error(`\n[数据接入失败] ${message}\n`);
}

function readJson(file: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.warn(
      `[showcase-data] 跳过无法解析的文件：${file}（${error instanceof Error ? error.message : String(error)}）`,
    );
    return null;
  }
}

function isRepoDetail(value: unknown): value is RepoDetail {
  if (!value || typeof value !== 'object') return false;
  const detail = value as Partial<RepoDetail>;
  return (
    typeof detail.taglineZh === 'string' &&
    typeof detail.summaryZh === 'string' &&
    Array.isArray(detail.whatItMakes) &&
    Array.isArray(detail.useCases) &&
    typeof detail.capabilities === 'object' &&
    detail.capabilities !== null
  );
}

function isSampleFeatures(value: unknown): value is SampleFeatures {
  if (!value || typeof value !== 'object') return false;
  const features = value as Partial<SampleFeatures>;
  return (
    typeof features.durationSec === 'number' &&
    Array.isArray(features.segments) &&
    Array.isArray(features.callouts)
  );
}

function collectSampleSizes(
  repos: Repo[],
): Record<string, { mainBytes?: number; basicBytes?: number }> {
  const sizes: Record<string, { mainBytes?: number; basicBytes?: number }> = {};
  const statSize = (file: string): number | undefined => {
    try {
      return fs.statSync(file).size;
    } catch {
      return undefined;
    }
  };
  for (const repo of repos) {
    const dir = path.join(SAMPLE_ROOT, repo.id);
    const mainBytes = statSize(path.join(dir, 'sample.mp4'));
    const basicBytes = statSize(path.join(dir, 'sample_basic.mp4'));
    if (mainBytes || basicBytes) sizes[repo.id] = { mainBytes, basicBytes };
  }
  return sizes;
}

/** 只读扫描 data/details 与 _samples/<id>/features.json；缺失一律优雅跳过。 */
function collectArchive(
  repos: Repo[],
  detailsDir: string,
): {
  details: Record<string, RepoDetail>;
  features: Record<string, SampleFeatures>;
  missingDetailIds: string[];
} {
  const details: Record<string, RepoDetail> = {};
  const features: Record<string, SampleFeatures> = {};
  const missingDetailIds: string[] = [];

  if (fs.existsSync(detailsDir)) {
    for (const entry of fs.readdirSync(detailsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
      const file = path.join(detailsDir, entry.name);
      const parsed = readJson(file);
      if (!isRepoDetail(parsed)) {
        console.warn(`[showcase-data] 档案字段不完整，已忽略：${file}`);
        continue;
      }
      const key = parsed.id || entry.name.replace(/\.json$/, '');
      details[key] = parsed;
    }
  }

  for (const repo of repos) {
    if (!details[repo.id]) missingDetailIds.push(repo.id);
    const featureFile = path.join(SAMPLE_ROOT, repo.id, 'features.json');
    if (!fs.existsSync(featureFile)) continue;
    const parsed = readJson(featureFile);
    if (!isSampleFeatures(parsed)) {
      console.warn(`[showcase-data] features.json 字段不完整，已忽略：${featureFile}`);
      continue;
    }
    features[repo.id] = parsed;
  }

  return { details, features, missingDetailIds };
}

function dataPlugin(): Plugin {
  let isBuild = false;
  let root = ROOT;

  return {
    name: 'showcase-data',
    configResolved(config) {
      isBuild = config.command === 'build';
      root = config.root;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const realFile = path.resolve(root, '../data/repos.json');
      const sampleFile = path.resolve(root, '../data/repos.sample.json');
      const allowSample = process.env.SHOWCASE_ALLOW_SAMPLE === '1';
      let file = realFile;
      let isSample = false;

      if (!fs.existsSync(realFile)) {
        if (isBuild && !allowSample) {
          throw formatError(
            `未找到真实数据文件：${realFile}\n请先由数据流程生成 repos.json；如需用占位数据预览，运行 npm run build:sample。`,
          );
        }
        if (!fs.existsSync(sampleFile)) {
          throw formatError(`真实数据缺失，且开发占位数据也不存在：${sampleFile}`);
        }
        file = sampleFile;
        isSample = true;
      }

      let parsed: Dataset;
      try {
        parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Dataset;
      } catch (error) {
        throw formatError(
          `无法解析 ${file}：${error instanceof Error ? error.message : String(error)}`,
        );
      }
      if (!parsed || !Array.isArray(parsed.repos)) {
        throw formatError(`数据文件 ${file} 缺少 repos 数组。`);
      }
      if (!isSample && parsed.repos.length < MIN_REPOS) {
        throw formatError(
          `真实数据仅 ${parsed.repos.length} 条，低于验收下限 ${MIN_REPOS} 条：${file}`,
        );
      }
      const detailsDir = path.resolve(root, '../data/details');
      const archive = collectArchive(parsed.repos, detailsDir);
      const sampleSizes = collectSampleSizes(parsed.repos);
      const discoveryFile = path.resolve(root, '../data/discovery.json');
      let discovery: DiscoveryDoc = emptyDiscovery();
      if (fs.existsSync(discoveryFile)) {
        const parsedDiscovery = readJson(discoveryFile);
        if (!parsedDiscovery || typeof parsedDiscovery !== 'object') {
          throw formatError(`无法解析选型数据：${discoveryFile}`);
        }
        discovery = { ...emptyDiscovery(), ...(parsedDiscovery as Partial<DiscoveryDoc>) };
      } else if (isBuild && !allowSample) {
        throw formatError(`未找到选型数据文件：${discoveryFile}\n请先生成 discovery.json。`);
      } else {
        console.warn(`[showcase-data] 选型数据缺失，首页将显示空态：${discoveryFile}`);
      }
      console.warn(
        `[showcase-data] ${isSample ? '占位数据' : '真实数据'}：${file} · ${parsed.repos.length} 个项目 · 档案 ${Object.keys(archive.details).length} 份 · 能力分段 ${Object.keys(archive.features).length} 份`,
      );
      return `export const reposPayload = ${JSON.stringify(parsed)};
export const detailsPayload = ${JSON.stringify(archive.details)};
export const featuresPayload = ${JSON.stringify(archive.features)};
export const sampleSizesPayload = ${JSON.stringify(sampleSizes)};
export const discoveryPayload = ${JSON.stringify(discovery)};
export const dataSource = ${JSON.stringify({
        file: file.replace(/\\/g, '/'),
        detailsDir: detailsDir.replace(/\\/g, '/'),
        isSample,
        loadedAt: new Date().toISOString(),
        detailCount: Object.keys(archive.details).length,
        missingDetailIds: archive.missingDetailIds,
        featureCount: Object.keys(archive.features).length,
      })};`;
    },
  };
}

function copyDir(source: string, target: string): void {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.css': 'text/css',
  '.html': 'text/html',
};

function safeJoin(base: string, relative: string): string | null {
  const decoded = decodeURIComponent(relative.split('?')[0] ?? '');
  const resolved = path.resolve(base, `.${decoded.replace(/\\/g, '/')}`);
  const prefix = `${base}${path.sep}`;
  return resolved.startsWith(prefix) ? resolved : null;
}

function serveFile(req: IncomingMessage, res: ServerResponse, filePath: string): void {
  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }
  if (!stat.isFile()) {
    res.statusCode = 404;
    res.end('Not Found');
    return;
  }

  const mime = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range;
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Number(match[2]) : stat.size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start >= stat.size) {
      res.statusCode = 416;
      res.setHeader('Content-Range', `bytes */${stat.size}`);
      res.end();
      return;
    }
    const safeEnd = Math.min(end, stat.size - 1);
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${safeEnd}/${stat.size}`);
    res.setHeader('Content-Length', String(safeEnd - start + 1));
    fs.createReadStream(filePath, { start, end: safeEnd }).pipe(res);
    return;
  }

  res.setHeader('Content-Length', String(stat.size));
  fs.createReadStream(filePath).pipe(res);
}

function publicAssetsPlugin(): Plugin {
  return {
    name: 'showcase-public-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (url.startsWith('/samples/')) {
          const file = safeJoin(activeSampleRoot(), url.slice('/samples'.length));
          if (!file) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }
          serveFile(req, res, file);
          return;
        }
        if (url.startsWith('/thumbs/')) {
          const file = safeJoin(THUMB_DIR, url.slice('/thumbs'.length));
          if (!file) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
          }
          serveFile(req, res, file);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/samples/')) {
          next();
          return;
        }
        const file = safeJoin(activeSampleRoot(), url.slice('/samples'.length));
        if (!file) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }
        serveFile(req, res, file);
      });
    },
    closeBundle() {
      if (fs.existsSync(THUMB_DIR)) {
        copyDir(THUMB_DIR, path.join(DIST_DIR, 'thumbs'));
      }
    },
  };
}

function runtimeConfigPlugin(): Plugin {
  const relativeSampleBase = `${path.relative(DIST_DIR, SAMPLE_ROOT).replace(/\\/g, '/')}/`;
  const inlineScript = [
    `window.__SAMPLE_BASE__=${JSON.stringify(relativeSampleBase)};`,
    `window.__SAMPLE_BASE_HTTP__="/samples/";`,
    `window.__THUMB_BASE__="./thumbs/";`,
  ].join('');
  return {
    name: 'showcase-runtime-config',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'script',
            children: inlineScript,
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

function offlineClassicPlugin(): Plugin {
  return {
    name: 'showcase-offline-classic',
    closeBundle: {
      order: 'post',
      handler() {
        const file = path.join(DIST_DIR, 'index.html');
        if (!fs.existsSync(file)) return;
        const html = fs.readFileSync(file, 'utf8');
        const startTag = '<script type="module" crossorigin>';
        const start = html.indexOf(startTag);
        if (start < 0) {
          if (/<script[^>]*type="module"/.test(html)) {
            throw formatError('离线构建失败：存在未识别的 module 脚本标记。');
          }
          return;
        }
        const close = html.indexOf('</script>', start);
        if (close < 0) throw formatError('离线构建失败：module 脚本未闭合。');
        const code = html.slice(start + startTag.length, close).replace(/import\.meta\.url/g, '""');
        if (/\bimport\.meta\b/.test(code)) {
          throw formatError('离线构建失败：脚本仍含 import.meta，无法转为经典脚本。');
        }
        const classic = `<script>(function(){"use strict";\n${code}\n})();</script>`;
        const stripped = html.slice(0, start) + html.slice(close + '</script>'.length);
        const withoutCrossOrigin = stripped.replace(
          /<(script|link|style)[^>]*crossorigin[^>]*>/g,
          (tag) => tag.replace(/ crossorigin(="[^"]*")?/, ''),
        );
        const out = withoutCrossOrigin.replace('</body>', () => `${classic}\n  </body>`);
        if (
          /<script[^>]*type="module"/.test(out) ||
          /<(?:script|link|style)[^>]*crossorigin/.test(out)
        ) {
          throw formatError('离线构建失败：产物仍残留 module 或 crossorigin。');
        }
        fs.writeFileSync(file, out);
      },
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    react(),
    dataPlugin(),
    publicAssetsPlugin(),
    runtimeConfigPlugin(),
    viteSingleFile(),
    offlineClassicPlugin(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 1024 * 1024,
    cssCodeSplit: false,
    reportCompressedSize: false,
    target: 'es2020',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
