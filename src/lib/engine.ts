import commonRules from '../data/common-rules.json';
import programsData from '../data/programs.json';
import guide from '../data/guide.json';
import type {
  BizAge,
  Cond,
  Credit,
  Criterion,
  CriterionDef,
  CriterionResult,
  EvalProfile,
  LeafCond,
  Match,
  Profile,
  Program,
  Purpose,
  Status,
  Tri,
} from '../types';

export const PROGRAMS = programsData as unknown as Program[];
const COMMON = commonRules as unknown as Record<string, CriterionDef>;

// 업력 구간: [하한, 상한) 개월
const AGE_RANGE: Record<BizAge, [number, number]> = {
  none: [0, 0],
  lt3m: [0, 3],
  '3to6m': [3, 6],
  '6to12m': [6, 12],
  '1to3y': [12, 36],
  '3to5y': [36, 60],
  '5to7y': [60, 84],
  gt7y: [84, Infinity],
};

// 신용평점 구간: [최저점, 최고점] (정수, 양끝 포함)
const CREDIT_RANGE: Record<Exclude<Credit, 'unknown'>, [number, number]> = {
  lt595: [0, 594],
  '595to839': [595, 839],
  '840to964': [840, 964],
  gte965: [965, 1000],
};

const CAPITAL = ['seoul', 'gyeonggi', 'incheon'];

export function toEvalProfile(p: Profile): EvalProfile {
  return {
    ...p,
    regionGroup: p.region ? (CAPITAL.includes(p.region) ? 'capital' : 'non-capital') : undefined,
  };
}

const and = (xs: Tri[]): Tri => (xs.includes('fail') ? 'fail' : xs.includes('unknown') ? 'unknown' : 'pass');
const or = (xs: Tri[]): Tri => (xs.includes('pass') ? 'pass' : xs.includes('unknown') ? 'unknown' : 'fail');
const applyThen = (r: Tri, then?: 'pass' | 'unknown'): Tri => (r === 'pass' && then ? then : r);

function evalLeaf(c: LeafCond, p: EvalProfile): Tri {
  const v = p[c.field];
  let r: Tri;

  if (Array.isArray(v) || c.has || c.hasAny || c.lacks) {
    const arr = (Array.isArray(v) ? v : []) as string[];
    if (c.has) r = arr.includes(c.has) ? 'pass' : 'fail';
    else if (c.hasAny) r = c.hasAny.some((x) => arr.includes(x)) ? 'pass' : 'fail';
    else if (c.lacks) r = arr.includes(c.lacks) ? 'fail' : 'pass';
    else r = 'unknown';
    return applyThen(r, c.then);
  }

  // '모르겠어요'는 확인 필요, 질문 자체가 해당되지 않아 응답이 없는 경우(예: 예비창업자의 매출)는 미충족
  if (v === 'unknown') return 'unknown';
  if (v === undefined) return 'fail';
  const s = String(v);
  if (c.maybe?.includes(s)) return 'unknown';

  if (c.minMonths !== undefined || c.maxMonths !== undefined) {
    const [lo, hi] = AGE_RANGE[s as BizAge] ?? [NaN, NaN];
    const parts: Tri[] = [];
    // 업력 0개월(등록 전)은 하한 비교에서 미충족, 상한 비교에서 충족
    if (c.minMonths !== undefined) parts.push(lo >= c.minMonths ? 'pass' : hi <= c.minMonths ? 'fail' : 'unknown');
    if (c.maxMonths !== undefined) parts.push(hi <= c.maxMonths ? 'pass' : lo >= c.maxMonths ? 'fail' : 'unknown');
    return applyThen(and(parts), c.then);
  }

  if (c.minScore !== undefined || c.maxScore !== undefined) {
    const range = CREDIT_RANGE[s as Exclude<Credit, 'unknown'>];
    if (!range) return 'unknown';
    const [lo, hi] = range;
    const parts: Tri[] = [];
    if (c.minScore !== undefined) parts.push(lo >= c.minScore ? 'pass' : hi < c.minScore ? 'fail' : 'unknown');
    if (c.maxScore !== undefined) parts.push(hi <= c.maxScore ? 'pass' : lo > c.maxScore ? 'fail' : 'unknown');
    return applyThen(and(parts), c.then);
  }

  if (c.in) r = c.in.includes(s) ? 'pass' : 'fail';
  else if (c.notIn) r = c.notIn.includes(s) ? 'fail' : 'pass';
  else r = 'unknown';
  return applyThen(r, c.then);
}

export function evalCond(c: Cond, p: EvalProfile): Tri {
  if ('all' in c) return applyThen(and(c.all.map((x) => evalCond(x, p))), c.then);
  if ('any' in c) return applyThen(or(c.any.map((x) => evalCond(x, p))), c.then);
  if ('not' in c) {
    const r = evalCond(c.not, p);
    return r === 'pass' ? 'fail' : r === 'fail' ? 'pass' : 'unknown';
  }
  return evalLeaf(c, p);
}

export function resolveCriterion(c: Criterion): CriterionDef & { common: boolean } {
  if ('ref' in c) {
    const base = COMMON[c.ref];
    if (!base) throw new Error(`공통 조건을 찾을 수 없습니다: ${c.ref}`);
    return { ...base, soft: c.soft ?? base.soft, common: true };
  }
  return { ...c, common: false };
}

function evaluateProgram(program: Program, profile: EvalProfile): Match {
  const criteria: CriterionResult[] = program.criteria.map((raw) => {
    const def = resolveCriterion(raw);
    let result = evalCond(def.cond, profile);
    // soft: 지역·상품별로 기준이 달라 미충족으로 단정할 수 없는 조건
    if (result === 'fail' && def.soft) result = 'unknown';
    const text =
      result === 'pass' ? def.pass : result === 'fail' ? def.fail : def.unknown ?? def.fail;
    return { label: def.label, result, text, common: def.common };
  });

  const failures = criteria.filter((c) => c.result === 'fail').map((c) => c.text);
  const unknowns = criteria.filter((c) => c.result === 'unknown').map((c) => c.text);

  let status: Status = failures.length ? 'ineligible' : unknowns.length ? 'check' : 'eligible';
  if (status === 'eligible' && program.needsAnnouncement) status = 'check';

  const purposeHits = (program.purposes ?? []).filter((x) => profile.purposes?.includes(x)) as Purpose[];
  const purposeLabels = guide.purposeLabels as Record<string, string>;

  const reasons: string[] = [];
  for (const x of purposeHits) reasons.push(`자금 목적 "${purposeLabels[x]}"과 연결되는 제도`);
  for (const c of criteria) if (c.result === 'pass' && !c.common) reasons.push(c.text);
  const commonPassed = criteria.filter((c) => c.result === 'pass' && c.common);
  if (commonPassed.length) reasons.push(commonPassed.map((c) => c.text.split(' (')[0].split(' — ')[0]).join(' · '));

  const checks = [...unknowns];
  if (program.needsAnnouncement)
    checks.push(
      program.isNew2027
        ? '2027년 신설 사업 — 대상·금액·신청 방법은 공고에서 확정됩니다'
        : '세부 조건이 지역·상품별로 달라 공고 원문 확인이 필요합니다',
    );
  for (const x of program.checks) if (!checks.includes(x)) checks.push(x);

  const joined = profile.joined ?? [];
  if (
    (program.id === 'yellow-umbrella' && joined.includes('yellow-umbrella')) ||
    (program.id === 'emp-insurance' && joined.includes('emp-insurance')) ||
    (program.id === 'accident-insurance' && joined.includes('accident-insurance'))
  )
    reasons.unshift('이미 가입 중 — 납입액·등급과 지자체 지원을 점검해 보세요');

  const statusWeight = { eligible: 300, check: 200, ineligible: 0 }[status];
  const score = statusWeight + purposeHits.length * 40 + (program.priority ?? 0) * 3;

  return { program, status, reasons, checks, failures, purposeHits, score, criteria };
}

export function matchAll(profile: Profile): Match[] {
  const p = toEvalProfile(profile);
  return PROGRAMS.map((prog) => evaluateProgram(prog, p)).sort((a, b) => b.score - a.score);
}

export function matchOne(profile: Profile, id: string): Match | undefined {
  const prog = PROGRAMS.find((x) => x.id === id);
  return prog ? evaluateProgram(prog, toEvalProfile(profile)) : undefined;
}

/**
 * 우선 추천: 기본 조건 부합 + 자금 목적과 연결 (부족하면 추가 확인 필요 중 목적 연결).
 * 고른 자금 목적마다 가장 점수가 높은 제도를 하나씩 먼저 뽑아 한 목적에 몰리지 않게 합니다.
 */
export function topPicks(matches: Match[], n = 3): Match[] {
  const strong = matches.filter((m) => m.status === 'eligible' && m.purposeHits.length);
  const pool = strong.length >= n ? strong : [...strong, ...matches.filter((m) => m.status === 'check' && m.purposeHits.length)];
  const picks: Match[] = [];
  const purposes = [...new Set(pool.flatMap((m) => m.purposeHits))];
  for (const purpose of purposes) {
    const best = pool.find((m) => m.purposeHits.includes(purpose) && !picks.includes(m));
    if (best && picks.length < n) picks.push(best);
  }
  for (const m of pool) if (picks.length < n && !picks.includes(m)) picks.push(m);
  return picks.sort((a, b) => b.score - a.score);
}

/** 원고 3장 "사업자 상태별 지원 가능 여부" 표에서 내 행 */
export function statusRowId(p: Profile): string | undefined {
  switch (p.bizStatus) {
    case 'pre':
    case 'freelancer':
      return 'pre';
    case 'suspended':
      return 'suspended';
    case 'closed':
      return 'closed';
    case 'operating':
      if (!p.bizAge) return undefined;
      if (['lt3m', '3to6m', '6to12m'].includes(p.bizAge)) return 'new';
      if (p.bizAge === '1to3y') return '1to3';
      if (p.bizAge === '3to5y' || p.bizAge === '5to7y') return '3to7';
      return 'gt7';
  }
  return undefined;
}

export interface Alert {
  tone: 'warn' | 'info';
  title: string;
  body: string;
}

/** 원고 3장 5분 자가진단과 PART 2 공통 제한에서 나오는 "먼저 할 일" */
export function alertsFor(p: Profile): Alert[] {
  const out: Alert[] = [];
  if (p.taxArrears === 'yes' || p.delinquency === 'current' || p.delinquency === 'resolved-recent')
    out.push({
      tone: 'warn',
      title: '체납·연체 정리가 먼저입니다',
      body: '대부분의 정책자금은 체납·연체가 있으면 신청할 수 없습니다. 소액 세금까지 납부하고, 연체를 해소했다면 제한 기간(최근 3개월)이 지난 뒤 신청하세요.',
    });
  if (p.debtRelief === 'in-progress')
    out.push({
      tone: 'warn',
      title: '채무조정·회생 진행 중에는 일반 자금이 어렵습니다',
      body: '절차를 성실히 마치는 것이 다시 시작할 자격을 만듭니다. 완료 후에는 재도전지원특례보증이 다음 단계가 됩니다.',
    });
  if (p.highInterest === 'yes')
    out.push({
      tone: 'info',
      title: '연 7% 이상 대출이 있다면 대환대출부터',
      body: '새로 빌리는 돈이 아니라 비싼 이자를 싼 이자(연 4.5% 고정)로 바꾸는 제도라, 신청만 해도 매달 나가는 돈이 줄어듭니다.',
    });
  if (p.bizStatus === 'pre' && p.flags?.some((f) => ['professional-license', 'research-career', 'ip'].includes(f)))
    out.push({
      tone: 'info',
      title: '사업자등록을 미루고 먼저 상담하세요',
      body: '신보·기보의 예비창업자 보증은 사업자등록 전에만 신청할 수 있습니다. 해당될 것 같다면 등록 전에 상담을 시작하세요.',
    });
  if (p.bizStatus === 'freelancer')
    out.push({
      tone: 'info',
      title: '정책자금과 보증은 사업자등록이 있어야 합니다',
      body: '사업자등록 없이 3.3%를 떼고 받는 프리랜서 소득은 "사업자"로 보지 않는 제도가 대부분입니다. 사업자등록부터 검토하세요. 다만 예비창업자 트랙은 동일 업종 경력을 보기도 하니 공고의 정의를 확인하세요.',
    });
  if (p.bizStatus === 'closed' || p.bizStatus === 'suspended')
    out.push({
      tone: 'info',
      title: '휴업·폐업 상태라면 재기 트랙이 먼저입니다',
      body: '일반 자금보다 희망리턴패키지와 재도전 트랙을 먼저 보세요. 정책자금 대출이 남아 있다면 폐업 신고 전에 대출 기관에 먼저 문의하세요.',
    });
  return out;
}

export const statusLabel: Record<Status, string> = {
  eligible: '기본 조건 부합',
  check: '추가 확인 필요',
  ineligible: '조건 미충족',
};
