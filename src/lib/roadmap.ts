import rules from '../data/roadmap-rules.json';
import { alertsFor, evalCond, matchAll, toEvalProfile } from './engine';
import { buildChecklist, progressOf, type Progress } from './checklists';
import type { Cond, Match, Profile } from '../types';

// ─────────────────────────────────────────────
// 규칙 타입 (src/data/roadmap-rules.json)
// ─────────────────────────────────────────────
export type LaneId = 'pre' | 'refinance' | 'business' | 'finance' | 'growth' | 'microfinance' | 'restart' | 'debt' | 'safety';
export type OverlapType = 'same-tier-institution' | 'simultaneous-application' | 'simultaneous-selection' | 'same-cost' | 'reapplication' | 'unverified';

export interface RoadmapRule {
  lane: LaneId;
  overlapGroup: 'guarantee' | 'direct-loan' | 'startup-grant' | null;
  priorityReason: string;
  eligibilityStatus: 'diagnosis';
  applicationDeadline: { type: 'rolling' | 'window' | 'event' | 'announcement'; reference: string };
  prerequisitePrograms: { programId: string; relation: 'required' | 'conditional'; text: string }[];
  prerequisiteConditions: string[];
  parallelApplicationStatus: { status: 'parallel' | 'sequential' | 'confirm'; text: string };
  overlapRestrictions: { type: OverlapType; text: string }[];
  estimatedPreparationSteps: string[];
  sourceReference: string;
  verificationStatus: 'manuscript' | 'partial' | 'announcement';
}

export const RULES = rules.programs as unknown as Record<string, RoadmapRule>;
export const LANES = rules.lanes as Record<LaneId, { label: string; art: string }>;
export const OVERLAP_LABEL = rules.overlapTypes as Record<OverlapType, string>;
const REASONS = rules.orderingReasons as Record<string, { text: string; source: string }>;

// ─────────────────────────────────────────────
// 결과 타입
// ─────────────────────────────────────────────
export type Recommendation = 'recommended' | 'review' | 'conditional';
export type RelationTag = 'first' | 'parallel' | 'conditional' | 'overlap' | 'overlap-unverified' | 'announcement';

export const RELATION_LABEL: Record<RelationTag, string> = {
  first: '선행 조건 있음',
  parallel: '동시에 준비 가능',
  conditional: '조건부로 이어짐',
  overlap: '중복수혜 확인 필요',
  'overlap-unverified': '중복 제한 확인 필요',
  announcement: '공고 확인 후 결정',
};

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  recommended: '추천',
  review: '추가 확인 후 검토',
  conditional: '조건 충족 시 검토',
};

export interface RoadmapItem {
  match: Match;
  rule: RoadmapRule;
  recommendation: Recommendation;
  tags: RelationTag[];
  /** 로드맵 안에 있는 선행 제도 (이름 포함) */
  prerequisites: { programId: string; name: string; relation: 'required' | 'conditional'; text: string; inRoadmap: boolean }[];
  unlockText?: string;
  progress: Progress;
}

export interface Lane {
  id: LaneId;
  label: string;
  items: RoadmapItem[];
}

export interface Phase {
  id: 'basics' | 'blocker' | 'pre' | 'post-registration' | 'refinance' | 'main' | 'after-blocker' | 'conditional' | 'announcement';
  no: number;
  title: string;
  reasons: { text: string; source: string }[];
  lanes: Lane[];
  /** STEP 1 처럼 제도가 아닌 확인 항목 */
  tasks?: { id: string; title: string; source: string; site?: string }[];
  warnings?: string[];
}

export interface TrackType {
  id: string;
  label: string;
  desc: string;
  source: string;
}

export interface Roadmap {
  primary: TrackType;
  secondary: TrackType[];
  firstActions: { text: string; to?: string }[];
  phases: Phase[];
  overlapWarnings: { type: OverlapType; text: string; programs: string[] }[];
  excluded: number;
}

const LANE_ORDER: LaneId[] = ['restart', 'business', 'finance', 'growth', 'microfinance', 'safety'];

function trackTypes(profile: Profile): TrackType[] {
  const ep = toEvalProfile(profile);
  return (rules.trackTypes as unknown as (TrackType & { cond: Cond })[])
    .filter((t) => evalCond(t.cond, ep) === 'pass')
    .map(({ cond: _cond, ...t }) => t);
}

export function buildRoadmap(profile: Profile): Roadmap {
  const matches = matchAll(profile);
  const byId = new Map(matches.map((m) => [m.program.id, m]));
  const types = trackTypes(profile);
  const typeIds = new Set(types.map((t) => t.id));
  const isPre = profile.bizStatus === 'pre' || profile.bizStatus === 'freelancer';
  const hasBlocker =
    profile.taxArrears === 'yes' || profile.delinquency === 'current' || profile.delinquency === 'resolved-recent' || profile.debtRelief === 'in-progress';

  // 1) 포함할 제도: 조건 미충족은 제외, 목적과 연결되거나 트랙에 해당하는 제도만
  const included = matches.filter((m) => {
    if (m.status === 'ineligible') return false;
    const rule = RULES[m.program.id];
    if (!rule) return false;
    if (m.purposeHits.length) return true;
    if (rule.lane === 'safety') return true;
    if (rule.lane === 'restart' && typeIds.has('restart')) return true;
    if (rule.lane === 'pre' && isPre) return true;
    if (rule.lane === 'refinance' && profile.highInterest === 'yes') return true;
    if (rule.lane === 'debt' && hasBlocker) return true;
    return false;
  });
  const includedIds = new Set(included.map((m) => m.program.id));

  // 2) 조건부로 이어지는 제도 (원고에 명시된 경우만): 실패한 조건이 모두 "선행 조건"일 때
  const failedLabels = (m: Match) => m.criteria.filter((c) => c.result === 'fail').map((c) => c.label);
  const onlyFails = (m: Match, allowed: string[]) => {
    const f = failedLabels(m);
    return f.length > 0 && f.every((x) => allowed.includes(x));
  };
  type UnlockPhase = 'conditional' | 'post-registration' | 'after-blocker';
  const unlocked: { match: Match; text: string; phase: UnlockPhase }[] = [];
  const triggers: Record<string, boolean> = {
    'debt-relief-in-progress': profile.debtRelief === 'in-progress',
    'pre-registration': isPre,
  };
  for (const u of rules.unlocks as { after?: string; afterCondition?: string; programId: string; failingCriteria: string[]; phase: UnlockPhase; text: string }[]) {
    const m = byId.get(u.programId);
    if (!m || includedIds.has(u.programId) || m.status !== 'ineligible') continue;
    const triggered = u.after ? includedIds.has(u.after) : !!triggers[u.afterCondition ?? ''];
    if (triggered && onlyFails(m, u.failingCriteria)) unlocked.push({ match: m, text: u.text, phase: u.phase });
  }
  // 체납·연체만 정리하면 검토할 수 있는 제도 (자금 목적과 연결된 것만)
  if (hasBlocker) {
    const bu = rules.blockerUnlock as { failingCriteria: string[]; text: string };
    for (const m of matches) {
      if (m.status !== 'ineligible' || includedIds.has(m.program.id) || unlocked.some((u) => u.match.program.id === m.program.id)) continue;
      const relevant = m.purposeHits.length > 0 || (m.program.id === 'sbiz-refinance' && profile.highInterest === 'yes');
      if (relevant && RULES[m.program.id] && onlyFails(m, bu.failingCriteria)) unlocked.push({ match: m, text: bu.text, phase: 'after-blocker' });
    }
  }
  const allIds = new Set([...includedIds, ...unlocked.map((u) => u.match.program.id)]);

  const toItem = (m: Match, recommendation?: Recommendation, unlockText?: string): RoadmapItem => {
    const rule = RULES[m.program.id];
    const rec: Recommendation = recommendation ?? (m.status === 'eligible' ? 'recommended' : 'review');
    const prerequisites = rule.prerequisitePrograms.map((p) => ({
      ...p,
      name: byId.get(p.programId)?.program.name ?? p.programId,
      inRoadmap: allIds.has(p.programId),
    }));
    const tags: RelationTag[] = [];
    if (rule.prerequisiteConditions.length || prerequisites.some((p) => p.relation === 'required')) tags.push('first');
    if (rule.parallelApplicationStatus.status === 'parallel') tags.push('parallel');
    if (rec === 'conditional' || prerequisites.some((p) => p.relation === 'conditional' && p.inRoadmap)) tags.push('conditional');
    if (rule.overlapRestrictions.some((o) => o.type !== 'unverified' && o.type !== 'simultaneous-application')) tags.push('overlap');
    else tags.push('overlap-unverified');
    if (rule.verificationStatus === 'announcement' || m.program.isNew2027) tags.push('announcement');
    const cl = buildChecklist(m.program.id);
    return {
      match: m,
      rule,
      recommendation: rec,
      tags,
      prerequisites,
      unlockText,
      progress: cl ? progressOf(cl) : { done: 0, total: 0, confirmDone: 0, confirmTotal: 0, pct: 0, started: false },
    };
  };

  const items = included.map((m) => toItem(m));
  const take = (pred: (it: RoadmapItem) => boolean) => {
    const out: RoadmapItem[] = [];
    for (let i = items.length - 1; i >= 0; i--) if (pred(items[i])) out.unshift(...items.splice(i, 1));
    return out;
  };

  const phases: Omit<Phase, 'no'>[] = [];
  const registered = !isPre;

  // STEP: 자격·제한사항 확인 (항상 먼저)
  phases.push({
    id: 'basics',
    title: '신청 자격과 제한사항 확인',
    reasons: [REASONS.basics],
    lanes: [],
    tasks: (rules.basics as { id: string; title: string; source: string; site?: string; registeredOnly: boolean }[]).filter((t) => registered || !t.registeredOnly),
  });

  // STEP: 체납·연체·채무 정리
  if (hasBlocker) {
    const debt = take((it) => it.rule.lane === 'debt');
    phases.push({
      id: 'blocker',
      title: '체납·연체·채무 먼저 정리',
      reasons: [REASONS.blocker],
      lanes: debt.length ? [{ id: 'debt', label: LANES.debt.label, items: debt }] : [],
      warnings: alertsFor(profile)
        .filter((a) => a.tone === 'warn')
        .map((a) => `${a.title} — ${a.body}`),
    });
  } else take((it) => it.rule.lane === 'debt');

  // STEP: 사업자등록 전에만 가능한 것
  if (isPre) {
    const pre = take((it) => it.rule.lane === 'pre' || it.match.program.id === 'modoo' || it.match.program.id === 'miso-startup');
    phases.push({
      id: 'pre',
      title: '사업자등록 전에 할 것',
      reasons: [REASONS.pre],
      lanes: pre.length ? [{ id: 'pre', label: LANES.pre.label, items: pre }] : [],
      tasks: [{ id: 'rb-regdate', title: '사업자등록 시점 정하기 — 모두의 창업 접수 마감 전에 등록하지 않기, 초기창업패키지 준비 시간을 고려해 연초 공고 일정에 맞추기', source: '원고 12장 3절' }],
    });
  }

  // STEP: 사업자등록 후 이어서 (원고 12장 3절)
  const postReg = unlocked.filter((u) => u.phase === 'post-registration').map((u) => toItem(u.match, 'conditional', u.text));
  if (postReg.length)
    phases.push({ id: 'post-registration', title: '사업자등록 후 이어서 할 것', reasons: [REASONS['post-registration']], lanes: [{ id: 'finance', label: '등록하면 신청할 수 있는 제도', items: postReg }] });

  // STEP: 이자 부담 줄이기
  const refi = take((it) => it.rule.lane === 'refinance');
  if (refi.length) phases.push({ id: 'refinance', title: '비싼 이자부터 줄이기', reasons: [REASONS.refinance], lanes: [{ id: 'refinance', label: LANES.refinance.label, items: refi }] });

  // 공고 확인 후 결정 / 조건부 단계로 보낼 제도를 먼저 분리
  const announce = take((it) => !!it.match.program.isNew2027);
  const conditional = take(
    (it) => it.rule.parallelApplicationStatus.status === 'sequential' && it.prerequisites.some((p) => p.relation === 'conditional' && p.inRoadmap),
  );
  conditional.forEach((it) => !it.tags.includes('conditional') && it.tags.push('conditional'));

  // STEP: 함께 준비할 수 있는 제도 (병렬 레인)
  const purposes = new Set(profile.purposes ?? []);
  const grantFirst = ['new-product', 'idea', 'online'].some((p) => purposes.has(p as never));
  const financeFirst = purposes.has('operating');
  // 레인은 나란히(병렬) 표시하고, 화면상 순서만 자금 목적에 맞춥니다
  const order: LaneId[] = financeFirst && !grantFirst ? ['restart', 'finance', 'business', 'growth', 'microfinance', 'safety'] : LANE_ORDER;
  const lanes: Lane[] = order
    .map((id) => ({ id, label: LANES[id].label, items: sortLane(items.filter((it) => it.rule.lane === id)) }))
    .filter((l) => l.items.length);
  const mainReasons = [REASONS.main];
  if (grantFirst) mainReasons.push(REASONS['main-grant-first']);
  if (financeFirst) mainReasons.push(REASONS['main-finance-first']);
  if (lanes.length) phases.push({ id: 'main', title: '함께 준비할 수 있는 제도', reasons: mainReasons, lanes });

  // STEP: 체납·연체 정리 후 다시 검토
  // 목록이 길어지지 않게 점수 상위 6개만 (나머지는 전체 판정 결과에서 확인)
  const afterBlocker = unlocked
    .filter((u) => u.phase === 'after-blocker')
    .slice(0, 6)
    .map((u) => toItem(u.match, 'conditional', u.text));
  if (afterBlocker.length)
    phases.push({ id: 'after-blocker', title: '체납·연체 정리 후 다시 검토', reasons: [REASONS['after-blocker']], lanes: [{ id: 'finance', label: '정리 후 검토할 제도', items: afterBlocker }] });

  // STEP: 조건이 충족되면 이어지는 단계
  const condItems = [...conditional, ...unlocked.filter((u) => u.phase === 'conditional').map((u) => toItem(u.match, 'conditional', u.text))];
  if (condItems.length) phases.push({ id: 'conditional', title: '조건이 충족되면 이어서 검토', reasons: [REASONS.conditional], lanes: [{ id: 'growth', label: '앞 단계 결과에 따라', items: condItems }] });

  // STEP: 공고 확인 후 결정
  if (announce.length) phases.push({ id: 'announcement', title: '2027 공고 확인 후 결정', reasons: [REASONS.announcement], lanes: [{ id: 'business', label: '2027 신설·예산안 사업', items: announce }] });

  const numbered = phases.map((p, i) => ({ ...p, no: i + 1 }));

  // 중복수혜 경고: 원고에 근거가 있는 그룹만
  const all = numbered.flatMap((p) => p.lanes.flatMap((l) => l.items)).filter((it) => it.recommendation !== 'conditional');
  const group = (g: RoadmapRule['overlapGroup']) => all.filter((it) => it.rule.overlapGroup === g).map((it) => it.match.program.name);
  const overlapWarnings: Roadmap['overlapWarnings'] = [];
  const guar = group('guarantee');
  if (guar.length >= 2)
    overlapWarnings.push({ type: 'same-tier-institution', programs: guar, text: '보증기관끼리(지역신보·신보·기보)는 동시에 이용하기 어렵습니다. 처음 어느 기관에서 시작하느냐가 이후 선택지를 좌우하니 하나를 먼저 고르세요. (원고 PART 2 들어가기 전에, 5장 5절)' });
  const direct = group('direct-loan');
  if (direct.length >= 2)
    overlapWarnings.push({ type: 'same-tier-institution', programs: direct, text: '소진공·중진공처럼 기관이 직접 빌려주는 곳끼리는 동시에 이용하기 어렵습니다. 직접대출 하나와 보증 하나는 함께 이용할 수 있습니다. (원고 PART 2 들어가기 전에)' });
  const grants = group('startup-grant');
  if (grants.length >= 2) {
    overlapWarnings.push({ type: 'simultaneous-selection', programs: grants, text: '같은 해 비슷한 창업지원사업 두 곳에 신청하는 것은 가능한 경우가 많지만, 동시에 선정되면 하나만 협약하는 경우가 대부분입니다. (원고 8장 2절, 13장 1절)' });
  }
  const costPrograms = all.filter((it) => it.rule.overlapRestrictions.some((o) => o.type === 'same-cost')).map((it) => it.match.program.name);
  if (costPrograms.length >= 2)
    overlapWarnings.push({ type: 'same-cost', programs: costPrograms, text: '같은 비용(예: 상세페이지 제작비)을 두 사업에서 정산하면 이중 보조로 양쪽 모두 환수·참여 제한 대상입니다. 비용을 나눠 각각 다른 계약과 증빙으로 집행하세요. (원고 13장 1절)' });

  // 가장 먼저 확인할 사항
  const firstActions: Roadmap['firstActions'] = [];
  const blockerAlert = alertsFor(profile).find((a) => a.tone === 'warn');
  if (blockerAlert) firstActions.push({ text: blockerAlert.title });
  if (isPre) firstActions.push({ text: '사업자등록 시점부터 정하기 — 등록 전에만 가능한 지원이 있습니다' });
  const firstRefi = numbered.find((p) => p.id === 'refinance')?.lanes[0]?.items[0];
  if (firstRefi) firstActions.push({ text: `연 7% 이상 대출 목록을 뽑고 ${firstRefi.match.program.name} 확인`, to: `/checklist/${firstRefi.match.program.id}` });
  if (firstActions.length < 3) firstActions.push({ text: 'STEP 1: 체납 조회·이용 중인 대출과 보증 정리' });
  const firstRecommended = numbered
    .filter((p) => p.id !== 'conditional' && p.id !== 'announcement')
    .flatMap((p) => p.lanes.flatMap((l) => l.items))
    .find((it) => it.recommendation === 'recommended' && it.rule.lane !== 'safety');
  if (firstRecommended && firstActions.length < 3)
    firstActions.push({ text: `${firstRecommended.match.program.name} 신청 준비 시작`, to: `/checklist/${firstRecommended.match.program.id}` });
  const safetyNow = all.find((it) => it.rule.lane === 'safety' && it.recommendation === 'recommended' && !it.match.reasons[0]?.startsWith('이미 가입'));
  if (safetyNow && firstActions.length < 3) firstActions.push({ text: `${safetyNow.match.program.name}는 지금 바로 가입할 수 있어요`, to: `/checklist/${safetyNow.match.program.id}` });

  const shown = new Set(numbered.flatMap((p) => p.lanes.flatMap((l) => l.items.map((it) => it.match.program.id))));
  const fallback: TrackType = { id: 'general', label: '맞춤 검토 트랙', desc: '진단 결과에 따라 볼 만한 제도를 단계별로 정리했습니다.', source: '원고 3장' };

  return {
    primary: types[0] ?? fallback,
    secondary: types.slice(1),
    firstActions: firstActions.slice(0, 3),
    phases: numbered,
    overlapWarnings,
    excluded: matches.filter((m) => m.status !== 'ineligible' && !shown.has(m.program.id)).length,
  };
}

/** 레인 안 정렬: 추천 → 추가 확인, 같은 레인의 필수 선행 제도 바로 뒤에 후속 제도 */
function sortLane(list: RoadmapItem[]): RoadmapItem[] {
  const sorted = [...list].sort((a, b) => b.match.score - a.match.score);
  const out: RoadmapItem[] = [];
  const pending = [...sorted];
  while (pending.length) {
    const it = pending.shift()!;
    if (out.includes(it)) continue;
    const req = it.prerequisites.find((p) => p.relation === 'required' && sorted.some((x) => x.match.program.id === p.programId));
    if (req && !out.some((x) => x.match.program.id === req.programId)) {
      const pre = sorted.find((x) => x.match.program.id === req.programId)!;
      out.push(pre);
      pending.splice(pending.indexOf(pre), 1);
    }
    out.push(it);
  }
  return out;
}

/** 로드맵 STEP 1 확인 항목 저장 */
const BASICS_KEY = 'pn2027:roadmap-basics';
export function readBasics(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(BASICS_KEY) ?? '{}');
  } catch {
    return {};
  }
}
export function writeBasics(v: Record<string, boolean>) {
  try {
    localStorage.setItem(BASICS_KEY, JSON.stringify(v));
  } catch {
    /* noop */
  }
}
