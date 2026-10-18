// 정책 데이터(JSON) 검증 스크립트 — `npm run validate` (빌드 전에 자동 실행)
// 공고에 맞춰 src/data/*.json 을 고친 뒤 오타·잘못된 참조가 없는지 확인합니다.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const load = (f) => JSON.parse(readFileSync(join(root, f), 'utf8'));

// 판정 조건에서 쓸 수 있는 필드와 값 (src/types.ts, src/data/questions.ts 와 같아야 함)
const FIELDS = {
  bizStatus: ['pre', 'freelancer', 'operating', 'suspended', 'closed'],
  bizAge: ['none', 'lt3m', '3to6m', '6to12m', '1to3y', '3to5y', '5to7y', 'gt7y'],
  industry: ['knowledge-service', 'goods-online', 'manufacturing', 'tech', 'food-retail', 'life-service', 'wholesale-retail', 'other', 'restricted'],
  region: ['seoul', 'busan', 'daegu', 'incheon', 'gwangju', 'daejeon', 'ulsan', 'sejong', 'gyeonggi', 'gangwon', 'chungbuk', 'chungnam', 'jeonbuk', 'jeonnam', 'gyeongbuk', 'gyeongnam', 'jeju'],
  regionGroup: ['capital', 'non-capital'],
  revenue: ['none', 'lt12m', '12mto100m', '100mto300m', '300mto1b', 'gt1b', 'unknown'],
  revenueTrend: ['growing', 'steady', 'irregular', 'declining', 'unknown'],
  employees: ['0', '1to4', '5to9', '10plus'],
  credit: ['lt595', '595to839', '840to964', 'gte965', 'unknown'],
  vulnerable: ['yes', 'no', 'unknown'],
  taxArrears: ['yes', 'no', 'unknown'],
  delinquency: ['none', 'resolved-recent', 'current', 'unknown'],
  debtRelief: ['none', 'in-progress', 'completed', 'unknown'],
  highInterest: ['yes', 'no', 'unknown'],
  currentFinance: ['sbiz-direct', 'regional-guarantee', 'kodit-kibo', 'kosmes', 'none'],
  purposes: ['operating', 'refinance', 'growth', 'crisis', 'new-product', 'idea', 'online', 'restart', 'debt', 'safety', 'digital'],
  flags: ['youth', 'export', 'tops', 'smart-tech', 'strong-sbiz', 'sbiz-repaid', 'ip', 'professional-license', 'research-career', 'career-expert', 'prior-closure', 'disaster', 'relocate-region', 'social-economy', 'field-work', 'parenting', 'none'],
  joined: ['yellow-umbrella', 'emp-insurance', 'accident-insurance', 'none'],
};
const CATEGORIES = ['loan', 'guarantee', 'microfinance', 'debt', 'grant', 'support', 'safety'];

const errors = [];
const err = (where, msg) => errors.push(`✖ ${where}: ${msg}`);

function checkCond(c, where) {
  if (!c || typeof c !== 'object') return err(where, '조건(cond)이 비어 있습니다');
  if ('all' in c || 'any' in c) {
    const list = c.all ?? c.any;
    if (!Array.isArray(list) || !list.length) err(where, 'all/any 목록이 비어 있습니다');
    else list.forEach((x, i) => checkCond(x, `${where}[${i}]`));
    return;
  }
  if ('not' in c) return checkCond(c.not, `${where}.not`);
  const allowed = FIELDS[c.field];
  if (!allowed) return err(where, `알 수 없는 필드 "${c.field}"`);
  for (const key of ['in', 'notIn', 'maybe', 'hasAny']) {
    for (const v of c[key] ?? []) if (!allowed.includes(v)) err(where, `${c.field}.${key}에 없는 값 "${v}"`);
  }
  for (const key of ['has', 'lacks']) if (c[key] && !allowed.includes(c[key])) err(where, `${c.field}.${key}에 없는 값 "${c[key]}"`);
  if ((c.minMonths ?? c.maxMonths) !== undefined && c.field !== 'bizAge') err(where, 'minMonths/maxMonths 는 bizAge 에만 씁니다');
  if ((c.minScore ?? c.maxScore) !== undefined && c.field !== 'credit') err(where, 'minScore/maxScore 는 credit 에만 씁니다');
}

const common = load('common-rules.json');
for (const [k, v] of Object.entries(common)) {
  for (const f of ['label', 'pass', 'fail']) if (!v[f]) err(`common-rules.${k}`, `"${f}"가 없습니다`);
  checkCond(v.cond, `common-rules.${k}.cond`);
}

const programs = load('programs.json');
const ids = new Set();
for (const p of programs) {
  const w = `programs.${p.id ?? '(id 없음)'}`;
  if (!p.id) err(w, 'id가 없습니다');
  if (ids.has(p.id)) err(w, 'id가 중복됩니다');
  ids.add(p.id);
  for (const f of ['name', 'agency', 'chapter', 'soloNote', 'basisLabel', 'summary']) if (!p[f]) err(w, `"${f}"가 없습니다`);
  if (!CATEGORIES.includes(p.category)) err(w, `알 수 없는 category "${p.category}"`);
  if (!['announced', 'proposal'].includes(p.basis)) err(w, `basis 는 announced(확정) 또는 proposal(예정)이어야 합니다`);
  if (!['possible', 'conditional', 'difficult'].includes(p.solo)) err(w, `solo 값 오류 "${p.solo}"`);
  if (!['repay', 'no-repay', 'na'].includes(p.repay)) err(w, `repay 값 오류 "${p.repay}"`);
  if (!p.keyFact?.label || !p.keyFact?.value) err(w, 'keyFact 가 비어 있습니다');
  if (!Array.isArray(p.card) || !p.card.length) err(w, 'card(10항목)가 비어 있습니다');
  for (const x of p.purposes ?? []) if (!FIELDS.purposes.includes(x)) err(w, `알 수 없는 purpose "${x}"`);
  if (!Array.isArray(p.criteria) || !p.criteria.length) err(w, 'criteria(판정 조건)가 비어 있습니다');
  (p.criteria ?? []).forEach((c, i) => {
    if (c.ref) {
      if (!common[c.ref]) err(`${w}.criteria[${i}]`, `공통 조건 "${c.ref}"가 common-rules.json 에 없습니다`);
    } else {
      for (const f of ['label', 'pass', 'fail']) if (!c[f]) err(`${w}.criteria[${i}]`, `"${f}"가 없습니다`);
      checkCond(c.cond, `${w}.criteria[${i}].cond`);
    }
  });
  if (p.apply?.url && !/^https:\/\//.test(p.apply.url)) err(w, `apply.url 은 https:// 로 시작해야 합니다`);
}

// ── 제도별 체크리스트 ──
const lib = load('checklist-library.json');
const REQ = ['stated', 'common', 'confirm'];
const STEPS = ['eligibility', 'documents', 'plan', 'procedure', 'final'];
for (const [k, v] of Object.entries(lib.items)) {
  if (!v.title || !v.source) err(`checklist-library.items.${k}`, 'title·source가 필요합니다 (원고 출처)');
  if (v.site && !lib.sites[v.site]) err(`checklist-library.items.${k}`, `없는 site "${v.site}"`);
  if (v.requirement && !REQ.includes(v.requirement)) err(`checklist-library.items.${k}`, `requirement 값 오류 "${v.requirement}"`);
}
for (const [k, t] of Object.entries(lib.tracks))
  for (const step of ['plan', 'procedure', 'final']) for (const id of t[step]) if (!lib.items[id]) err(`checklist-library.tracks.${k}.${step}`, `없는 항목 "${id}"`);
const pcl = load('program-checklists.json');
const clIds = new Set();
let itemCount = 0;
for (const m of pcl) {
  const w = `program-checklists.${m.programId}`;
  if (!ids.has(m.programId)) err(w, '기존 정책 데이터(programs.json)에 없는 programId');
  if (clIds.has(m.programId)) err(w, 'programId 중복');
  clIds.add(m.programId);
  const prog = programs.find((p) => p.id === m.programId);
  if (prog && prog.category !== m.category) err(w, `category가 programs.json(${prog.category})과 다릅니다`);
  for (const f of ['checklistId', 'title', 'description', 'issuingOrganization', 'sourceReference', 'track']) if (!m[f]) err(w, `"${f}"가 없습니다`);
  if (!['manuscript', 'partial', 'announcement'].includes(m.requiredStatus)) err(w, 'requiredStatus 는 manuscript / partial / announcement');
  if (!lib.tracks[m.track]) err(w, `없는 track "${m.track}"`);
  const seen = new Set();
  for (const d of m.documents) {
    if (!lib.items[d.ref]) err(w, `documents: 없는 항목 "${d.ref}"`);
    if (!REQ.includes(d.requirement)) err(w, `documents.${d.ref}: requirement 값 오류`);
    if (seen.has(d.ref)) err(w, `documents 중복 "${d.ref}"`);
    seen.add(d.ref);
  }
  for (const it of m.items) {
    if (!STEPS.includes(it.step)) err(`${w}.${it.id}`, `step 값 오류 "${it.step}"`);
    if (!REQ.includes(it.requirement)) err(`${w}.${it.id}`, 'requirement 값 오류');
    if (!it.ref && (!it.title || !it.source)) err(`${w}.${it.id}`, 'title·source가 필요합니다');
    if (it.ref && !lib.items[it.ref]) err(`${w}.${it.id}`, `없는 ref "${it.ref}"`);
    if (it.site && !lib.sites[it.site]) err(`${w}.${it.id}`, `없는 site "${it.site}"`);
    if (seen.has(it.id)) err(`${w}.${it.id}`, 'id 중복 (체크 상태 저장 키로 쓰임)');
    seen.add(it.id);
  }
  itemCount += m.documents.length + m.items.length;
}
for (const p of programs) if (!clIds.has(p.id)) err(`program-checklists`, `제도 "${p.id}"의 체크리스트가 없습니다`);
const itemIds = { size: `${pcl.length}개 제도·라이브러리 ${Object.keys(lib.items).length}개 항목·제도별 ${itemCount}개` };

const changes = load('changes2027.json');
for (const r of changes.newPrograms.rows) if (r.programId && !ids.has(r.programId)) err(`changes2027.newPrograms.${r.label}`, `없는 제도 id "${r.programId}"`);
const statusOk = (s) => ['confirmed', 'proposal'].includes(s);
for (const r of [...changes.startupBudget.rows, ...changes.newPrograms.rows, ...changes.kpis, ...changes.comparisons])
  if (!statusOk(r.status2027)) err(`changes2027.${r.label ?? r.area}`, `status2027 은 confirmed(확정) 또는 proposal(예정)이어야 합니다`);

const guide = load('guide.json');
guide.routes.forEach((r) => checkCond(r.cond, `guide.routes.${r.id}`));

if (errors.length) {
  console.error(`\n데이터 검증 실패 (${errors.length}건)\n`);
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`✔ 데이터 검증 통과 — 제도 ${programs.length}개, 체크리스트 ${itemIds.size}, 공통 조건 ${Object.keys(common).length}개`);
