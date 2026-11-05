// 校验 showcase/data/details 下某批仓库档案是否符合约定 schema 与字数要求
// 运行：node showcase/scripts/validate-details.mjs                → 默认第 1-26 条（A 路）
//       node showcase/scripts/validate-details.mjs --range 26-50  → 第 27-51 条（B 路）
// 字数口径：汉字计 1，英文/数字标识（如 WebCodecs、0.076fps）计 1，标点与空白不计
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'F:/coding视频/showcase';
const REPOS_PATH = path.join(ROOT, 'data/repos.json');
const DETAILS_DIR = path.join(ROOT, 'data/details');

const argIdx = process.argv.indexOf('--range');
let BATCH_START = 0;
let BATCH_END = 26;
if (argIdx > -1 && process.argv[argIdx + 1]) {
  const m = process.argv[argIdx + 1].match(/^(\d+)-(\d+)$/);
  if (!m) {
    console.error('--range 参数格式应为 start-end，例如 26-50');
    process.exit(2);
  }
  BATCH_START = Number(m[1]);
  BATCH_END = Number(m[2]) + 1;
}
const BATCH_SIZE = BATCH_END - BATCH_START;

const repos = JSON.parse(fs.readFileSync(REPOS_PATH, 'utf8')).repos;
const allIds = repos.map((r) => r.id);
const expectedIds = repos.slice(BATCH_START, BATCH_END).map((r) => r.id);

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`[${id}] ${msg}`);
const warn = (id, msg) => warnings.push(`[${id}] ${msg}`);

const charCount = (s) => {
  const cjk = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (s.match(/[A-Za-z][A-Za-z0-9_.\-/]*/g) || []).length;
  return cjk + words;
};
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isNonEmptyArray = (v, min) => Array.isArray(v) && v.length >= min;

const REQUIRED_TOP = [
  'id', 'taglineZh', 'summaryZh', 'whatItMakes', 'useCases', 'capabilities',
  'ceilingZh', 'workflow', 'differentiators', 'limits', 'compareTips', 'showcase', 'evidence',
];
const REQUIRED_CAPS = [
  'maxResolutionZh', 'maxFpsZh', 'durationZh', 'effectsZh', 'audioZh', 'interactivityZh',
  'automationZh', 'assetsZh', 'exportFormatsZh', 'realtimePreviewZh', 'ciFriendlyZh',
];

const STRENGTH = ['核心能力', '可用', '受限'];
const FIT = ['高度契合', '适合', '勉强'];

let checked = 0;

for (const id of expectedIds) {
  const file = path.join(DETAILS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) {
    err(id, '文件不存在');
    continue;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(id, `JSON 解析失败：${e.message}`);
    continue;
  }
  checked += 1;

  for (const key of REQUIRED_TOP) {
    if (data[key] === undefined || data[key] === null) err(id, `缺少字段 ${key}`);
  }

  if (data.id !== id) err(id, `id 不匹配：文件名为 ${id}，字段为 ${data.id}`);

  // 字数
  if (!isNonEmptyString(data.taglineZh)) err(id, 'taglineZh 为空');
  else {
    const n = charCount(data.taglineZh);
    if (n < 20 || n > 40) err(id, `taglineZh 字数 ${n} 不在 20-40`);
  }
  if (!isNonEmptyString(data.summaryZh)) err(id, 'summaryZh 为空');
  else {
    const n = charCount(data.summaryZh);
    if (n < 150 || n > 250) err(id, `summaryZh 字数 ${n} 不在 150-250`);
  }
  if (!isNonEmptyString(data.ceilingZh)) err(id, 'ceilingZh 为空');
  else {
    const n = charCount(data.ceilingZh);
    if (n < 200 || n > 350) err(id, `ceilingZh 字数 ${n} 不在 200-350`);
  }

  // whatItMakes
  if (!isNonEmptyArray(data.whatItMakes, 3)) err(id, 'whatItMakes 少于 3 条');
  else {
    if (data.whatItMakes.length > 6) err(id, 'whatItMakes 多于 6 条');
    data.whatItMakes.forEach((it, i) => {
      if (!isNonEmptyString(it.type)) err(id, `whatItMakes[${i}].type 为空`);
      if (!isNonEmptyString(it.exampleZh)) err(id, `whatItMakes[${i}].exampleZh 为空`);
      if (!STRENGTH.includes(it.strength)) err(id, `whatItMakes[${i}].strength 非法：${it.strength}`);
    });
  }

  // useCases
  if (!isNonEmptyArray(data.useCases, 4)) err(id, 'useCases 少于 4 条');
  else {
    if (data.useCases.length > 6) err(id, 'useCases 多于 6 条');
    data.useCases.forEach((it, i) => {
      for (const k of ['scenarioZh', 'whoZh', 'whyZh', 'deliverableZh']) {
        if (!isNonEmptyString(it[k])) err(id, `useCases[${i}].${k} 为空`);
      }
      if (!FIT.includes(it.fit)) err(id, `useCases[${i}].fit 非法：${it.fit}`);
    });
  }

  // capabilities
  if (!data.capabilities || typeof data.capabilities !== 'object') {
    err(id, 'capabilities 缺失或非对象');
  } else {
    for (const key of REQUIRED_CAPS) {
      const v = data.capabilities[key];
      if (v === undefined || v === null || (typeof v === 'string' && !v.trim())) {
        err(id, `capabilities.${key} 为空`);
      }
    }
  }

  // workflow
  if (!isNonEmptyArray(data.workflow, 3)) err(id, 'workflow 少于 3 步');
  else {
    if (data.workflow.length > 5) err(id, 'workflow 多于 5 步');
    data.workflow.forEach((it, i) => {
      if (!isNonEmptyString(it.stepZh)) err(id, `workflow[${i}].stepZh 为空`);
      if (!isNonEmptyString(it.detailZh)) err(id, `workflow[${i}].detailZh 为空`);
      if (!isNonEmptyString(it.effortZh)) err(id, `workflow[${i}].effortZh 为空`);
    });
  }

  // differentiators / limits / compareTips
  if (!isNonEmptyArray(data.differentiators, 3)) err(id, 'differentiators 少于 3 条');
  else if (data.differentiators.length > 5) err(id, 'differentiators 多于 5 条');
  data.differentiators?.forEach((s, i) => {
    if (!isNonEmptyString(s)) err(id, `differentiators[${i}] 为空`);
  });

  if (!isNonEmptyArray(data.limits, 2)) err(id, 'limits 少于 2 条');
  else if (data.limits.length > 4) err(id, 'limits 多于 4 条');
  data.limits?.forEach((s, i) => {
    if (!isNonEmptyString(s)) err(id, `limits[${i}] 为空`);
  });

  if (!isNonEmptyArray(data.compareTips, 1)) err(id, 'compareTips 少于 1 条');
  else if (data.compareTips.length > 3) err(id, 'compareTips 多于 3 条');
  data.compareTips?.forEach((it, i) => {
    if (!isNonEmptyString(it.vs)) err(id, `compareTips[${i}].vs 为空`);
    if (!isNonEmptyString(it.adviceZh)) err(id, `compareTips[${i}].adviceZh 为空`);
    if (!allIds.includes(it.vs)) warn(id, `compareTips[${i}].vs 不在 repos.json：${it.vs}`);
  });

  // showcase
  if (!data.showcase || !isNonEmptyString(data.showcase.demoBriefZh)) {
    err(id, 'showcase.demoBriefZh 为空');
  }
  if (!data.showcase || !isNonEmptyArray(data.showcase.featureCallouts, 4)) {
    err(id, 'showcase.featureCallouts 少于 4 条');
  } else {
    if (data.showcase.featureCallouts.length > 6) err(id, 'showcase.featureCallouts 多于 6 条');
    data.showcase.featureCallouts.forEach((it, i) => {
      if (!isNonEmptyString(it.titleZh)) err(id, `featureCallouts[${i}].titleZh 为空`);
      if (!isNonEmptyString(it.descZh)) err(id, `featureCallouts[${i}].descZh 为空`);
    });
  }

  // evidence
  if (!isNonEmptyArray(data.evidence, 3)) err(id, 'evidence 少于 3 条');
  data.evidence?.forEach((it, i) => {
    if (!isNonEmptyString(it.field)) err(id, `evidence[${i}].field 为空`);
    if (!isNonEmptyString(it.source)) err(id, `evidence[${i}].source 为空`);
    if (!isNonEmptyString(it.noteZh)) err(id, `evidence[${i}].noteZh 为空`);
  });
}

// 与 repos.json 对应段一致性
const idsInSlice = JSON.stringify(expectedIds);
if (expectedIds.length !== BATCH_SIZE) {
  err('batch', `repos.json 对应段长度 ${expectedIds.length}，期望 ${BATCH_SIZE}`);
}
const missing = expectedIds.filter((id) => !fs.existsSync(path.join(DETAILS_DIR, `${id}.json`)));
if (missing.length) err('batch', `缺失 ${missing.length} 个：${missing.join(', ')}`);

// 文件名与 id 全量唯一性（防止其它批次重复写同一 id）
const allFiles = fs.existsSync(DETAILS_DIR)
  ? fs.readdirSync(DETAILS_DIR).filter((f) => f.endsWith('.json'))
  : [];
const dup = allFiles.filter((f) => allFiles.filter((x) => x === f).length > 1);

console.log(`本批期望 id 数：${expectedIds.length}`);
console.log(`已检查文件数：${checked}`);
console.log(`覆盖范围：${expectedIds[0]} … ${expectedIds[expectedIds.length - 1]}`);
console.log(`details 目录现有文件数：${allFiles.length}`);
if (warnings.length) {
  console.log(`\n警告 ${warnings.length} 条:`);
  warnings.slice(0, 40).forEach((w) => console.log('  - ' + w));
}
if (errors.length) {
  console.log(`\n错误 ${errors.length} 条:`);
  errors.forEach((e) => console.log('  - ' + e));
  process.exit(1);
}
console.log('\n全部通过：JSON 合法、id 对齐、必填字段非空、条数与字数符合要求。');
