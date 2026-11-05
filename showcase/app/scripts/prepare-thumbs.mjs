#!/usr/bin/env node
/**
 * 构建前处理：对每个可出片仓库，从当前 sample.mp4（或 gif）抽取 40%/50%/60% 三帧，取细节最多的一张到 public/thumbs。
 * 失败时回退为复制数据里的 thumbPath。默认必须存在真实 repos.json；--allow-sample 时允许占位数据。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const dataDir = path.resolve(appRoot, '../data');
const publicThumbDir = path.join(appRoot, 'public', 'thumbs');
const sampleRoot = process.env.SHOWCASE_SAMPLE_ROOT || 'F:\\coding视频';
const allowSample = process.argv.includes('--allow-sample');
const dataOverride = process.env.SHOWCASE_DATA_FILE;

function fail(message) {
  console.error(`\n[缩略图准备失败] ${message}\n`);
  process.exit(1);
}

function sanitizeId(id) {
  return `${id.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'repo'}.png`;
}

const realFile = dataOverride ? path.resolve(dataOverride) : path.resolve(dataDir, 'repos.json');
let dataFile = realFile;
if (!fs.existsSync(realFile)) {
  if (!allowSample) {
    fail(
      `未找到真实数据文件：${realFile}。请先接入数据，或使用 npm run build:sample 预览占位数据。`,
    );
  }
  dataFile = path.resolve(dataDir, 'repos.sample.json');
  console.warn(`[缩略图] 真实数据缺失，改用占位数据：${dataFile}`);
}

if (!fs.existsSync(dataFile)) fail(`数据文件不存在：${dataFile}`);

let payload;
try {
  payload = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
} catch (error) {
  fail(`无法解析数据文件 ${dataFile}：${error.message}`);
}
if (!payload || !Array.isArray(payload.repos)) fail(`数据文件 ${dataFile} 缺少 repos 数组`);

fs.rmSync(publicThumbDir, { recursive: true, force: true });
fs.mkdirSync(publicThumbDir, { recursive: true });

let generated = 0;
let copied = 0;
let missing = 0;
const failures = [];

for (const repo of payload.repos) {
  const target = path.join(publicThumbDir, sanitizeId(repo.id));
  const video = repo?.sample?.videoPath ? path.resolve(sampleRoot, repo.sample.videoPath) : null;
  const thumbPath = repo?.sample?.thumbPath ? path.resolve(sampleRoot, repo.sample.thumbPath) : null;

  if (repo.sample?.status === 'ok' && video && fs.existsSync(video)) {
    const duration = Number(repo.sample.spec?.durationSec || 8);
    const candidates = [0.4, 0.5, 0.6].map((f) => Math.max(0.5, duration * f));
    const tempFiles = [];
    try {
      for (const [index, at] of candidates.entries()) {
        const temp = path.join(publicThumbDir, `.${sanitizeId(repo.id)}.${index}.png`);
        execFileSync(
          'ffmpeg',
          ['-y', '-loglevel', 'error', '-ss', String(at), '-i', video, '-frames:v', '1', '-vf', 'scale=640:-2', temp],
          { stdio: 'pipe' },
        );
        if (fs.existsSync(temp) && fs.statSync(temp).size > 0) tempFiles.push(temp);
      }
      if (!tempFiles.length) throw new Error('未产出帧');
      // 多取 40%/50%/60%，选文件最大（细节最多）的一帧，避开黑场/纯色中间帧。
      const best = tempFiles.reduce((a, b) => (fs.statSync(a).size >= fs.statSync(b).size ? a : b));
      fs.copyFileSync(best, target);
      generated += 1;
      continue;
    } catch (error) {
      failures.push(`${repo.id}: ${String(error.message || error).split('\n')[0]}`);
    } finally {
      for (const temp of tempFiles) fs.rmSync(temp, { force: true });
    }
  }

  if (thumbPath && fs.existsSync(thumbPath)) {
    fs.copyFileSync(thumbPath, target);
    copied += 1;
    continue;
  }
  missing += 1;
  if (repo.sample?.status === 'ok') console.warn(`[缩略图] 缺失：${repo.id}`);
}

console.log(
  `[缩略图] ${path.basename(dataFile)}：新抽帧 ${generated} 张，回退复制 ${copied} 张，缺失 ${missing} 张 → ${publicThumbDir}`,
);
if (failures.length) console.warn(`[缩略图] ffmpeg 回退 ${failures.length} 个：${failures.slice(0, 5).join(' | ')}`);
