#!/usr/bin/env node
// 终验冒烟：65 条矩阵、来源筛选、3 个新增详情、四档响应式、dist 与 repos 差集、默认 Chrome + file:// 播放
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

const mark = (label) => console.log(`[终验] ${label}（累计 ${Date.now() - startedAt} ms）`);
const assert = (ok, msg) => {
  if (!ok) throw new Error(`断言失败：${msg}`);
};

const repos = JSON.parse(fs.readFileSync(path.join(appRoot, '..', 'data', 'repos.json'), 'utf8')).repos;
const newIds = repos.filter((r) => String(r.source || '').includes('article:')).map((r) => r.id);
const newIdSet = new Set(newIds);

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
  try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // 继续等待
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`预览服务器超时：${url}`);
}

function attach(page) {
  const logs = { consoleErrors: [], pageErrors: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') logs.consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => logs.pageErrors.push(e.message));
  return logs;
}

async function openDetail(page, id) {
  await page.goto(`${previewBase}/#/repo/${id}`, { waitUntil: 'networkidle' });
  await page.locator('.detail-view').waitFor({ state: 'visible' });
  await page.waitForTimeout(200);
}

async function checkDetail(page, id) {
  await openDetail(page, id);
  const required = [
    'detail-what',
    'detail-usecases',
    'detail-capability',
    'detail-workflow',
    'detail-gap',
    'detail-compare',
    'detail-sample',
    'detail-evidence',
  ];
  const sections = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.detail-section')).map((s) => ({
      id: s.getAttribute('aria-labelledby'),
      text: (s.innerText || '').trim(),
    })),
  );
  for (const key of required) {
    const section = sections.find((s) => s.id === key);
    assert(section, `${id} 缺分区 ${key}`);
    assert(section.text.length > 40, `${id} 分区 ${key} 内容过短`);
  }
  const body = await page.locator('.detail-view').innerText();
  assert(!/undefined|NaN|\[object Object\]/.test(body), `${id} 出现 undefined/NaN`);
  return sections.length;
}

async function main() {
  assert(fs.existsSync(distFile), '请先 npm run build');
  fs.mkdirSync(shotDir, { recursive: true });
  mark(`读取数据：${repos.length} 条，新增 ${newIds.length} 条`);

  const serverLogs = [];
  const server = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
    { cwd: appRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  server.stdout.on('data', (c) => serverLogs.push(String(c)));
  server.stderr.on('data', (c) => serverLogs.push(String(c)));

  let browser;
  let launchMode = '';
  try {
    await waitForServer(previewBase);
    mark('预览服务器就绪');

    try {
      browser = await chromium.launch({
        channel: 'chrome',
        headless: true,
        args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
      });
      launchMode = 'installed Chrome (channel=chrome)';
    } catch (error) {
      browser = await chromium.launch({
        headless: true,
        args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
      });
      launchMode = `bundled Chromium（Chrome 启动失败：${error.message.slice(0, 80)}）`;
    }
    mark(`浏览器启动：${launchMode}`);

    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const logs = attach(page);

    // a. 矩阵 65 行
    await page.goto(`${previewBase}/#/?view=matrix`, { waitUntil: 'networkidle' });
    await page.locator('table.repo-table tbody tr').first().waitFor({ state: 'visible' });
    const rowCount = await page.locator('table.repo-table tbody tr').count();
    assert(rowCount === 65, `矩阵应为 65 行，实际 ${rowCount}`);
    await page.screenshot({ path: path.join(shotDir, 'final-matrix65.png'), animations: 'disabled' });
    mark('矩阵 65 行 + 截图 final-matrix65.png');

    // b. 按“新增”筛出 14 条
    const search = page.locator('input[type="search"]');
    await search.fill('新增');
    await page.waitForFunction(() => {
      const n = document.querySelectorAll('tbody tr').length;
      return n === 14;
    });
    const filtered = await page.locator('tbody tr').count();
    assert(filtered === 14, `关键词“新增”应筛出 14 行，实际 ${filtered}`);
    const rowIds = await page.locator('tbody tr').evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-id') || row.getAttribute('aria-label') || ''),
    );
    mark(`筛选“新增”= ${filtered} 行；示例 ${rowIds.slice(0, 3).join(' / ')}`);
    await page.screenshot({ path: path.join(shotDir, 'final-filter-source.png'), animations: 'disabled' });
    await search.fill('');
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 65);

    // c. 三个新增详情
    const detailResults = [];
    for (const id of ['heygen-com__hyperframes', 'browser-use__video-use', 'lovisdotio__motion2code']) {
      assert(newIdSet.has(id), `${id} 不在新增集合中`);
      const sectionCount = await checkDetail(page, id);
      detailResults.push({ id, sectionCount });
      mark(`详情 ${id}：${sectionCount} 个分区均有内容`);
    }
    await openDetail(page, 'heygen-com__hyperframes');
    await page.locator('section[aria-labelledby="detail-sample"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shotDir, 'final-detail-new.png'), animations: 'disabled' });
    mark('截图 final-detail-new.png（hyperframes 样例区）');

    // d. dist 内 id 集合与 repos.json 完全一致
    const html = fs.readFileSync(distFile, 'utf8');
    const embedded = new Set([...html.matchAll(/id:"([^"]+__[^"]+)",owner:/g)].map((m) => m[1]));
    const missing = repos.map((r) => r.id).filter((id) => !embedded.has(id));
    const extra = [...embedded].filter((id) => !repos.some((r) => r.id === id));
    assert(missing.length === 0 && extra.length === 0, `dist 差集 non-empty：缺 ${missing} 多 ${extra}`);
    mark(`dist 内 ${embedded.size} 条 id，与 repos.json 差集为空`);

    // e. 四档响应式 + 控制台
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [`${previewBase}/#/?view=matrix`, `${previewBase}/#/repo/heygen-com__hyperframes`]) {
        await page.goto(route, { waitUntil: 'networkidle' });
        const target = route.includes('/repo/') ? page.locator('.detail-view') : page.locator('.matrix-view');
        await target.waitFor({ state: 'visible' });
        const overflow = await page.evaluate(() => ({
          sw: document.documentElement.scrollWidth,
          bw: document.body.scrollWidth,
          iw: window.innerWidth,
        }));
        assert(overflow.sw <= overflow.iw + 1 && overflow.bw <= overflow.iw + 1, `${width}px ${route} 横向溢出`);
      }
      mark(`${width}px 矩阵与详情无横向溢出`);
    }
    assert(logs.pageErrors.length === 0, `HTTP 页面异常：${logs.pageErrors.join(' | ')}`);
    assert(logs.consoleErrors.length === 0, `HTTP 控制台 error：${logs.consoleErrors.join(' | ')}`);
    mark('HTTP 模式控制台 0 error / 0 pageerror');
    await context.close();

    // f. 默认 Chrome + file://（不带 --allow-file-access-from-files）
    const fileContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    const filePage = await fileContext.newPage();
    const fileLogs = attach(filePage);
    const fileUrl = `${pathToFileURL(distFile).href}#/repo/heygen-com__hyperframes`;
    await filePage.goto(fileUrl, { waitUntil: 'load' });
    await filePage.locator('.detail-view').waitFor({ state: 'visible', timeout: 20000 });
    await filePage.locator('.detail-media video').first().waitFor({ state: 'visible', timeout: 10000 });
    const fileSections = await filePage.locator('.detail-section').count();
    mark(`file:// 页面加载完成，详情分区 ${fileSections} 个`);

    const mediaResult = await filePage.locator('.detail-media video').first().evaluate(async (el) => {
      const info = {
        src: el.currentSrc,
        initialReadyState: el.readyState,
        networkState: el.networkState,
        errorCode: el.error ? el.error.code : null,
        errorMessage: el.error ? el.error.message : null,
      };
      const before = el.currentTime;
      el.muted = true;
      let playError = null;
      try {
        await el.play();
      } catch (error) {
        playError = String(error);
      }
      await new Promise((r) => setTimeout(r, 1800));
      return {
        ...info,
        playError,
        currentTimeBefore: before,
        currentTimeAfter: el.currentTime,
        readyState: el.readyState,
        paused: el.paused,
        advanced: el.currentTime - before,
      };
    });
    await filePage.screenshot({ path: path.join(shotDir, 'final-file-mode.png'), animations: 'disabled' }).catch(() => {});
    console.log(`[终验] file:// 视频实测：${JSON.stringify(mediaResult)}`);
    console.log(
      `[终验] file:// 控制台：consoleError=${fileLogs.consoleErrors.length} pageError=${fileLogs.pageErrors.length}`,
    );
    if (fileLogs.consoleErrors.length) console.log(`[终验] file:// errors: ${fileLogs.consoleErrors.slice(0, 3).join(' | ')}`);
    const playable = mediaResult.advanced > 0.3 && mediaResult.playError === null;
    console.log(`[终验] file:// 默认双击播放结论：${playable ? '可直接播放' : '无法播放'}`);
    await fileContext.close();

    console.log('\n[终验] 汇总');
    console.log(JSON.stringify({ rowCount, filteredNew: filtered, newIds: newIds.length, detailResults, distIds: embedded.size, browser: launchMode, fileMode: { ...mediaResult, playable }, consoleErrors: { http: logs.consoleErrors.length, file: fileLogs.consoleErrors.length } }, null, 2));
    console.log(`[终验] 总耗时 ${Date.now() - startedAt} ms`);
  } finally {
    if (browser) await browser.close();
    server.kill();
    if (serverLogs.length) console.log(`[终验] 预览日志：${serverLogs.join('').trim().split('\n').slice(-3).join(' | ')}`);
  }
}

main().catch((error) => {
  console.error(`\n[终验] 失败：${error.message}`);
  process.exit(1);
});
