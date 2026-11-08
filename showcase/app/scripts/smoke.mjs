#!/usr/bin/env node
/**
 * Playwright 冒烟：npm run preview 与 file:// 两种模式。
 * 覆盖详情页全部区块、缺失 features 降级、compareTips 跳转、对比档案行、视频播放、控制台与离线请求、四档响应式。
 * 运行前需先 npm run build。
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const appRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const screenshotDir = path.join(appRoot, 'docs', 'screenshots');
const previewBase = 'http://127.0.0.1:4173';
const distFile = path.join(appRoot, 'dist', 'index.html');
const viteBin = path.join(appRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const startedAt = Date.now();

function mark(label) {
  const ms = Date.now() - startedAt;
  console.log(`[冒烟] ${label}（累计 ${ms} ms）`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`断言失败：${message}`);
}

function findChromiumExecutable() {
  const base = path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'ms-playwright',
  );
  if (!fs.existsSync(base)) return undefined;
  const candidates = fs
    .readdirSync(base)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const name of candidates) {
    const exe = path.join(base, name, 'chrome-win', 'chrome.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // 继续等待
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`预览服务器启动超时：${url}`);
}

function readRepos() {
  const file = path.join(appRoot, '..', 'data', 'repos.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')).repos;
}

function sampleDir(id) {
  return path.resolve(appRoot, '..', '..', '_samples', id);
}

function hasFeatures(id) {
  return fs.existsSync(path.join(sampleDir(id), 'features.json'));
}

function attachDiagnostics(page) {
  const diagnostics = { consoleErrors: [], pageErrors: [], externalRequests: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  return diagnostics;
}

function assertClean(diagnostics, label, allowHttpBase) {
  if (diagnostics.pageErrors.length > 0) {
    throw new Error(`${label} 页面运行时错误：${diagnostics.pageErrors.join(' | ')}`);
  }
  if (diagnostics.consoleErrors.length > 0) {
    throw new Error(`${label} 控制台 error：${diagnostics.consoleErrors.join(' | ')}`);
  }
  const external = diagnostics.externalRequests.filter((url) => {
    if (url.startsWith('data:') || url.startsWith('blob:')) return false;
    if (allowHttpBase && url.startsWith(allowHttpBase)) return false;
    if (!allowHttpBase && url.startsWith('file:')) return false;
    return true;
  });
  if (external.length > 0) {
    throw new Error(`${label} 出现外部请求：${external.slice(0, 3).join(' | ')}`);
  }
}

async function waitForDetail(page) {
  await page.locator('.detail-view').waitFor({ state: 'visible' });
  await page.locator('#detail-title').waitFor({ state: 'visible' });
  await page.waitForTimeout(200);
}

async function assertDetailSections(page, label) {
  const sections = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.detail-section')).map((section) => ({
      id: section.getAttribute('aria-labelledby') ?? '',
      text: (section.innerText ?? '').trim(),
    })),
  );
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
  for (const id of required) {
    const section = sections.find((item) => item.id === id);
    assert(section, `${label} 缺少分区 ${id}`);
    assert(section.text.length > 40, `${label} 分区 ${id} 内容过短：${section.text.slice(0, 60)}`);
  }
  const bodyText = await page.locator('.detail-view').innerText();
  assert(!/undefined|NaN|\[object Object\]/.test(bodyText), `${label} 出现 undefined/NaN 文本`);
  const counts = {
    whatCards: await page.locator('.what-card').count(),
    useCards: await page.locator('.use-card').count(),
    capabilityRows: await page.locator('.capability-row').count(),
    workflowSteps: await page.locator('.workflow-step').count(),
    gapColumns: await page.locator('.gap-column').count(),
    compareTips: await page.locator('.compare-tip-row').count(),
  };
  assert(counts.whatCards > 0, `${label} whatItMakes 为空`);
  assert(counts.useCards > 0, `${label} useCases 为空`);
  assert(counts.capabilityRows >= 7, `${label} 能力字段不足：${counts.capabilityRows}`);
  assert(counts.workflowSteps > 0, `${label} workflow 为空`);
  assert(counts.gapColumns === 2, `${label} 差异化/短板双栏缺失`);
  assert(counts.compareTips > 0, `${label} compareTips 为空`);
  return counts;
}

async function playSample(page) {
  const video = page.locator('.detail-media video').first();
  await video.waitFor({ state: 'visible', timeout: 10_000 });
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(async (element) => {
    if (element.readyState < 1) {
      await new Promise((resolve) => {
        const done = () => resolve(undefined);
        element.addEventListener('loadedmetadata', done, { once: true });
        setTimeout(done, 3000);
      });
    }
    element.muted = true;
    await element.play();
  });
  await page.waitForTimeout(500);
  await page.waitForFunction(
    () => {
      const video = document.querySelector('.detail-media video');
      return Boolean(video && video.currentTime > 0.5);
    },
    undefined,
    { timeout: 10_000 },
  );
  const playback = await video.evaluate((element) => ({
    currentTime: element.currentTime,
    duration: element.duration,
    src: element.currentSrc,
  }));
  assert(playback.currentTime > 0.5, `视频 currentTime 应 > 0.5s，实际 ${playback.currentTime}`);
  return playback;
}

async function assertNoOverflow(page, width, routes) {
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });
    const target = route.includes('/repo/')
      ? page.locator('.detail-view')
      : page.locator('.matrix-view');
    await target.waitFor({ state: 'visible' });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    assert(
      overflow.scrollWidth <= overflow.innerWidth + 1 &&
        overflow.bodyWidth <= overflow.innerWidth + 1,
      `${width}px ${route} 横向溢出：${JSON.stringify(overflow)}`,
    );
  }
}

async function previewSmoke(browser, repos, missingRepo, featureRepo) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: previewBase });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  const diagnostics = attachDiagnostics(page);
  page.on('request', (request) => diagnostics.externalRequests.push(request.url()));

  await page.goto(`${previewBase}/#/`, { waitUntil: 'networkidle' });
  // v4 起默认路由是「选型首页」，不再是总览页：断言首页真实存在的搜索框、口语输入框与 10 个场景入口
  await page.locator('.home-view').waitFor({ state: 'visible' });
  await page.locator('input[type="search"]').waitFor({ state: 'visible' });
  await page.locator('.intent-field textarea').waitFor({ state: 'visible' });
  const sceneCards = await page.locator('.scenario-card').count();
  assert(sceneCards === 10, `选型首页应有 10 个场景入口，实际 ${sceneCards}`);
  const navLabels = await page.locator('.nav-button').allInnerTexts();
  assert(
    ['选型首页', '全部项目', '总览', '时间线'].every((label) =>
      navLabels.some((text) => text.includes(label)),
    ),
    `顶部导航应包含四项，实际 ${navLabels.join(' / ')}`,
  );
  mark('选型首页与四项导航验证完成');

  await page.goto(`${previewBase}/#/?view=matrix`, { waitUntil: 'networkidle' });
  await page.locator('table.repo-table tbody tr').first().waitFor({ state: 'visible' });
  const rowCount = await page.locator('table.repo-table tbody tr').count();
  assert(rowCount === 65, `矩阵应有 65 行，实际 ${rowCount}`);
  const clickable = await page
    .locator('table.repo-table tbody tr')
    .evaluateAll((rows) =>
      rows.every((row) => row.tabIndex === 0 && Boolean(row.getAttribute('aria-label'))),
    );
  assert(clickable, '65 行都应可点击且可键盘聚焦');
  await page.screenshot({
    path: path.join(screenshotDir, 'v2-matrix.png'),
    animations: 'disabled',
  });
  mark('矩阵 65 行可点击并截图完成');

  const search = page.locator('input[type="search"]');
  await search.fill('remotion');
  await page.waitForFunction(() => {
    const count = document.querySelectorAll('tbody tr').length;
    return count > 0 && count < 65;
  });
  const filteredRows = await page.locator('tbody tr').count();
  await page.locator('tbody tr').first().click();
  await waitForDetail(page);
  await page.locator('.detail-back').click();
  await page.waitForFunction(() => !window.location.hash.startsWith('#/repo/'));
  await page.locator('input[type="search"]').waitFor({ state: 'visible' });
  assert(
    (await page.locator('input[type="search"]').inputValue()) === 'remotion',
    '从详情返回后应保留关键词筛选',
  );
  assert(
    (await page.locator('tbody tr').count()) === filteredRows,
    `返回后筛选结果应仍为 ${filteredRows} 行`,
  );
  mark('行点击进入详情 + 返回保留筛选验证完成');

  await page.goto(`${previewBase}/#/repo/remotion-dev__remotion`, { waitUntil: 'networkidle' });
  await waitForDetail(page);
  const counts = await assertDetailSections(page, 'remotion 详情');
  const title = await page.locator('#detail-title').innerText();
  assert(title.includes('remotion'), '深链应打开 remotion 详情');
  assert(
    (await page.title()).includes('remotion'),
    `document.title 应随详情变化，实际 ${await page.title()}`,
  );
  await page.locator('#detail-what').scrollIntoViewIfNeeded();
  await page.locator('.topbar').evaluate((element) => {
    element.style.visibility = 'hidden';
  });
  await page.locator('.detail-hero').screenshot({
    path: path.join(screenshotDir, 'v2-detail-hero.png'),
    animations: 'disabled',
  });
  await page.locator('section[aria-labelledby="detail-usecases"]').screenshot({
    path: path.join(screenshotDir, 'v2-detail-usecases.png'),
    animations: 'disabled',
  });
  await page.locator('section[aria-labelledby="detail-capability"]').screenshot({
    path: path.join(screenshotDir, 'v2-detail-capability.png'),
    animations: 'disabled',
  });
  await page.locator('section[aria-labelledby="detail-sample"]').screenshot({
    path: path.join(screenshotDir, 'v2-detail-sample.png'),
    animations: 'disabled',
  });
  await page.locator('.topbar').evaluate((element) => {
    element.style.visibility = '';
  });
  mark(
    `detail 全分区渲染：what=${counts.whatCards} / use=${counts.useCards} / workflow=${counts.workflowSteps} / tips=${counts.compareTips}`,
  );

  const playback = await playSample(page);
  mark(
    `详情主视频播放通过：currentTime=${playback.currentTime.toFixed(2)}s / duration=${playback.duration}s`,
  );

  const selectButton = page.getByRole('button', { name: /加入对比|已在对比/ }).first();
  await selectButton.click();
  await page.locator('.compare-bar').waitFor({ state: 'visible' });
  const selectedCount = await page.locator('.compare-bar-info .mono').innerText();
  assert(selectedCount.includes('1'), `详情页加入对比后应为 1 项，实际 ${selectedCount}`);
  await page
    .getByRole('button', { name: /已在对比/ })
    .first()
    .click();
  await page.locator('.compare-bar').waitFor({ state: 'hidden' });
  mark('详情页可加入/移出对比验证完成');

  await page.getByRole('button', { name: '基础样例' }).click();
  const basicVideo = page.locator('.detail-media video').first();
  await basicVideo.waitFor({ state: 'visible' });
  const basicSrc = await page.locator('.detail-media source').first().getAttribute('src');
  assert(basicSrc?.includes('sample_basic.mp4'), `基础样例切换失败：${basicSrc}`);
  await playSample(page);
  await page.getByRole('button', { name: '能力演示' }).click();
  mark('基础样例切换 + 播放验证完成');

  if (!hasFeatures('remotion-dev__remotion')) {
    await page.locator('.features-empty').waitFor({ state: 'visible' });
    assert(
      (await page.locator('.features-empty').innerText()).includes('尚未生成'),
      '缺失 features.json 时应显式标注',
    );
    mark('remotion 缺失 features.json 降级标注验证完成');
  } else {
    await page.locator('.feature-segments').waitFor({ state: 'visible' });
    mark('remotion 已具备 features.json，分段能力正常展示');
  }

  const tipButtons = page.locator('.compare-tip-link');
  assert((await tipButtons.count()) > 0, 'compareTips 应有可跳转目标');
  const beforeUrl = page.url();
  await tipButtons.first().click();
  await page.waitForURL((url) => url.href !== beforeUrl && /#\/repo\//.test(url.href));
  await waitForDetail(page);
  const targetTitle = await page.locator('#detail-title').innerText();
  assert(!targetTitle.includes('remotion'), `compareTips 应跳转到其他项目，实际 ${targetTitle}`);
  await page.locator('.detail-back').click();
  await page.locator('table.repo-table tbody tr').first().waitFor({ state: 'visible' });
  mark(`compareTips.vs 跳转详情并返回：${targetTitle.replace(/\s+/g, '')}`);

  if (missingRepo.id !== 'remotion-dev__remotion') {
    await page.goto(`${previewBase}/#/repo/${missingRepo.id}`, { waitUntil: 'networkidle' });
    await waitForDetail(page);
    await page.locator('.features-empty').waitFor({ state: 'visible' });
    const notice = await page.locator('.features-empty').innerText();
    assert(notice.includes('尚未生成'), '缺失 features 的页面应显式标注');
  }

  if (featureRepo) {
    await page.goto(`${previewBase}/#/repo/${featureRepo.id}`, { waitUntil: 'networkidle' });
    await waitForDetail(page);
    await page.locator('.feature-segments').waitFor({ state: 'visible' });
    const segmentCount = await page.locator('.feature-segment').count();
    assert(segmentCount > 0, `有 features.json 的仓库应显示能力分段，实际 ${segmentCount}`);
    await page.locator('.feature-segment-button').first().click();
    mark(`有 features 仓库 ${featureRepo.id} 显示 ${segmentCount} 段并支持点击定位`);
  }

  await page.goto(`${previewBase}/#/?view=matrix`, { waitUntil: 'networkidle' });
  await page.locator('table.repo-table tbody tr').first().waitFor({ state: 'visible' });
  const checkboxes = page.locator('table.repo-table tbody tr .checkbox');
  for (let index = 0; index < 3; index += 1) {
    await checkboxes.nth(index).check();
  }
  await page.getByRole('button', { name: '开始对比' }).click();
  await page.locator('.compare-modal').waitFor({ state: 'visible' });
  const archiveRows = await page.locator('.compare-archive-row').count();
  assert(archiveRows === 13, `对比页应有 13 行档案级差异，实际 ${archiveRows}`);
  const groupText = await page.locator('.compare-group-title').innerText();
  assert(groupText.includes('深度档案'), '对比页应显示深度档案分组');
  await page.locator('.compare-group-row').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(screenshotDir, 'v2-compare.png'),
    animations: 'disabled',
  });
  mark(`对比页 3 项目 + ${archiveRows} 行档案差异截图完成`);
  await page.keyboard.press('Escape');
  await page.locator('.compare-modal').waitFor({ state: 'hidden' });

  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await assertNoOverflow(page, width, [
      `${previewBase}/#/?view=matrix`,
      `${previewBase}/#/repo/remotion-dev__remotion`,
    ]);
    mark(`${width}px 详情与矩阵无横向溢出`);
  }

  assertClean(diagnostics, 'preview 模式', previewBase);
  mark('preview 控制台 0 error / 无外部请求');
  await context.close();
  return { counts, playback };
}

async function fileSmoke(browser, missingRepo) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: 'zh-CN',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12_000);
  const diagnostics = attachDiagnostics(page);
  page.on('request', (request) => diagnostics.externalRequests.push(request.url()));

  const fileUrl = `${pathToFileURL(distFile).href}#/repo/remotion-dev__remotion`;
  await page.goto(fileUrl, { waitUntil: 'load' });
  await waitForDetail(page);
  const counts = await assertDetailSections(page, 'file:// 详情');
  const playback = await playSample(page);
  if (!hasFeatures('remotion-dev__remotion')) {
    await page.locator('.features-empty').waitFor({ state: 'visible' });
  }
  assertClean(diagnostics, 'file:// 模式', null);
  mark(
    `file:// 详情通过：视频 currentTime=${playback.currentTime.toFixed(2)}s / workflow=${counts.workflowSteps}`,
  );
  await context.close();

  if (missingRepo.id !== 'remotion-dev__remotion') {
    const context2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page2 = await context2.newPage();
    const diagnostics2 = attachDiagnostics(page2);
    page2.on('request', (request) => diagnostics2.externalRequests.push(request.url()));
    await page2.goto(`${pathToFileURL(distFile).href}#/repo/${missingRepo.id}`, {
      waitUntil: 'load',
    });
    await waitForDetail(page2);
    await page2.locator('.features-empty').waitFor({ state: 'visible' });
    assertClean(diagnostics2, 'file:// 缺失 features', null);
    await context2.close();
    mark(`file:// 缺失 features 降级通过：${missingRepo.id}`);
  }
}

async function main() {
  assert(fs.existsSync(distFile), '未找到 dist/index.html，请先 npm run build');
  fs.mkdirSync(screenshotDir, { recursive: true });

  const repos = readRepos();
  const withFeatures = repos.filter((repo) => hasFeatures(repo.id));
  const withoutFeatures = repos.filter((repo) => !hasFeatures(repo.id));
  const missingRepo =
    withoutFeatures.find((repo) => repo.id === 'remotion-dev__remotion') ?? withoutFeatures[0];
  assert(missingRepo, '数据中应存在至少一个未生成 features.json 的仓库用于降级验证');

  const serverLogs = [];
  const server = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
    { cwd: appRoot, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  server.stdout.on('data', (chunk) => serverLogs.push(String(chunk)));
  server.stderr.on('data', (chunk) => serverLogs.push(String(chunk)));

  let browser;
  try {
    await waitForServer(previewBase);
    mark('预览服务器就绪');

    const executablePath = findChromiumExecutable();
    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--allow-file-access-from-files',
        '--no-sandbox',
      ],
    });

    const previewResult = await previewSmoke(browser, repos, missingRepo, withFeatures[0] ?? null);
    await fileSmoke(browser, missingRepo);

    console.log('\n[冒烟] 全部通过');
    console.log(
      `[冒烟] 汇总：preview 视频 currentTime=${previewResult.playback.currentTime.toFixed(2)}s · 缺失 features 降级 ${missingRepo.id} · 档案级对比 13 行`,
    );
    console.log(`[冒烟] 截图目录：${screenshotDir}`);
    console.log(`[冒烟] 总耗时：${Date.now() - startedAt} ms`);
  } finally {
    if (browser) await browser.close();
    server.kill();
    if (serverLogs.length > 0) {
      console.log(
        `[冒烟] 预览服务器日志：${serverLogs.join('').trim().split('\n').slice(-4).join(' | ')}`,
      );
    }
  }
}

main().catch((error) => {
  console.error(`\n[冒烟] 失败：${error.message}`);
  process.exit(1);
});
