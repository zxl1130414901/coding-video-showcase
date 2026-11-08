#!/usr/bin/env node
// 复核 showcase/data/evidence.json：覆盖数、claim 来源文件是否存在、quote 是否能在该文件中逐字命中
// 用法：node _reports/verify_evidence_quotes.mjs（结果同时写入 _reports/evidence_quotes_check.json）
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DATA = path.join(ROOT, "showcase", "data");

const evDoc = JSON.parse(fs.readFileSync(path.join(DATA, "evidence.json"), "utf8"));
const reposDoc = JSON.parse(fs.readFileSync(path.join(DATA, "repos.json"), "utf8"));

const NEW_IDS = new Set([
  "heygen-com__hyperframes",
  "feitangyuan__onetake",
  "lemomo-ai__lemo-opuscar",
  "alchaincyf__huashu-motion",
  "alchaincyf__huashu-art-motion",
  "threerocks__sweety-handdraw-video",
  "browser-use__video-use",
  "pedrovelasquez9__fragua",
  "yihui-dev__awesome-opus5-5-videos",
  "remotion-dev__skills",
  "vincentsch__explainroo",
  "kaomei__stickman-video-director",
  "lovisdotio__motion2code",
  "JohnHeibel__PDoomVideo",
]);

const fileCache = new Map();
function readText(abs) {
  if (fileCache.has(abs)) return fileCache.get(abs);
  const t = fs.readFileSync(abs, "utf8");
  fileCache.set(abs, t);
  return t;
}

function resolveSource(repoId, source) {
  const s = source.replace(/\\/g, "/");
  if (s.startsWith("_samples/") || s.startsWith("_reports/") || s === "manifest.json") {
    return { abs: path.join(ROOT, s), kind: "workspace" };
  }
  if (s.includes("/")) return { abs: path.join(ROOT, s), kind: "repo" };
  return { abs: path.join(ROOT, repoId, s), kind: "repo" };
}

const results = { newEntries: [], legacy: [], counts: {} };
const misses = [];
let totalClaims = 0;
let totalHit = 0;

for (const entry of evDoc.repos) {
  const isNew = NEW_IDS.has(entry.id);
  let claims = 0;
  let hits = 0;
  let missingSources = 0;

  for (const c of entry.claims || []) {
    claims++;
    totalClaims++;
    const { abs, kind } = resolveSource(entry.id, c.source);
    let ok = false;
    let reason = "";
    if (!fs.existsSync(abs)) {
      missingSources++;
      reason = "来源文件不存在";
    } else {
      let text;
      try {
        text = readText(abs);
      } catch (e) {
        reason = "读取失败：" + e.message;
      }
      if (text) {
        if (text.includes(c.quote)) ok = true;
        else reason = "引文未逐字命中";
      }
    }
    if (ok) {
      hits++;
      totalHit++;
    } else {
      misses.push({
        id: entry.id,
        target: c.target,
        source: c.source,
        resolved: path.relative(ROOT, abs).replace(/\\/g, "/"),
        kind,
        quote: c.quote,
        reason,
      });
    }
  }

  const rec = { id: entry.id, claims, hits, miss: claims - hits, missingSources };
  if (isNew) results.newEntries.push(rec);
  else results.legacy.push(rec);
}

const repoIds = new Set(reposDoc.repos.map((r) => r.id));
const covered = evDoc.repos.filter((e) => repoIds.has(e.id)).map((e) => e.id);
const uncovered = [...repoIds].filter((id) => !covered.includes(id));

const newClaims = results.newEntries.reduce((a, x) => a + x.claims, 0);
const newHits = results.newEntries.reduce((a, x) => a + x.hits, 0);
const legacyClaims = results.legacy.reduce((a, x) => a + x.claims, 0);
const legacyHits = results.legacy.reduce((a, x) => a + x.hits, 0);

results.counts = {
  reposTotal: reposDoc.repos.length,
  evidenceEntries: evDoc.repos.length,
  covered: covered.length,
  coverage: `${covered.length}/${reposDoc.repos.length}`,
  uncovered,
  newEntries: results.newEntries.length,
  newClaims,
  newHits,
  newHitRate: newClaims ? `${((newHits / newClaims) * 100).toFixed(2)}%` : "n/a",
  legacyClaims,
  legacyHits,
  legacyHitRate: legacyClaims ? `${((legacyHits / legacyClaims) * 100).toFixed(2)}%` : "n/a",
  allClaims: totalClaims,
  allHits: totalHit,
  allHitRate: totalClaims ? `${((totalHit / totalClaims) * 100).toFixed(2)}%` : "n/a",
};
results.misses = misses;

fs.writeFileSync(path.join(HERE, "evidence_quotes_check.json"), JSON.stringify(results, null, 2) + "\n", "utf8");
console.log(JSON.stringify(results.counts, null, 2));
console.log(`misses=${misses.length}`);
if (misses.length) {
  for (const m of misses.slice(0, 30)) {
    console.log(`- ${m.id} ${m.target} [${m.kind}] ${m.resolved} :: ${m.reason} :: ${m.quote.slice(0, 60)}`);
  }
}
// 新条目必须 100% 命中，且覆盖必须完整
const strictOk = results.counts.covered === reposDoc.repos.length && newHits === newClaims;
process.exit(strictOk ? 0 : 1);
