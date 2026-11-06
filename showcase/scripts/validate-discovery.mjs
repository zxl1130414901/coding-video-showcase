#!/usr/bin/env node
// 校验 showcase/data/discovery.json：契约字段、仓库引用、场景首选唯一性、约束可判定、同义词可解析
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");           // F:\coding视频
const DATA = path.join(ROOT, "showcase", "data");
const repos = JSON.parse(fs.readFileSync(path.join(DATA, "repos.json"), "utf8")).repos;
const doc = JSON.parse(fs.readFileSync(path.join(DATA, "discovery.json"), "utf8"));

const errors = [];
const E = (m) => errors.push(m);
const len = (s) => [...String(s ?? "")].length;
const isStr = (v) => typeof v === "string" && v.trim().length > 0;

const byId = new Map(repos.map((r) => [r.id, r]));
const CATS = new Set(repos.map((r) => r.category));
const TAGS = new Set(repos.flatMap((r) => r.tags || []));
const winOf = (r) => r.windowsSupport;
const gpuOf = (r) => r.gpuAcceleration;
const pipelineOf = (r) => r.sample?.pipeline ?? "none";
const cliOf = (r) => r.cliHeadless;
// batchable：有可脚本 CLI，且不是纯对话式 Agent 流程（以 official/wrapper 产物链路为准）
const batchableOf = (r) => cliOf(r) === "yes" && ["official", "wrapper"].includes(pipelineOf(r));

const FIELD_GETTERS = {
  windowsTier: winOf,
  needsGpu: gpuOf,
  installComplexity: (r) => r.installComplexity,
  pipeline: pipelineOf,
  hasCli: cliOf,
  batchable: batchableOf,
};
const OPS = new Set(["in", "eq", "lte", "gte"]);

// 1. 顶层结构
if (doc.updatedAt !== "2026-11-06") E(`updatedAt=${doc.updatedAt}，应为 2026-11-06`);
for (const k of ["scenarios", "constraints", "quickPicks", "synonyms", "warnings"]) {
  if (doc[k] == null) E(`缺少顶层字段 ${k}`);
}
if (!Array.isArray(doc.scenarios)) E("scenarios 必须是数组");
if (!Array.isArray(doc.constraints)) E("constraints 必须是数组");
if (!Array.isArray(doc.quickPicks)) E("quickPicks 必须是数组");
if (typeof doc.synonyms !== "object" || Array.isArray(doc.synonyms)) E("synonyms 必须是对象");
if (!Array.isArray(doc.warnings)) E("warnings 必须是数组");

// 2. 场景
const S = Array.isArray(doc.scenarios) ? doc.scenarios : [];
if (S.length < 8 || S.length > 10) E(`scenarios=${S.length}，应为 8-10`);
const seenScenario = new Set();
const firstIds = [];
for (const s of S) {
  const tag = `scenario(${s.id})`;
  if (!isStr(s.id)) E(`${tag} 缺少 id`);
  if (seenScenario.has(s.id)) E(`${tag} id 重复`);
  seenScenario.add(s.id);
  if (byId.has(s.id)) E(`${tag} id 与仓库 id 自引用冲突`);
  if (len(s.titleZh) < 6 || len(s.titleZh) > 10) E(`${tag} titleZh ${len(s.titleZh)} 字，应为 6-10`);
  if (len(s.descZh) < 20 || len(s.descZh) > 40) E(`${tag} descZh ${len(s.descZh)} 字，应为 20-40`);
  if (!isStr(s.questionZh)) E(`${tag} 缺少 questionZh`);

  const rec = Array.isArray(s.recommended) ? s.recommended : [];
  if (rec.length < 3 || rec.length > 5) E(`${tag} recommended=${rec.length}，应为 3-5`);
  const firsts = rec.filter((x) => x.verdict === "first");
  if (firsts.length !== 1) E(`${tag} first=${firsts.length}，必须恰好 1 个`);
  const recIds = new Set();
  for (const x of rec) {
    if (!byId.has(x.repoId)) E(`${tag} repoId 不存在：${x.repoId}`);
    if (recIds.has(x.repoId)) E(`${tag} repoId 重复：${x.repoId}`);
    recIds.add(x.repoId);
    if (!["first", "alt", "heavy"].includes(x.verdict)) E(`${tag} verdict 非法：${x.verdict}`);
    if (len(x.whyZh) < 30 || len(x.whyZh) > 60) E(`${tag} ${x.repoId} whyZh ${len(x.whyZh)} 字，应为 30-60`);
    if (!isStr(x.timeZh)) E(`${tag} ${x.repoId} 缺少 timeZh`);
    if (x.verdict === "first") {
      firstIds.push(x.repoId);
      const r = byId.get(x.repoId);
      if (r && !["ok"].includes(r.sample?.status)) {
        E(`${tag} first=${x.repoId} 的 sample.status=${r.sample?.status}，不可作为首选`);
      }
      if (r && pipelineOf(r) === "none") E(`${tag} first=${x.repoId} 无实测出片链路`);
    }
  }
  const f = s.filters || {};
  const cats = f.categories || [];
  const tags = f.tags || [];
  if (!cats.length && !tags.length) E(`${tag} filters 为空`);
  for (const c of cats) if (!CATS.has(c)) E(`${tag} 分类不存在：${c}`);
  for (const t of tags) if (!TAGS.has(t)) E(`${tag} tag 不存在：${t}`);
}

// 3. 约束（每条必须能落成非空仓库集合）
const C = Array.isArray(doc.constraints) ? doc.constraints : [];
if (C.length < 8 || C.length > 12) E(`constraints=${C.length}，应为 8-12`);
const seenC = new Set();
const passCounts = [];
for (const c of C) {
  const tag = `constraint(${c.id})`;
  if (!isStr(c.id)) E(`${tag} 缺少 id`);
  if (seenC.has(c.id)) E(`${tag} id 重复`);
  seenC.add(c.id);
  if (len(c.titleZh) < 4 || len(c.titleZh) > 14) E(`${tag} titleZh 长度异常：${len(c.titleZh)}`);
  if (!isStr(c.descZh)) E(`${tag} 缺少 descZh`);
  const a = c.apply || {};
  if (a.type !== "field") E(`${tag} apply.type 必须为 field`);
  if (!FIELD_GETTERS[a.field]) E(`${tag} apply.field 非法：${a.field}`);
  if (!OPS.has(a.op)) E(`${tag} apply.op 非法：${a.op}`);
  if (a.op === "in" && !Array.isArray(a.value)) E(`${tag} op=in 时 value 必须是数组`);
  if (a.op !== "in" && a.value === undefined) E(`${tag} 缺少 value`);

  if (FIELD_GETTERS[a.field]) {
    const get = FIELD_GETTERS[a.field];
    const hit = repos.filter((r) => {
      const v = get(r);
      switch (a.op) {
        case "in": return a.value.includes(v);
        case "eq": return v === a.value;
        case "lte": return Number(v) <= Number(a.value);
        case "gte": return Number(v) >= Number(a.value);
        default: return false;
      }
    });
    passCounts.push([c.id, hit.length]);
    if (hit.length === 0) E(`${tag} 无任何仓库通过，判定口径落空`);
  }
}

// 4. quickPicks
const Q = Array.isArray(doc.quickPicks) ? doc.quickPicks : [];
if (Q.length < 6 || Q.length > 8) E(`quickPicks=${Q.length}，应为 6-8`);
for (const q of Q) {
  const tag = `quickPick(${q.repoId})`;
  if (!byId.has(q.repoId)) E(`${tag} repoId 不存在`);
  if (len(q.needZh) < 8 || len(q.needZh) > 14) E(`${tag} needZh ${len(q.needZh)} 字，应为 8-14`);
  if (len(q.whyZh) < 30 || len(q.whyZh) > 50) E(`${tag} whyZh ${len(q.whyZh)} 字，应为 30-50`);
  if (!isStr(q.timeZh)) E(`${tag} 缺少 timeZh`);
  const r = byId.get(q.repoId);
  if (r && r.sample?.status !== "ok") E(`${tag} 非实测可用仓库（${r.sample?.status}）`);
}

// 5. synonyms（目标可解析到 repoId / 仓库名 / owner / tag / 分类）
const SYN = doc.synonyms && typeof doc.synonyms === "object" ? doc.synonyms : {};
const synKeys = Object.keys(SYN);
if (synKeys.length < 20 || synKeys.length > 40) E(`synonyms=${synKeys.length}，应为 20-40`);
const tokenSet = new Set();
for (const r of repos) {
  tokenSet.add(r.id.toLowerCase());
  tokenSet.add(String(r.repo).toLowerCase());
  tokenSet.add(String(r.owner).toLowerCase());
  for (const t of r.tags || []) tokenSet.add(String(t).toLowerCase());
  tokenSet.add(String(r.category).toLowerCase());
}
for (const [k, vals] of Object.entries(SYN)) {
  if (!isStr(k)) E("synonyms 存在空 key");
  if (!Array.isArray(vals) || !vals.length) { E(`synonyms[${k}] 必须是非空数组`); continue; }
  for (const v of vals) {
    if (!isStr(v)) { E(`synonyms[${k}] 含空值`); continue; }
    // 仅当 key 本身是仓库 id 且又映射回自己时才算自引用；key 为口语词、目标为同名 tag 属正常映射
    if (byId.has(k) && v === k) E(`synonyms[${k}] 仓库自引用`);
    if (!tokenSet.has(v.toLowerCase())) E(`synonyms[${k}] 目标不可解析：${v}`);
  }
}

// 6. warnings
const W = Array.isArray(doc.warnings) ? doc.warnings : [];
if (W.length < 6) E(`warnings=${W.length}，至少 6 条覆盖真实风险`);
for (const w of W) {
  if (!isStr(w.scopeZh) || !isStr(w.riskZh)) E(`warning 字段不完整：${JSON.stringify(w)}`);
}

// 输出
console.log("场景：");
for (const s of S) {
  const f = s.recommended.find((x) => x.verdict === "first");
  console.log(`  - ${s.id} (${len(s.titleZh)}字) first=${f?.repoId} rec=${s.recommended.length}`);
}
console.log(`约束通过数（共 ${C.length} 条）：`);
for (const [id, n] of passCounts) console.log(`  - ${id}: ${n}/65`);
const dup = firstIds.filter((x, i) => firstIds.indexOf(x) !== i);
console.log(`首选仓库：${new Set(firstIds).size} 个唯一值${dup.length ? `（跨场景复用：${[...new Set(dup)].join(", ")}）` : ""}`);
console.log(`quickPicks=${Q.length}，synonyms=${synKeys.length}，warnings=${W.length}`);

if (errors.length) {
  console.log(`\n失败：${errors.length} 个错误`);
  for (const m of errors) console.log(`  E ${m}`);
  console.log("\nok: false");
  process.exit(1);
}
console.log("\nok: true / 0 error");
