#!/usr/bin/env node
// 选型入口 v4 验收：首页结构 / 口语搜索 / 约束 AND 叠加 / 场景播放 / 矩阵回归 / 深链 / 四档响应式 / file:// 裸启动
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

const mark = (label) => console.log(`[v4] ${label}（累计 ${Date.now() - startedAt} ms）`);
const assert = (ok, message) => {
  if (!ok) throw new Error(`断言失败：${message}`);
};

const repos = JSON.parse(
  fs.readFileSync(path.join(appRoot, '..', 'data', 'repos.json'), 'utf8'),
).repos;
const discovery = JSON.parse(
  fs.readFileSync(path.join(appRoot, '..', 'data', 'discovery.json'), 'utf8'),
);
const firstScenario = discovery.scenarios[0];

async function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // 等待
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`预览服务器超时：${url}`);
}

function attach(page) {
  const logs = { consoleErrors: [], pageErrors: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') logs.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => logs.pageErrors.push(error.message));
  return logs;
}

async function playScenarioVideo(page) {
  return page.locator('.scenario-first-media video').evaluate(async (video) => {
    const before = video.currentTime;
    video.muted = true;
    let playError = null;
    try {
      await video.play();
    } catch (error) {
      playError = String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1700));
    return {
      before,
      after: video.currentTime,
      advanced: video.currentTime - before,
      readyState: video.readyState,
      errorCode: video.error ? video.error.code : null,
      playError,
    };
  });
}

async function searchNames(page, term) {
  await page.locator('.home-search-field input').fill(term);
  await page.waitForTimeout(120);
  const names = await page.locator('.home-results .result-name').allInnerTexts();
  return names;
}

async function overflowCheck(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  if (metrics.scrollWidth > metrics.innerWidth + 1) {
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll('*')]
        .map((el) => ({ el, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.right > window.innerWidth + 1 || rect.left < -1)
        .slice(0, 8)
        .map(
          ({ el, rect }) =>
            `${el.tagName.toLowerCase()}.${String(el.className).replace(/\s+/g, '.')} [${rect.left.toFixed(0)}→${rect.right.toFixed(0)}]`,
        ),
    );
    throw new Error(
      `${label} 横向溢出：${metrics.scrollWidth} > ${metrics.innerWidth}；${offenders.join(' | ')}`,
    );
  }
  return metrics;
}

async function main() {
  assert(fs.existsSync(distFile), '请先 npm run build');
  fs.mkdirSync(shotDir, { recursive: true });
  assert(repos.length === 65, `仓库总数 ${repos.length} != 65`);
  assert(discovery.scenarios.length === 10, '场景数不是 10');
  assert(discovery.constraints.length === 11, '约束数不是 11');
  assert(discovery.quickPicks.length === 8, 'quickPick 数不是 8');

  const serverLogs = [];
  const server = spawn(
    process.execPath,
    [viteBin, 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
    { cwd: appRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  );
  server.stdout.on('data', (chunk) => serverLogs.push(String(chunk)));
  server.stderr.on('data', (chunk) => serverLogs.push(String(chunk)));

  let browser;
  const summary = {};
  try {
    await waitForServer(previewBase);
    // 默认 Chrome 裸启动：不传 autoplay / 编解码参数
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    mark('默认 Chrome 裸启动');

    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: 'zh-CN',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    const logs = attach(page);

    // 1. 首页结构
    await page.goto(`${previewBase}/#/`, { waitUntil: 'networkidle' });
    await page.locator('.home-view').waitFor({ state: 'visible' });
    const scenarioCards = page.locator('.home-section .scenario-card');
    assert((await scenarioCards.count()) === 10, '场景卡不是 10 张');
    assert(
      (await page.locator('.constraint-chips .chip[aria-pressed]').count()) === 11,
      '约束 chip 不是 11 个',
    );
    assert((await page.locator('.quick-card').count()) === 8, 'quickPick 不是 8 条');
    const firstCardName = (
      await scenarioCards.first().locator('.scenario-first-name').innerText()
    ).trim();
    assert(firstCardName.length > 0, '场景卡首选名字为空');
    const firstCardThumb = await scenarioCards
      .first()
      .locator('.scenario-first .repo-thumb')
      .count();
    assert(firstCardThumb > 0, '场景卡首选缩略图缺失');
    await page.screenshot({ path: path.join(shotDir, 'v4-home.png'), animations: 'disabled' });
    mark(`首页：10 场景卡 / 11 chip / 8 quickPick；首卡 ${firstCardName}`);

    // 2. 口语搜索
    const mathNames = await searchNames(page, '数学动画');
    assert(
      mathNames.some((name) => /manim/i.test(name)),
      `「数学动画」未命中 manim：${mathNames.join(',')}`,
    );
    assert(
      mathNames.some((name) => /manimgx/i.test(name)) &&
        mathNames.some((name) => /manim-slides/i.test(name)),
      `「数学动画」未覆盖 manimgx / manim-slides：${mathNames.join(',')}`,
    );
    assert(await page.locator('.scenario-suggest').isVisible(), '搜索结果未给出最接近的场景');
    await page.screenshot({ path: path.join(shotDir, 'v4-search.png'), animations: 'disabled' });
    mark(`搜「数学动画」：${mathNames.join(' / ')}`);

    const reactNames = await searchNames(page, 'React 视频');
    assert(
      reactNames.some((name) => /remotion/i.test(name)),
      `「React 视频」未命中 remotion：${reactNames.slice(0, 6).join(',')}`,
    );
    assert(
      reactNames.some((name) => /remocn/i.test(name)) &&
        reactNames.some((name) => /revideo/i.test(name)),
      `「React 视频」未覆盖 remocn / revideo：${reactNames.join(',')}`,
    );
    mark(`搜「React 视频」：${reactNames.join(' / ')}`);

    const missingTerm = 'zzz不存在的仓库zzz';
    await searchNames(page, missingTerm);
    assert(await page.locator('.home-empty').isVisible(), '无结果时未显示空态');
    assert((await page.locator('.fallback-terms .chip').count()) === 3, '无结果推荐词不是 3 个');
    await page.locator('.fallback-terms .chip').first().click();
    await page.waitForTimeout(150);
    assert((await page.locator('.home-results .result-row').count()) > 0, '点击推荐词后仍无结果');
    await page.locator('.home-search-clear').click();
    mark('零结果：空态 + 3 个可点推荐词，点击后恢复结果');

    // 3. 约束 AND 叠加
    const noGpu = page.locator('.constraint-chips .chip', { hasText: '没有 GPU 也要能跑' });
    const fastInstall = page.locator('.constraint-chips .chip', { hasText: '5 分钟内装完' });
    const remainingOf = (text) => {
      const match = /剩余 (\d+) 个/.exec(text);
      return match ? Number(match[1]) : -1;
    };
    await noGpu.click();
    await page.waitForTimeout(120);
    const oneCount = remainingOf(await page.locator('.results-count').innerText());
    const oneSummary = await page.locator('.results-count').innerText();
    await fastInstall.click();
    await page.waitForTimeout(120);
    const twoCount = remainingOf(await page.locator('.results-count').innerText());
    const twoSummary = await page.locator('.results-count').innerText();
    assert(twoCount > 0 && twoCount < oneCount, `叠加后数量未下降：${oneCount} → ${twoCount}`);
    assert(/满足全部 2 条/.test(twoSummary), `计数文案不对：${twoSummary}`);
    const matchTags = await page
      .locator('.home-results .result-row')
      .evaluateAll((rows) => rows.map((row) => row.querySelectorAll('.tag.is-match').length));
    assert(
      matchTags.length > 0 && matchTags.every((count) => count === 2),
      `结果未逐条标出全部 2 个约束：${matchTags.join(',')}`,
    );
    assert((await noGpu.getAttribute('aria-pressed')) === 'true', 'GPU 约束未激活');
    assert((await fastInstall.getAttribute('aria-pressed')) === 'true', '安装约束未激活');
    await page.screenshot({
      path: path.join(shotDir, 'v4-constraints.png'),
      animations: 'disabled',
    });
    await fastInstall.click();
    await page.waitForTimeout(120);
    const backCount = remainingOf(await page.locator('.results-count').innerText());
    assert(backCount > twoCount, `取消一条后数量未回升：${twoCount} → ${backCount}`);
    mark(
      `约束叠加：${oneSummary} → ${twoSummary}（${oneCount} → ${twoCount}），取消后 ${backCount}`,
    );
    await noGpu.click();

    // 4. 场景页
    await page.goto(`${previewBase}/#/scenario/${firstScenario.id}`, { waitUntil: 'networkidle' });
    await page.locator('.scenario-first-card').waitFor({ state: 'visible' });
    await page.locator('.scenario-first-media video').waitFor({ state: 'visible' });
    const media = await playScenarioVideo(page);
    assert(media.playError === null, `场景视频播放报错：${media.playError}`);
    assert(media.errorCode === null, `场景视频 errorCode=${media.errorCode}`);
    assert(media.advanced > 0.5, `场景视频只推进 ${media.advanced.toFixed(2)}s`);
    const availableRecs = firstScenario.recommended.filter((rec) =>
      repos.some((repo) => repo.id === rec.repoId),
    );
    assert(
      (await page.locator('.alt-recommend-row').count()) === availableRecs.length - 1,
      '备选列表数量不对',
    );
    assert((await page.locator('.scenario-repo-list .result-row').count()) > 0, '场景符合清单为空');
    await page.screenshot({ path: path.join(shotDir, 'v4-scenario.png'), animations: 'disabled' });
    await page.locator('.alt-recommend-row .alt-open').first().click();
    await page.locator('.detail-view').waitFor({ state: 'visible' });
    await page.locator('.detail-back').first().click();
    await page.locator('.scenario-view').waitFor({ state: 'visible' });
    await page.locator('.detail-back').first().click();
    await page.locator('.home-view').waitFor({ state: 'visible' });
    mark(
      `场景 ${firstScenario.id}：视频推进 ${media.advanced.toFixed(2)}s；备选可点；返回链路正常`,
    );

    // 5. 深链刷新
    await page.goto(`${previewBase}/#/scenario/${firstScenario.id}`, { waitUntil: 'networkidle' });
    await page.locator('.scenario-first-card').waitFor({ state: 'visible' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.scenario-first-card').waitFor({ state: 'visible' });
    const detailRepoId = firstScenario.recommended[0].repoId;
    await page.goto(`${previewBase}/#/repo/${detailRepoId}`, { waitUntil: 'networkidle' });
    await page.locator('.detail-view').waitFor({ state: 'visible' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.detail-view').waitFor({ state: 'visible' });
    mark(`深链刷新：场景 ${firstScenario.id} 与详情 ${detailRepoId} 均还原`);

    // 6. 矩阵回归
    await page.goto(`${previewBase}/#/all`, { waitUntil: 'networkidle' });
    await page.locator('table.repo-table tbody tr').first().waitFor({ state: 'visible' });
    assert((await page.locator('table.repo-table tbody tr').count()) === 65, '矩阵不是 65 行');
    assert(await page.locator('.matrix-home-link').isVisible(), '矩阵缺少回首页入口');
    const sortButton = page
      .locator('table.repo-table thead th', { hasText: '综合分' })
      .locator('button');
    if ((await sortButton.count()) > 0) {
      await sortButton.first().click();
      await page.waitForTimeout(150);
      const ariaSort = await page
        .locator('table.repo-table thead th', { hasText: '综合分' })
        .getAttribute('aria-sort');
      assert(ariaSort === 'ascending' || ariaSort === 'descending', `排序未生效：${ariaSort}`);
    }
    await page.locator('.filter-toolbar .search-field input').fill('manim');
    await page.waitForTimeout(200);
    const filteredRows = await page.locator('table.repo-table tbody tr').count();
    assert(filteredRows >= 1 && filteredRows < 65, `矩阵关键词筛选异常：${filteredRows}`);
    mark(`矩阵：#/all 65 行，排序 + 关键词筛选回归正常（manim → ${filteredRows} 行）`);
    await page.locator('.filter-toolbar .search-clear').click();

    // 7. 四档响应式
    const viewports = [375, 768, 1024, 1440];
    const widthReports = [];
    for (const width of viewports) {
      await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
      await page.goto(`${previewBase}/#/`, { waitUntil: 'networkidle' });
      await page.locator('.home-view').waitFor({ state: 'visible' });
      const metrics = await overflowCheck(page, `首页 ${width}px`);
      await page.goto(`${previewBase}/#/scenario/${firstScenario.id}`, {
        waitUntil: 'networkidle',
      });
      await page.locator('.scenario-first-card').waitFor({ state: 'visible' });
      await overflowCheck(page, `场景页 ${width}px`);
      widthReports.push({ width, ...metrics });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    mark(`响应式 375 / 768 / 1024 / 1440 无横向溢出`);

    assert(logs.pageErrors.length === 0, `HTTP pageError：${logs.pageErrors.join(' | ')}`);
    assert(
      logs.consoleErrors.length === 0,
      `HTTP console error：${logs.consoleErrors.join(' | ')}`,
    );
    mark('HTTP 控制台 0 error');
    await context.close();

    // 8. 默认 Chrome + file:// 裸启动
    const fileContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: 'zh-CN',
    });
    const filePage = await fileContext.newPage();
    const fileLogs = attach(filePage);
    await filePage.goto(`${pathToFileURL(distFile).href}#/`, { waitUntil: 'load' });
    await filePage.locator('.home-view').waitFor({ state: 'visible', timeout: 25000 });
    assert((await filePage.locator('.scenario-card').count()) === 10, 'file:// 场景卡不可见');
    const fileMath = await searchNames(filePage, 'manim');
    assert(
      fileMath.some((name) => /manim/i.test(name)),
      'file:// 搜 manim 无结果',
    );
    await filePage.locator('.home-search-clear').click();
    await filePage.goto(`${pathToFileURL(distFile).href}#/all`, { waitUntil: 'load' });
    await filePage.locator('table.repo-table tbody tr').first().waitFor({ state: 'visible' });
    assert(
      (await filePage.locator('table.repo-table tbody tr').count()) === 65,
      'file:// 矩阵不是 65 行',
    );
    assert(
      fileLogs.consoleErrors.length === 0 && fileLogs.pageErrors.length === 0,
      `file:// 控制台 error：${[...fileLogs.consoleErrors, ...fileLogs.pageErrors].join(' | ')}`,
    );
    mark('file:// 裸启动：65 条可搜 / 场景卡可见 / 控制台 0 error');
    await fileContext.close();

    summary.home = { scenarioCards: 10, constraints: 11, quickPicks: 8, firstCardName };
    summary.search = {
      math: mathNames,
      react: reactNames,
      emptyFallbacks: 3,
    };
    summary.constraints = { one: oneCount, two: twoCount, back: backCount, copy: twoSummary };
    summary.scenario = {
      id: firstScenario.id,
      advanced: Number(media.advanced.toFixed(2)),
      alts: availableRecs.length - 1,
    };
    summary.widths = widthReports;
    summary.file = { rows: 65, scenarioCards: 10, consoleErrors: 0 };
    summary.consoleErrors = { http: 0, file: 0 };

    console.log('\n[v4] 汇总');
    console.log(JSON.stringify(summary, null, 2));
    console.log(`[v4] 总耗时 ${Date.now() - startedAt} ms`);
  } finally {
    if (browser) await browser.close();
    server.kill();
    if (serverLogs.length) {
      console.log(`[v4] 预览日志：${serverLogs.join('').trim().split('\n').slice(-2).join(' | ')}`);
    }
  }
}

main().catch((error) => {
  console.error(`\n[v4] 失败：${error.message}`);
  process.exit(1);
});
