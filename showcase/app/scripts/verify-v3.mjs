#!/usr/bin/env node
// 定版终验 v3：65 矩阵 / 51 可播 / 5 个重渲样片逐个播放 / 能力演示↔基础样例切换 / features 时间轴 / 默认 Chrome file://
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const appRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const shotDir = path.join(appRoot, 'docs', 'screenshots');
const previewBase = 'http://127.0.0.1:4173';
const distFile = path.join(appRoot, 'dist', 'index.html');
const viteBin = path.join(appRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const startedAt = Date.now();

const mark = (label) => console.log(`[定版] ${label}（累计 ${Date.now() - startedAt} ms）`);
const assert = (ok, msg) => {
  if (!ok) throw new Error(`断言失败：${msg}`);
};

const repos = JSON.parse(fs.readFileSync(path.join(appRoot, '..', 'data', 'repos.json'), 'utf8')).repos;
const okRepos = repos.filter((r) => r.sample.status === 'ok');
const upgraded = ['heygen-com__hyperframes', 'feitangyuan__onetake', 'lemomo-ai__lemo-opuscar', 'alchaincyf__huashu-motion', 'lovisdotio__motion2code'];
const playTargets = upgraded.slice(0, 5);

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // 等待
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`预览服务器超时：${url}`);
}

function attach(page) {
  const logs = { consoleErrors: [], pageErrors: [] };
  page.on('console', (m) => m.type() === 'error' && logs.consoleErrors.push(m.text()));
  page.on('pageerror', (e) => logs.pageErrors.push(e.message));
  return logs;
}

async function openDetail(page, id) {
  await page.goto(`${previewBase}/#/repo/${id}`, { waitUntil: 'networkidle' });
  await page.locator('.detail-view').waitFor({ state: 'visible' });
  await page.locator('.detail-media video').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(150);
}

async function measureVideo(page) {
  return page.locator('.detail-media video').first().evaluate(async (el) => {
    const before = el.currentTime;
    el.muted = true;
    let playError = null;
    try {
      await el.play();
    } catch (error) {
      playError = String(error);
    }
    await new Promise((r) => setTimeout(r, 1600));
    return {
      src: el.currentSrc,
      before,
      after: el.currentTime,
      advanced: el.currentTime - before,
      readyState: el.readyState,
      paused: el.paused,
      errorCode: el.error ? el.error.code : null,
      playError,
    };
  });
}

async function main() {
  assert(fs.existsSync(distFile), '请先 npm run build');
  fs.mkdirSync(shotDir, { recursive: true });
  assert(repos.length === 65, `仓库总数 ${repos.length} != 65`);
  assert(okRepos.length === 51, `ok 仓库 ${okRepos.length} != 51`);
  assert(new Set(okRepos.map((r) => r.id)).size === 51, 'ok 仓库 id 重复');
  mark(`数据：65 条，ok ${okRepos.length} 条，待播 ${playTargets.length} 条`);

  const serverLogs = [];
  const server = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: appRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (c) => serverLogs.push(String(c)));
  server.stderr.on('data', (c) => serverLogs.push(String(c)));

  let browser;
  try {
    await waitForServer(previewBase);
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
    mark('默认 Chrome 启动');

    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const logs = attach(page);

    // 1. 矩阵 65 行
    await page.goto(`${previewBase}/#/?view=matrix`, { waitUntil: 'networkidle' });
    await page.locator('table.repo-table tbody tr').first().waitFor({ state: 'visible' });
    assert((await page.locator('table.repo-table tbody tr').count()) === 65, '矩阵不是 65 行');
    await page.screenshot({ path: path.join(shotDir, 'final-v3-matrix.png'), animations: 'disabled' });
    mark('矩阵 65 行 + final-v3-matrix.png');

    // 2. 五个重渲样片逐个播放 > 0.5s，并检查 features 时间轴
    const played = [];
    for (const id of playTargets) {
      assert(okRepos.some((r) => r.id === id), `${id} 非 ok`);
      await openDetail(page, id);
      const media = await measureVideo(page);
      assert(media.playError === null && media.errorCode === null, `${id} 播放报错 ${media.playError || media.errorCode}`);
      assert(media.advanced > 0.5, `${id} 只推进 ${media.advanced.toFixed(2)}s`);
      const segments = await page.locator('.feature-segment').count();
      const callouts = await page.locator('.callout-chip').count();
      assert(segments === 3, `${id} 能力分段 ${segments} != 3`);
      assert(callouts >= 6, `${id} callout ${callouts} < 6`);
      const totalDur = await page.evaluate(() => {
        const el = document.querySelector('.detail-media video');
        return el ? el.duration : 0;
      });
      assert(totalDur >= 19, `${id} 新片时长 ${totalDur.toFixed(1)}s < 19s`);
      played.push({ id, advanced: Number(media.advanced.toFixed(2)), duration: Number(totalDur.toFixed(2)), segments, callouts });
      mark(`${id} 播放推进 ${media.advanced.toFixed(2)}s / 总长 ${totalDur.toFixed(1)}s / ${segments} 段 / ${callouts} callout`);
    }

    // 3. 详情页样例区截图 + 切换基础样例
    await openDetail(page, 'heygen-com__hyperframes');
    await page.locator('.features-block').scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(shotDir, 'final-v3-detail-features.png'), animations: 'disabled' });
    const featureBtn = page.locator('.segment-button', { hasText: '能力演示' });
    const basicBtn = page.locator('.segment-button', { hasText: '基础样例' });
    assert(await featureBtn.isVisible(), '能力演示按钮不可见');
    assert(await basicBtn.isVisible(), '基础样例按钮不可见');
    assert((await featureBtn.getAttribute('aria-pressed')) === 'true', '默认未选中能力演示');
    await basicBtn.click();
    await page.waitForTimeout(300);
    const basicMedia = await measureVideo(page);
    assert(/sample_basic\.mp4/.test(basicMedia.src), `基础样例 src 不对：${basicMedia.src}`);
    assert(basicMedia.advanced > 0.3, `基础样例只推进 ${basicMedia.advanced.toFixed(2)}s`);
    assert((await basicBtn.getAttribute('aria-pressed')) === 'true', '基础样例未激活');
    await page.locator('.sample-panel').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(shotDir, 'final-v3-sample-switch.png'), animations: 'disabled' });
    mark(`基础样例切换正常：${basicMedia.advanced.toFixed(2)}s，src=sample_basic.mp4`);

    assert(logs.pageErrors.length === 0, `HTTP pageError：${logs.pageErrors.join(' | ')}`);
    assert(logs.consoleErrors.length === 0, `HTTP console error：${logs.consoleErrors.join(' | ')}`);
    mark('HTTP 控制台 0 error');
    await context.close();

    // 4. 默认 Chrome + file://
    const fileContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    const filePage = await fileContext.newPage();
    const fileLogs = attach(filePage);
    const fileUrl = `${pathToFileURL(distFile).href}#/repo/heygen-com__hyperframes`;
    await filePage.goto(fileUrl, { waitUntil: 'load' });
    await filePage.locator('.detail-view').waitFor({ state: 'visible', timeout: 20000 });
    await filePage.locator('.detail-media video').first().waitFor({ state: 'visible', timeout: 10000 });
    const fileMedia = await measureVideo(filePage);
    await fileContext.close();
    console.log(`[定版] file:// 实测：${JSON.stringify(fileMedia)}`);
    assert(fileMedia.playError === null && fileMedia.errorCode === null, `file:// 播放报错 ${fileMedia.playError || fileMedia.errorCode}`);
    assert(fileMedia.advanced > 0.5, `file:// 只推进 ${fileMedia.advanced.toFixed(2)}s`);
    assert(fileLogs.consoleErrors.length === 0 && fileLogs.pageErrors.length === 0, 'file:// 控制台有 error');

    console.log('\n[定版] 汇总');
    console.log(JSON.stringify({ matrixRows: 65, okRepos: 51, played, basicSwitch: { advanced: Number(basicMedia.advanced.toFixed(2)), src: basicMedia.src }, fileMode: { advanced: Number(fileMedia.advanced.toFixed(2)), readyState: fileMedia.readyState, src: fileMedia.src }, consoleErrors: { http: logs.consoleErrors.length, file: fileLogs.consoleErrors.length } }, null, 2));
    console.log(`[定版] 总耗时 ${Date.now() - startedAt} ms`);
  } finally {
    if (browser) await browser.close();
    server.kill();
    if (serverLogs.length) console.log(`[定版] 预览日志：${serverLogs.join('').trim().split('\n').slice(-2).join(' | ')}`);
  }
}

main().catch((error) => {
  console.error(`\n[定版] 失败：${error.message}`);
  process.exit(1);
});
