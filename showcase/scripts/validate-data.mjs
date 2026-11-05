#!/usr/bin/env node
// 校验 showcase/data/repos.json 与 evidence.json 的自洽性与磁盘一致性
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");           // F:\coding视频
const DATA = path.join(ROOT, "showcase", "data");
const reposDoc = JSON.parse(fs.readFileSync(path.join(DATA, "repos.json"), "utf8"));
const evDoc = JSON.parse(fs.readFileSync(path.join(DATA, "evidence.json"), "utf8"));
const manifestDoc = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
const manifest = Array.isArray(manifestDoc) ? manifestDoc : manifestDoc.items || [];
const detailsDir = path.join(DATA, "details");
const ARTICLE = "article:Te14wRPAJiVpJ1k4O9pcpgX3nHg";
const EXPECTED_TOTAL = 65;
const EXPECTED_BASE = 51;

const errors = [];
const warns = [];
const E = (m) => errors.push(m);

const CATS = ["动画引擎", "代码动画", "终端录制", "网页/H5 录屏", "剪辑与合成", "模板与 CLI 工具", "可视化编辑器", "其他"];
const LICS = ["MIT", "Apache-2.0", "GPL-3.0", "AGPL-3.0", "LGPL-3.0", "BSD-3-Clause", "BSD-2-Clause", "MPL-2.0", "Unlicense", "NOASSERTION", "未知"];
const GPU = ["none", "optional", "required", "unknown"];
const CLI = ["yes", "partial", "no"];
const WIN = ["works", "workaround", "broken", "unknown"];
const PIPE = ["official", "wrapper", "fallback", "none"];
const ST = ["ok", "failed", "skipped"];

// 1. 基本结构
if (!reposDoc.meta || !Array.isArray(reposDoc.repos)) E("repos.json 缺 meta 或 repos 数组");
if (!evDoc.meta || !Array.isArray(evDoc.repos)) E("evidence.json 缺 meta 或 repos 数组");
const repos = reposDoc.repos || [];
if (repos.length !== EXPECTED_TOTAL) E(`repos 长度=${repos.length}，应为 ${EXPECTED_TOTAL}`);
if (manifest.length !== EXPECTED_TOTAL) E(`manifest 条数=${manifest.length}，应为 ${EXPECTED_TOTAL}`);
if (!Array.isArray(reposDoc.meta?.sources) || reposDoc.meta.sources.length < 2) {
  E("meta.sources 应包含原有采集与文章两段来源");
} else if (!JSON.stringify(reposDoc.meta.sources).includes(ARTICLE)) {
  E(`meta.sources 未标注文章来源 ${ARTICLE}`);
}
if (!Array.isArray(manifestDoc) && manifestDoc._meta?.sources?.some((s) => String(s).includes(ARTICLE)) !== true) {
  E("manifest._meta.sources 未标注文章来源");
}

// 2. id 唯一 + manifest 对齐
const mById = new Map(manifest.map((m) => [`${m.owner}__${m.name}`, m]));
const ids = new Set();
for (const r of repos) {
  if (ids.has(r.id)) E(`id 重复: ${r.id}`);
  ids.add(r.id);
  const m = mById.get(r.id);
  if (!m) { E(`manifest 中不存在: ${r.id}`); continue; }
  if (r.stars !== m.stars) E(`${r.id} stars=${r.stars} 与 manifest ${m.stars} 不一致`);
  if (r.pushedAt !== m.pushed_at.slice(0, 10)) E(`${r.id} pushedAt 与 manifest 不一致`);
  if (r.createdAt !== m.created_at.slice(0, 10)) E(`${r.id} createdAt 与 manifest 不一致`);
  const want = m.sample_status;
  if (r.sample.status !== want) E(`${r.id} sample.status=${r.sample.status}，manifest=${want}`);
}

// 3. 字段完整性与类型
const REQUIRED = ["id","owner","repo","url","homepage","stars","forks","openIssues","license","language",
  "createdAt","updatedAt","pushedAt","descriptionZh","category","techStack","renderBackends","outputFormats",
  "gpuAcceleration","cliHeadless","windowsSupport","installComplexity","renderPerf","sample","scores",
  "pros","cons","bestFor","pitfalls","alternatives","tags"];
const missingField = {};
for (const r of repos) {
  for (const k of REQUIRED) if (!(k in r)) E(`${r.id} 缺字段 ${k}`);
  if (!CATS.includes(r.category)) E(`${r.id} category 非约定值: ${r.category}`);
  if (!LICS.includes(r.license)) E(`${r.id} license 非约定值: ${r.license}`);
  if (!GPU.includes(r.gpuAcceleration)) E(`${r.id} gpuAcceleration 非约定值`);
  if (!CLI.includes(r.cliHeadless)) E(`${r.id} cliHeadless 非约定值`);
  if (!WIN.includes(r.windowsSupport)) E(`${r.id} windowsSupport 非约定值`);
  if (!PIPE.includes(r.sample.pipeline)) E(`${r.id} sample.pipeline 非约定值`);
  if (!ST.includes(r.sample.status)) E(`${r.id} sample.status 非约定值`);
  if (typeof r.descriptionZh !== "string" || [...r.descriptionZh].length > 40) E(`${r.id} descriptionZh 超过 40 字`);
  if (!Array.isArray(r.techStack) || r.techStack.length < 3 || r.techStack.length > 6) E(`${r.id} techStack 应 3-6 条: ${r.techStack?.length}`);
  if (!Array.isArray(r.pros) || r.pros.length < 3 || r.pros.length > 5) E(`${r.id} pros 应 3-5 条: ${r.pros?.length}`);
  if (!Array.isArray(r.cons) || r.cons.length < 2 || r.cons.length > 4) E(`${r.id} cons 应 2-4 条: ${r.cons?.length}`);
  if (!Array.isArray(r.pitfalls) || r.pitfalls.length < 1 || r.pitfalls.length > 3) E(`${r.id} pitfalls 应 1-3 条`);
  if (!Array.isArray(r.alternatives) || r.alternatives.length < 1 || r.alternatives.length > 3) E(`${r.id} alternatives 应 1-3 条`);
  if (!Number.isInteger(r.installComplexity) || r.installComplexity < 1 || r.installComplexity > 5) E(`${r.id} installComplexity 非 1-5 整数`);
  for (const [k, v] of Object.entries(r.scores || {})) {
    if (!Number.isInteger(v) || v < 1 || v > 5) E(`${r.id} scores.${k}=${v} 非 1-5 整数`);
  }
  if (!r.url.startsWith("https://github.com/")) E(`${r.id} url 异常`);
  const alt = r.alternatives || [];
  for (const a of alt) {
    if (a === r.id) E(`${r.id} alternatives 指向自身`);
    if (!ids.has(a) && !mById.has(a)) E(`${r.id} alternatives 指向不存在的 id: ${a}`);
  }
  for (const k of REQUIRED) if (r[k] === undefined) missingField[k] = (missingField[k] || 0) + 1;
}

// 4. sample 产物真实存在
for (const r of repos) {
  const s = r.sample;
  if (s.status === "ok") {
    if (!s.videoPath) E(`${r.id} ok 但 videoPath 为空`);
    if (!s.thumbPath) E(`${r.id} ok 但 thumbPath 为空`);
    for (const p of [s.videoPath, s.thumbPath]) {
      if (!p) continue;
      const abs = path.join(ROOT, p.replace(/\\/g, "/"));
      if (!fs.existsSync(abs)) E(`${r.id} 产物不存在: ${p}`);
    }
    if (!s.spec) E(`${r.id} ok 但 spec 为空`);
    else {
      for (const k of ["width","height","fps","durationSec","frames","bytes","codec"]) {
        if (s.spec[k] === null || s.spec[k] === undefined) E(`${r.id} spec.${k} 缺失`);
      }
      const abs = path.join(ROOT, s.videoPath);
      // 另一路会持续重渲染 _samples，字节数允许漂移，只做提示不做阻断。
      if (fs.existsSync(abs) && fs.statSync(abs).size !== s.spec.bytes) {
        warns.push(`${r.id} spec.bytes=${s.spec.bytes} 与磁盘 ${fs.statSync(abs).size} 不符（样例可能正在重渲染）`);
      }
    }
  } else {
    if (s.videoPath || s.thumbPath) E(`${r.id} status=${s.status} 却给出产物路径`);
    if (s.spec) E(`${r.id} status=${s.status} 却有 spec`);
  }
  if (!r.sample.noteZh) E(`${r.id} sample.noteZh 为空`);
}

// 5. 计数
const counts = { total: repos.length, ok: 0, failed: 0, skipped: 0 };
for (const r of repos) counts[r.sample.status]++;
const wantCounts = { total: EXPECTED_TOTAL, ok: 51, failed: 5, skipped: 9 };
for (const k of Object.keys(wantCounts)) {
  if (counts[k] !== wantCounts[k]) E(`counts.${k}=${counts[k]}，应为 ${wantCounts[k]}`);
  if (reposDoc.meta?.counts?.[k] !== counts[k]) E(`meta.counts.${k}=${reposDoc.meta?.counts?.[k]} 与实际 ${counts[k]} 不符`);
}

// 6. evidence 覆盖与 claim 目标合法性
const evById = new Map(evDoc.repos.map((x) => [x.id, x]));
if (evById.size !== EXPECTED_BASE) E(`evidence 仓库数=${evById.size}，应为 ${EXPECTED_BASE}`);
for (const r of repos) {
  const e = evById.get(r.id);
  if (!e) {
    // 文章新增的 14 条不另建 evidence.json，改以 details 档案内的 evidence 为准。
    if (!r.source || !String(r.source).includes(ARTICLE)) E(`${r.id} 既非原有 evidence 仓库，也未标注文章 source`);
    const detailFile = path.join(detailsDir, `${r.id}.json`);
    if (!fs.existsSync(detailFile)) { E(`${r.id} 缺详情档案，无法核对证据`); continue; }
    const detail = JSON.parse(fs.readFileSync(detailFile, "utf8"));
    if (!Array.isArray(detail.evidence) || detail.evidence.length < 3) E(`${r.id} 档案 evidence 少于 3 条`);
    for (const item of detail.evidence || []) {
      if (!item.field || !item.source || !item.noteZh) E(`${r.id} 档案 evidence 字段不完整`);
    }
    continue;
  }
  if (!Array.isArray(e.filesRead) || e.filesRead.length < 2) E(`${r.id} evidence.filesRead 过少`);
  if (!e.sampleRef) E(`${r.id} evidence.sampleRef 缺失`);
  if (!e.scoreBasis || !e.scoreBasis.performance) E(`${r.id} evidence.scoreBasis 缺失`);
  const claims = e.claims || [];
  if (claims.length < 3) E(`${r.id} claims 过少: ${claims.length}`);
  const targets = new Set(claims.map((c) => c.target));
  for (let i = 0; i < r.pros.length; i++) if (!targets.has(`pros[${i}]`)) E(`${r.id} pros[${i}] 无证据指向`);
  for (let i = 0; i < r.cons.length; i++) if (!targets.has(`cons[${i}]`)) E(`${r.id} cons[${i}] 无证据指向`);
  for (const c of claims) {
    if (!c.target || !c.source || !c.quote) { E(`${r.id} claim 字段缺失`); continue; }
    let idx = null;
    let m = /^pros\[(\d)\]$/.exec(c.target);
    if (m) { idx = +m[1]; if (idx >= r.pros.length) E(`${r.id} claim ${c.target} 越界`); }
    m = /^cons\[(\d)\]$/.exec(c.target);
    if (m) { idx = +m[1]; if (idx >= r.cons.length) E(`${r.id} claim ${c.target} 越界`); }
    if (/^scores\./.test(c.target) && !(c.target.split(".")[1] in r.scores)) E(`${r.id} claim ${c.target} 无对应评分`);
    // source 若是具体文件则应存在
    if (c.source.includes("/") && !c.source.includes(" / ")) {
      const abs = path.join(ROOT, c.source.replace(/\\/g, "/"));
      if (!fs.existsSync(abs)) E(`${r.id} claim 来源不存在: ${c.source}`);
    }
    if (c.quote.length < 6) W2(`${r.id} claim 引文过短: ${c.quote}`);
  }
}
function W2(m) { warns.push(m); }

// 7. 详情档案覆盖（合并后应为 65 份，id 与 repo 对齐）
if (!fs.existsSync(detailsDir)) E("详情档案目录不存在");
else {
  const detailFiles = fs.readdirSync(detailsDir).filter((f) => f.endsWith(".json"));
  if (detailFiles.length !== EXPECTED_TOTAL) E(`details 档案数=${detailFiles.length}，应为 ${EXPECTED_TOTAL}`);
  for (const r of repos) {
    const file = path.join(detailsDir, `${r.id}.json`);
    if (!fs.existsSync(file)) { E(`details 缺 ${r.id}.json`); continue; }
    const detail = JSON.parse(fs.readFileSync(file, "utf8"));
    if (detail.id !== r.id) E(`details/${r.id}.json 的 id=${detail.id} 不匹配`);
  }
}

// 8. 覆盖率统计
const completeness = {};
for (const k of REQUIRED) {
  const filled = repos.filter((r) => {
    const v = r[k];
    return !(v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0));
  }).length;
  completeness[k] = `${filled}/${repos.length}`;
}
const claimsTotal = evDoc.repos.reduce((a, x) => a + (x.claims?.length || 0), 0);
const prosConsTotal = repos.reduce((a, r) => a + r.pros.length + r.cons.length, 0);

console.log(JSON.stringify({ ok: errors.length === 0, errors, warns, counts, completeness, evidenceClaims: claimsTotal, prosConsTotal }, null, 2));
process.exit(errors.length === 0 ? 0 : 1);
