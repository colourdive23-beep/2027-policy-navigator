import { useCallback, useEffect, useState } from 'react';
import library from '../data/checklist-library.json';
import programChecklists from '../data/program-checklists.json';
import commonRules from '../data/common-rules.json';
import { PROGRAMS } from './engine';
import type { CategoryId, Program } from '../types';

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────

/** stated: 원고에 이 제도(절차)의 준비사항으로 명시 / common: 원고의 유형별 공통 서류(제출 여부 확인 필요) / confirm: 공식 공고 확인 필요 */
export type Requirement = 'stated' | 'common' | 'confirm';
export type StepId = 'eligibility' | 'documents' | 'plan' | 'procedure' | 'final';

export interface CLItem {
  id: string;
  title: string;
  /** 이 제도에 해당하는 조건 문구 (원고 10항목 카드 등) */
  condition?: string;
  why?: string;
  how?: string;
  where?: string;
  siteName?: string;
  url?: string;
  caution?: string;
  note?: string;
  source: string;
  requirement: Requirement;
}

export interface CLStep {
  id: StepId;
  no: number;
  title: string;
  desc: string;
  items: CLItem[];
}

export interface ProgramChecklistMeta {
  programId: string;
  checklistId: string;
  category: CategoryId;
  title: string;
  description: string;
  requiredStatus: 'manuscript' | 'partial' | 'announcement';
  issuingOrganization: string;
  officialUrl: string;
  sourceReference: string;
  track: string;
  documents: { ref: string; requirement: Requirement; note?: string }[];
  items: (Partial<CLItem> & { id: string; step: StepId; ref?: string; requirement: Requirement })[];
}

export interface BuiltChecklist {
  meta: ProgramChecklistMeta;
  program: Program;
  trackLabel: string;
  steps: CLStep[];
  /** 진행률 계산용: 준비 항목(원고 명시·공통)과 공고 확인 항목 */
  actionableIds: string[];
  confirmIds: string[];
}

type LibItem = { title: string; why?: string; how?: string; where?: string; site?: string; caution?: string; source: string; requirement?: Requirement };

const LIB = library.items as Record<string, LibItem>;
const SITES = library.sites as Record<string, { name: string; url: string }>;
const TRACKS = library.tracks as unknown as Record<string, { label: string; plan: string[]; procedure: string[]; final: string[] }>;
const RULES = commonRules as Record<string, { label: string; fail: string }>;
export const PROGRAM_CHECKLISTS = programChecklists as unknown as ProgramChecklistMeta[];

export const STEP_INFO: Record<StepId, { no: number; title: string; desc: string }> = {
  eligibility: { no: 1, title: '신청 자격 확인', desc: '이 제도의 10항목 카드에 적힌 요건만 표시합니다.' },
  documents: { no: 2, title: '필요 서류 준비', desc: '원고에 명시된 서류와 유형별 공통 서류를 구분해 표시합니다.' },
  plan: { no: 3, title: '사업계획 및 신청 내용 준비', desc: '' },
  procedure: { no: 4, title: '신청 절차 확인', desc: '이 제도의 실제 신청 순서를 따릅니다.' },
  final: { no: 5, title: '제출 전 최종 점검', desc: '원고 15장 "신청 버튼 누르기 전 마지막 점검"을 기준으로 합니다.' },
};

export const REQUIREMENT_LABEL: Record<Requirement, string> = {
  stated: '원고 명시',
  common: '공통 서류 · 제출 여부 확인 필요',
  confirm: '공식 공고 확인 필요',
};

function fromLibrary(id: string, requirement?: Requirement): CLItem {
  const it = LIB[id];
  if (!it) throw new Error(`체크리스트 라이브러리 항목을 찾을 수 없습니다: ${id}`);
  const site = it.site ? SITES[it.site] : undefined;
  return {
    id,
    title: it.title,
    why: it.why,
    how: it.how,
    where: it.where ?? site?.name,
    siteName: site?.name,
    url: site?.url,
    caution: it.caution,
    source: it.source,
    requirement: requirement ?? it.requirement ?? 'stated',
  };
}

const needsConfirm = (v: string) => /공고 확인|공고에서|상이|확정|정해짐|공고 전|정해지지/.test(v);

// ─────────────────────────────────────────────
// STEP 1: 10항목 카드 + 판정 조건에서 자격 항목 생성
// ─────────────────────────────────────────────
function eligibilityItems(program: Program): CLItem[] {
  const card = (label: string) => program.card.find((r) => r.label === label)?.value;
  const refs = new Set(program.criteria.flatMap((c) => ('ref' in c ? [c.ref] : [])));
  const cardSource = `원고 ${program.chapter} (10항목 카드)`;
  const out: CLItem[] = [];

  const solo = card('1인사업자');
  if (solo)
    out.push({ id: 'el-solo', title: '1인사업자 신청 가능 여부', condition: solo, source: cardSource, requirement: needsConfirm(solo) ? 'confirm' : 'stated' });

  if (refs.has('registered'))
    out.push({
      id: 'el-registered',
      title: '사업자등록 여부',
      condition: RULES.registered.fail,
      how: '사업자등록증명으로 등록 상태와 개업일을 확인합니다. 3.3% 원천징수 프리랜서는 대부분의 제도에서 "사업자"로 보지 않습니다.',
      where: '홈택스',
      siteName: SITES.hometax.name,
      url: SITES.hometax.url,
      source: '원고 4장 1절, 12장 3절',
      requirement: 'stated',
    });

  const age = card('업력 조건');
  if (age)
    out.push({
      id: 'el-age',
      title: '업력 조건',
      condition: age,
      how: '사업자등록증명에 적힌 개업일을 기준으로, 공고문의 "기준일" 문구(공고일·신청일 등)를 찾아 달력에 직접 세어 봅니다.',
      caution: '개인사업자에서 법인으로 전환했다면 업력을 어느 날부터 세는지 공고마다 다릅니다.',
      source: `${cardSource}, 15장 2절`,
      requirement: needsConfirm(age) ? 'confirm' : 'stated',
    });

  if (refs.has('sbizIndustry') || refs.has('generalIndustry'))
    out.push({
      id: 'el-industry',
      title: '업종 조건',
      condition: (refs.has('sbizIndustry') ? RULES.sbizIndustry : RULES.generalIndustry).fail,
      how: '홈택스에서 내 업종코드를 확인하고 공고문 별표의 제외 업종 목록과 대조합니다. 주업종과 부업종이 따로 있다면 어느 쪽을 기준으로 보는지도 확인합니다.',
      caution: '기준은 실제로 하는 일이 아니라 사업자등록상 업종코드입니다.',
      where: '홈택스',
      siteName: SITES.hometax.name,
      url: SITES.hometax.url,
      source: '원고 4장 1절, 15장 1절',
      requirement: 'confirm',
    });

  const revenue = card('매출 조건');
  if (revenue || refs.has('smallBizRevenue'))
    out.push({
      id: 'el-revenue',
      title: '매출 조건',
      condition: [revenue, refs.has('smallBizRevenue') ? '소상공인 매출 기준: 업종별 「중소기업기본법 시행령」 소기업 매출 기준 이하 (직전 3년 평균)' : '']
        .filter(Boolean)
        .join(' / '),
      how: '부가세 과세표준증명으로 공고가 정한 기간(직전 연도·최근 1년 등)의 매출을 확인합니다.',
      source: `${cardSource}, 4장 1절, 15장 2절`,
      requirement: revenue && !needsConfirm(revenue) ? 'stated' : 'confirm',
    });

  if (refs.has('smallBizEmployees'))
    out.push({
      id: 'el-employees',
      title: '직원 수(상시근로자) 조건',
      condition: '상시근로자 5명 미만 (광업·제조업·건설업·운수업은 10명 미만) — 소상공인 기준',
      how: '대표자 본인, 보수를 받지 않는 가족, 3개월 이내로 기간을 정해 일하는 사람, 월 60시간 미만 단시간 근로자는 상시근로자 수에서 빠집니다.',
      caution: '기준을 넘어도 그다음 해부터 3년간은 소상공인으로 보는 유예 제도가 있습니다(일부 제외).',
      source: '원고 4장 1절',
      requirement: 'stated',
    });

  const credit = card('신용 조건');
  const creditRules = ['noTax', 'noDelinq', 'noDebtRelief'].filter((r) => refs.has(r));
  if (credit || creditRules.length)
    out.push({
      id: 'el-credit',
      title: '신용·체납·연체 조건',
      condition: [credit, ...creditRules.map((r) => RULES[r].fail)].filter(Boolean).join(' / '),
      how: '홈택스·위택스에서 체납을 조회하고(납세증명서가 발급되면 체납 없음), 신용정보 앱에서 연체 기록과 신용점수를 확인합니다.',
      caution: '주민세·자동차세·과태료 같은 소액도 체납으로 잡히고, 카드 대금을 며칠 늦게 낸 것도 연체 기록으로 남을 수 있습니다.',
      source: `${cardSource}, PART 2 공통 제한, 15장 4절`,
      requirement: credit && needsConfirm(credit) ? 'confirm' : 'stated',
    });

  for (const label of ['성장 요건', '자격 요건', '대상', '분야']) {
    const v = card(label);
    if (v)
      out.push({
        id: `el-${label}`,
        title: `기타 필수 자격: ${label}`,
        condition: v,
        source: cardSource,
        requirement: needsConfirm(v) ? 'confirm' : 'stated',
      });
  }
  return out;
}

const PLAN_DESC: Record<string, string> = {
  loan: '융자(대출·보증)는 "이 사람은 갚을 수 있는가"를 숫자로 봅니다. 대출은 숫자를 깨끗하게 준비하세요. (원고 13장 3절)',
  grant: '지원금은 "이 사업은 클 수 있는가"를 외부 평가위원이 글과 발표로 봅니다. 지원금은 이야기를 선명하게 준비하세요. (원고 13장 3절)',
  safety: '가입형 안전망은 사업계획서가 필요 없습니다. 가입 등급과 납입액을 정합니다.',
  other: '이 제도에 필요한 신청 내용만 표시합니다.',
};
const planKind = (track: string) =>
  ['grant', 'modoo'].includes(track)
    ? 'grant'
    : ['yellow', 'emp', 'accident'].includes(track)
      ? 'safety'
      : ['tops', 'hope', 'tbd', 'debt'].includes(track)
        ? 'other'
        : 'loan';

// ─────────────────────────────────────────────
// 조립
// ─────────────────────────────────────────────
const cache = new Map<string, BuiltChecklist>();

export function buildChecklist(programId: string): BuiltChecklist | undefined {
  if (cache.has(programId)) return cache.get(programId);
  const meta = PROGRAM_CHECKLISTS.find((m) => m.programId === programId);
  const program = PROGRAMS.find((p) => p.id === programId);
  if (!meta || !program) return undefined;
  const track = TRACKS[meta.track];

  const extra = (step: StepId) =>
    meta.items
      .filter((x) => x.step === step)
      .map((x) => {
        const base = x.ref ? fromLibrary(x.ref) : undefined;
        const site = (x as { site?: string }).site ? SITES[(x as { site?: string }).site!] : undefined;
        return {
          ...base,
          ...x,
          id: x.id,
          title: x.title ?? base?.title ?? '',
          source: x.source ?? base?.source ?? meta.sourceReference,
          siteName: site?.name ?? base?.siteName,
          url: site?.url ?? base?.url,
          where: x.where ?? site?.name ?? base?.where,
          requirement: x.requirement,
        } as CLItem;
      });

  const raw: Record<StepId, CLItem[]> = {
    eligibility: [...eligibilityItems(program), ...extra('eligibility')],
    documents: [...meta.documents.map((d) => ({ ...fromLibrary(d.ref, d.requirement), note: d.note })), ...extra('documents')],
    plan: [...track.plan.map((id) => fromLibrary(id)), ...extra('plan')],
    procedure: [...track.procedure.map((id) => fromLibrary(id)), ...extra('procedure')],
    final: [...track.final.map((id) => fromLibrary(id)), ...extra('final')],
  };

  // 접수 완료 확인은 절차의 마지막에 두기
  const done = raw.procedure.findIndex((x) => x.id === 'proc-done');
  if (done >= 0 && meta.track !== 'grant') raw.procedure.push(...raw.procedure.splice(done, 1));

  if (!raw.documents.length)
    raw.documents.push({
      id: 'doc-tbd',
      title: '제출 서류 목록',
      how: '원고에 이 제도의 제출 서류가 정리되어 있지 않습니다. 공식 공고의 "제출 서류" 항목에서 확인하세요.',
      source: meta.sourceReference,
      requirement: 'confirm',
    });

  const kind = planKind(meta.track);
  const steps: CLStep[] = (Object.keys(STEP_INFO) as StepId[])
    .map((id) => ({
      id,
      ...STEP_INFO[id],
      desc: id === 'plan' ? PLAN_DESC[kind] : STEP_INFO[id].desc,
      items: raw[id],
    }))
    .filter((s) => s.items.length);

  const all = steps.flatMap((s) => s.items);
  const built: BuiltChecklist = {
    meta,
    program,
    trackLabel: track.label,
    steps,
    actionableIds: all.filter((x) => x.requirement !== 'confirm').map((x) => x.id),
    confirmIds: all.filter((x) => x.requirement === 'confirm').map((x) => x.id),
  };
  cache.set(programId, built);
  return built;
}

// ─────────────────────────────────────────────
// 저장 (제도별 독립)
// ─────────────────────────────────────────────
const KEY = (programId: string) => `pn2027:cl:${programId}`;
const EVENT = 'pn2027:checklist-change';

export function readChecks(programId: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY(programId)) ?? '{}');
  } catch {
    return {};
  }
}

function writeChecks(programId: string, value: Record<string, boolean>) {
  try {
    if (Object.keys(value).length) localStorage.setItem(KEY(programId), JSON.stringify(value));
    else localStorage.removeItem(KEY(programId));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* 저장소를 쓸 수 없는 환경 */
  }
}

export interface Progress {
  done: number;
  total: number;
  confirmDone: number;
  confirmTotal: number;
  pct: number;
  started: boolean;
}

export function progressOf(cl: BuiltChecklist, checks = readChecks(cl.meta.programId)): Progress {
  const done = cl.actionableIds.filter((id) => checks[id]).length;
  const confirmDone = cl.confirmIds.filter((id) => checks[id]).length;
  const total = cl.actionableIds.length;
  return {
    done,
    total,
    confirmDone,
    confirmTotal: cl.confirmIds.length,
    pct: total ? Math.round((done / total) * 100) : 0,
    started: done + confirmDone > 0,
  };
}

/** 제도 하나의 체크 상태 */
export function useProgramChecks(programId: string) {
  const [checks, setChecks] = useState<Record<string, boolean>>(() => readChecks(programId));
  useEffect(() => setChecks(readChecks(programId)), [programId]);
  const toggle = useCallback(
    (id: string) =>
      setChecks((c) => {
        const next = { ...c };
        if (next[id]) delete next[id];
        else next[id] = true;
        writeChecks(programId, next);
        return next;
      }),
    [programId],
  );
  const reset = useCallback(() => {
    writeChecks(programId, {});
    setChecks({});
  }, [programId]);
  return { checks, toggle, reset };
}

/** 목록 화면용: 저장소가 바뀌면 다시 읽도록 버전 번호를 올립니다 */
export function useChecklistVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => setV((x) => x + 1);
    window.addEventListener(EVENT, on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener('storage', on);
    };
  }, []);
  return v;
}

export function resetAllChecks() {
  try {
    for (const m of PROGRAM_CHECKLISTS) localStorage.removeItem(KEY(m.programId));
    localStorage.removeItem('pn2027:checklist');
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* noop */
  }
}
