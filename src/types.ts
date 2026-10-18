// ─────────────────────────────────────────────
// 자가진단 응답(Profile)
// 값의 목록은 src/data/questions.ts 에 정의되어 있고,
// src/data/*.json 의 판정 조건(cond)은 이 필드 이름과 값을 그대로 씁니다.
// ─────────────────────────────────────────────

export type BizStatus = 'pre' | 'freelancer' | 'operating' | 'suspended' | 'closed';
export type BizAge = 'none' | 'lt3m' | '3to6m' | '6to12m' | '1to3y' | '3to5y' | '5to7y' | 'gt7y';
export type Industry =
  | 'knowledge-service'
  | 'goods-online'
  | 'manufacturing'
  | 'tech'
  | 'food-retail'
  | 'life-service'
  | 'wholesale-retail'
  | 'other'
  | 'restricted';
export type Region =
  | 'seoul' | 'busan' | 'daegu' | 'incheon' | 'gwangju' | 'daejeon' | 'ulsan' | 'sejong'
  | 'gyeonggi' | 'gangwon' | 'chungbuk' | 'chungnam' | 'jeonbuk' | 'jeonnam'
  | 'gyeongbuk' | 'gyeongnam' | 'jeju';
export type Revenue = 'none' | 'lt12m' | '12mto100m' | '100mto300m' | '300mto1b' | 'gt1b' | 'unknown';
export type RevenueTrend = 'growing' | 'steady' | 'irregular' | 'declining' | 'unknown';
export type Employees = '0' | '1to4' | '5to9' | '10plus';
export type Credit = 'lt595' | '595to839' | '840to964' | 'gte965' | 'unknown';
export type YesNo = 'yes' | 'no' | 'unknown';
export type Delinquency = 'none' | 'resolved-recent' | 'current' | 'unknown';
export type DebtRelief = 'none' | 'in-progress' | 'completed' | 'unknown';
export type CurrentFinance = 'sbiz-direct' | 'regional-guarantee' | 'kodit-kibo' | 'kosmes' | 'none';
export type Purpose =
  | 'operating'
  | 'refinance'
  | 'growth'
  | 'crisis'
  | 'new-product'
  | 'idea'
  | 'online'
  | 'restart'
  | 'debt'
  | 'safety'
  | 'digital';
export type Flag =
  | 'youth'
  | 'export'
  | 'tops'
  | 'smart-tech'
  | 'strong-sbiz'
  | 'sbiz-repaid'
  | 'ip'
  | 'professional-license'
  | 'research-career'
  | 'career-expert'
  | 'prior-closure'
  | 'disaster'
  | 'relocate-region'
  | 'social-economy'
  | 'field-work'
  | 'parenting'
  | 'none';
export type Joined = 'yellow-umbrella' | 'emp-insurance' | 'accident-insurance' | 'none';

export interface Profile {
  bizStatus?: BizStatus;
  bizAge?: BizAge;
  industry?: Industry;
  region?: Region;
  revenue?: Revenue;
  revenueTrend?: RevenueTrend;
  employees?: Employees;
  credit?: Credit;
  vulnerable?: YesNo;
  taxArrears?: YesNo;
  delinquency?: Delinquency;
  debtRelief?: DebtRelief;
  highInterest?: YesNo;
  currentFinance?: CurrentFinance[];
  purposes?: Purpose[];
  flags?: Flag[];
  joined?: Joined[];
}

/** 판정에 쓰는 파생 필드까지 포함한 응답 */
export interface EvalProfile extends Profile {
  regionGroup?: 'capital' | 'non-capital';
}

// ─────────────────────────────────────────────
// 판정 조건 (JSON에서 사용)
// ─────────────────────────────────────────────

export type Tri = 'pass' | 'fail' | 'unknown';

export type Cond =
  | { all: Cond[]; then?: 'pass' | 'unknown' }
  | { any: Cond[]; then?: 'pass' | 'unknown' }
  | { not: Cond }
  | LeafCond;

export interface LeafCond {
  field: keyof EvalProfile;
  /** 값이 목록에 있으면 통과, 없으면 미충족 */
  in?: string[];
  /** 값이 목록에 있으면 미충족, 없으면 통과 */
  notIn?: string[];
  /** 값이 목록에 있으면 '추가 확인 필요' */
  maybe?: string[];
  /** 다중 선택 필드에 해당 값이 있는지 */
  has?: string;
  hasAny?: string[];
  /** 다중 선택 필드에 해당 값이 없어야 통과 */
  lacks?: string;
  /** 업력(개월) 비교: minMonths 이상 / maxMonths 미만 */
  minMonths?: number;
  maxMonths?: number;
  /** 신용평점 비교: minScore 이상 / maxScore 이하 */
  minScore?: number;
  maxScore?: number;
  /** 조건이 맞았을 때의 결과 (기본 pass). 'unknown'이면 "해당할 수 있음" 처리 */
  then?: 'pass' | 'unknown';
}

export interface CriterionDef {
  label: string;
  cond: Cond;
  pass: string;
  fail: string;
  unknown?: string;
  /** true면 미충족이어도 '추가 확인 필요'로 처리 (지역별·상품별로 기준이 다른 경우) */
  soft?: boolean;
}

export type Criterion = ({ ref: string; soft?: boolean } | CriterionDef);

// ─────────────────────────────────────────────
// 제도 데이터 (src/data/programs.json)
// ─────────────────────────────────────────────

export type CategoryId = 'loan' | 'guarantee' | 'microfinance' | 'debt' | 'grant' | 'support' | 'safety';
export type SoloLevel = 'possible' | 'conditional' | 'difficult';
/** announced: 2026년까지의 공고(확정) 기준 / proposal: 2027 예산안(국회 심의 전, 예정) */
export type Basis = 'announced' | 'proposal';

export interface CardRow {
  label: string;
  value: string;
}

export interface Program {
  id: string;
  name: string;
  aka?: string;
  category: CategoryId;
  agency: string;
  method?: string;
  repay: 'repay' | 'no-repay' | 'na';
  chapter: string;
  solo: SoloLevel;
  soloNote: string;
  basis: Basis;
  basisLabel: string;
  isNew2027?: boolean;
  /** 세부 조건이 공고 전이거나 지역·상품별로 달라 '기본 조건 부합'으로 단정할 수 없는 제도 */
  needsAnnouncement?: boolean;
  summary: string;
  keyFact: CardRow;
  card: CardRow[];
  change2027?: string;
  purposes: Purpose[];
  criteria: Criterion[];
  checks: string[];
  apply: { label: string; url?: string; note?: string };
  sources?: string[];
  tags?: string[];
  priority?: number;
}

// ─────────────────────────────────────────────
// 판정 결과
// ─────────────────────────────────────────────

export type Status = 'eligible' | 'check' | 'ineligible';

export interface CriterionResult {
  label: string;
  result: Tri;
  text: string;
  common: boolean;
}

export interface Match {
  program: Program;
  status: Status;
  reasons: string[];
  checks: string[];
  failures: string[];
  purposeHits: Purpose[];
  score: number;
  criteria: CriterionResult[];
}

// 제도별 체크리스트 타입은 src/lib/checklists.ts 에 있습니다.
