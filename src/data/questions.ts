import type { Profile } from '../types';

export interface Option {
  value: string;
  label: string;
  help?: string;
  /** 다중 선택에서 다른 선택을 모두 지우는 '없음' 항목 */
  exclusive?: boolean;
}

export interface Question {
  field: keyof Profile;
  title: string | ((p: Profile) => string);
  help?: string | ((p: Profile) => string | undefined);
  multi?: boolean;
  /** 다중 선택에서 아무것도 고르지 않아도 되는지 */
  optional?: boolean;
  columns?: 1 | 2 | 3;
  options: Option[] | ((p: Profile) => Option[]);
  showIf?: (p: Profile) => boolean;
}

export interface Step {
  id: string;
  label: string;
  title: string;
  description?: string;
  questions: Question[];
  showIf?: (p: Profile) => boolean;
}

const registered = (p: Profile) => p.bizStatus !== 'pre' && p.bizStatus !== 'freelancer';
const hasRunningBiz = (p: Profile) => registered(p) && p.bizAge !== 'none';

const ageOptions: Option[] = [
  { value: 'lt3m', label: '3개월 미만' },
  { value: '3to6m', label: '3개월 ~ 6개월' },
  { value: '6to12m', label: '6개월 ~ 1년' },
  { value: '1to3y', label: '1년 ~ 3년' },
  { value: '3to5y', label: '3년 ~ 5년' },
  { value: '5to7y', label: '5년 ~ 7년' },
  { value: 'gt7y', label: '7년 이상' },
];

export const REGIONS: Option[] = [
  { value: 'seoul', label: '서울' },
  { value: 'gyeonggi', label: '경기' },
  { value: 'incheon', label: '인천' },
  { value: 'busan', label: '부산' },
  { value: 'daegu', label: '대구' },
  { value: 'gwangju', label: '광주' },
  { value: 'daejeon', label: '대전' },
  { value: 'ulsan', label: '울산' },
  { value: 'sejong', label: '세종' },
  { value: 'gangwon', label: '강원' },
  { value: 'chungbuk', label: '충북' },
  { value: 'chungnam', label: '충남' },
  { value: 'jeonbuk', label: '전북' },
  { value: 'jeonnam', label: '전남' },
  { value: 'gyeongbuk', label: '경북' },
  { value: 'gyeongnam', label: '경남' },
  { value: 'jeju', label: '제주' },
];

export const STEPS: Step[] = [
  {
    id: 'status',
    label: '사업자 상태',
    title: '지금 사업자 상태는 어떤가요?',
    questions: [
      {
        field: 'bizStatus',
        title: '지금 사업자 상태는 어떤가요?',
        help: '같은 1인사업자라도 상태에 따라 볼 수 있는 돈이 완전히 달라집니다.',
        options: [
          { value: 'pre', label: '사업자등록 전이에요', help: '예비 창업자' },
          { value: 'freelancer', label: '사업자등록 없이 프리랜서로 일해요', help: '3.3% 원천징수로 소득을 받는 경우' },
          { value: 'operating', label: '사업자등록 후 영업 중이에요' },
          { value: 'suspended', label: '휴업 중이에요', help: '신고는 안 했어도 몇 달째 매출이 없는 경우 포함' },
          { value: 'closed', label: '폐업했거나 재창업을 준비해요' },
        ],
      },
    ],
  },
  {
    id: 'age',
    label: '업력',
    title: '개업한 지 얼마나 됐나요?',
    showIf: registered,
    questions: [
      {
        field: 'bizAge',
        title: (p) => (p.bizStatus === 'closed' ? '폐업 후 다시 시작한 사업의 업력은요?' : '개업한 지 얼마나 됐나요?'),
        help: (p) =>
          p.bizStatus === 'closed'
            ? '아직 다시 시작한 사업이 없다면 "아직 재창업 전"을 골라 주세요.'
            : '사업자등록증명에 적힌 개업일을 기준으로 골라 주세요.',
        columns: 2,
        options: (p) =>
          p.bizStatus === 'closed' ? [{ value: 'none', label: '아직 재창업 전이에요' }, ...ageOptions] : ageOptions,
      },
    ],
  },
  {
    id: 'industry',
    label: '업종',
    title: '어떤 일을 하나요?',
    questions: [
      {
        field: 'industry',
        title: '어떤 일을 하나요? (하려는 일)',
        help: '정확한 판단 기준은 사업자등록상 업종코드입니다. 가장 가까운 것을 골라 주세요.',
        columns: 2,
        options: [
          { value: 'knowledge-service', label: '디자인·콘텐츠·교육 서비스' },
          { value: 'goods-online', label: '굿즈·소품을 온라인으로 판매', help: '제작은 외부에 위탁' },
          { value: 'manufacturing', label: '직접 제조·공예·소량 생산' },
          { value: 'tech', label: 'IT·소프트웨어·AI 등 기술 기반' },
          { value: 'food-retail', label: '음식점·음식료품 소매' },
          { value: 'life-service', label: '이·미용, 체력단련 등 생활 서비스' },
          { value: 'wholesale-retail', label: '그 밖의 도소매·유통' },
          { value: 'other', label: '그 밖의 업종' },
          {
            value: 'restricted',
            label: '유흥·사행, 법무·회계·보건 등 전문서비스, 부동산 임대업',
            help: '정책자금 제외 업종에 해당할 수 있는 업종',
          },
        ],
      },
    ],
  },
  {
    id: 'region',
    label: '지역',
    title: '사업장은 어디에 있나요?',
    questions: [
      {
        field: 'region',
        title: '사업장은 어디에 있나요?',
        help: '거주지가 아니라 사업자등록상 주소가 기준인 경우가 많습니다. 등록 전이라면 창업할 지역을 골라 주세요.',
        columns: 3,
        options: REGIONS,
      },
    ],
  },
  {
    id: 'revenue',
    label: '매출',
    title: '매출은 어느 정도인가요?',
    showIf: hasRunningBiz,
    questions: [
      {
        field: 'revenue',
        title: '최근 1년 매출은 어느 정도인가요?',
        help: '부가세 신고 기준 매출입니다. 심사 기관은 신고된 매출만 매출로 봅니다.',
        columns: 2,
        options: [
          { value: 'none', label: '아직 매출이 없어요' },
          { value: 'lt12m', label: '1,200만 원 미만' },
          { value: '12mto100m', label: '1,200만 원 ~ 1억 원' },
          { value: '100mto300m', label: '1억 원 ~ 3억 원' },
          { value: '300mto1b', label: '3억 원 ~ 10억 원' },
          { value: 'gt1b', label: '10억 원 초과' },
          { value: 'unknown', label: '잘 모르겠어요' },
        ],
      },
      {
        field: 'revenueTrend',
        title: '매출 흐름은 어떤가요?',
        columns: 2,
        options: [
          { value: 'growing', label: '2년 연속 10% 이상 늘었어요' },
          { value: 'steady', label: '비슷하게 꾸준해요' },
          { value: 'irregular', label: '달마다 들쭉날쭉해요' },
          { value: 'declining', label: '전년보다 10% 이상 줄었어요' },
          { value: 'unknown', label: '잘 모르겠어요' },
        ],
      },
    ],
  },
  {
    id: 'employees',
    label: '직원 수',
    title: '상시근로자는 몇 명인가요?',
    showIf: registered,
    questions: [
      {
        field: 'employees',
        title: '상시근로자(직원)는 몇 명인가요?',
        help: '대표 본인, 보수를 받지 않는 가족, 3개월 이내 단기 인력, 월 60시간 미만 단시간 근로자는 빼고 세요.',
        columns: 2,
        options: [
          { value: '0', label: '없어요 (1인 사업)' },
          { value: '1to4', label: '1 ~ 4명' },
          { value: '5to9', label: '5 ~ 9명' },
          { value: '10plus', label: '10명 이상' },
        ],
      },
    ],
  },
  {
    id: 'credit',
    label: '신용',
    title: '대표자 신용 상태를 알려 주세요',
    description: '1인사업자는 사업과 대표가 사실상 같은 사람이라, 대표자 개인 신용이 곧 사업 신용입니다.',
    questions: [
      {
        field: 'credit',
        title: '대표자 개인신용평점(NCB)은 어느 구간인가요?',
        help: '무료 신용조회 앱에서 확인할 수 있습니다.',
        columns: 2,
        options: [
          { value: 'lt595', label: '595점 미만' },
          { value: '595to839', label: '595 ~ 839점' },
          { value: '840to964', label: '840 ~ 964점' },
          { value: 'gte965', label: '965점 이상' },
          { value: 'unknown', label: '잘 모르겠어요' },
        ],
      },
      {
        field: 'vulnerable',
        title: '기초생활수급·차상위계층이거나 신용평점 하위 20% 이하인가요?',
        help: '미소금융 등 서민금융 지원 대상 여부를 판단하는 데 씁니다.',
        columns: 3,
        options: [
          { value: 'yes', label: '예' },
          { value: 'no', label: '아니요' },
          { value: 'unknown', label: '모르겠어요' },
        ],
      },
    ],
  },
  {
    id: 'arrears',
    label: '체납·연체',
    title: '체납·연체 이력이 있나요?',
    description: '대부분의 정책자금은 체납·연체가 있으면 신청 단계부터 막힙니다.',
    questions: [
      {
        field: 'taxArrears',
        title: '국세·지방세 체납이 있나요?',
        help: '주민세·자동차세처럼 잊기 쉬운 소액 세금도 포함됩니다.',
        columns: 3,
        options: [
          { value: 'no', label: '없어요' },
          { value: 'yes', label: '있어요' },
          { value: 'unknown', label: '모르겠어요' },
        ],
      },
      {
        field: 'delinquency',
        title: '대출·카드 연체가 있나요?',
        help: '최근 3개월 안에 30일 이상 연체 1번, 또는 10일 이상 연체 4번 이상이면 제한됩니다.',
        columns: 2,
        options: [
          { value: 'none', label: '없어요' },
          { value: 'resolved-recent', label: '최근 3개월 안에 있었어요 (지금은 해소)' },
          { value: 'current', label: '지금 연체 중이에요' },
          { value: 'unknown', label: '모르겠어요' },
        ],
      },
      {
        field: 'debtRelief',
        title: '채무조정·개인회생·파산이나 보증기관 대위변제 이력이 있나요?',
        columns: 2,
        options: [
          { value: 'none', label: '없어요' },
          { value: 'in-progress', label: '지금 진행 중이에요' },
          { value: 'completed', label: '절차를 마쳤어요', help: '면책 확정, 변제 완료 등' },
          { value: 'unknown', label: '모르겠어요' },
        ],
      },
    ],
  },
  {
    id: 'debt',
    label: '대출 현황',
    title: '지금 쓰고 있는 대출을 알려 주세요',
    questions: [
      {
        field: 'highInterest',
        title: '연 7% 이상 대출이 있나요?',
        help: '카드론·현금서비스·2금융권 대출을 포함합니다.',
        columns: 3,
        options: [
          { value: 'yes', label: '있어요' },
          { value: 'no', label: '없어요' },
          { value: 'unknown', label: '모르겠어요' },
        ],
      },
      {
        field: 'currentFinance',
        title: '지금 이용 중인 정책금융이 있나요?',
        help: '같은 칸끼리(직접대출 기관끼리, 보증기관끼리)는 동시에 이용하기 어렵습니다.',
        multi: true,
        columns: 2,
        options: [
          { value: 'sbiz-direct', label: '소진공 직접대출' },
          { value: 'regional-guarantee', label: '지역신용보증재단 보증' },
          { value: 'kodit-kibo', label: '신용보증기금·기술보증기금 보증' },
          { value: 'kosmes', label: '중진공 정책자금' },
          { value: 'none', label: '없어요', exclusive: true },
        ],
      },
    ],
  },
  {
    id: 'purpose',
    label: '자금 목적',
    title: '지금 가장 필요한 것은 무엇인가요?',
    description: '제도에서 출발하면 길을 잃고, 필요에서 출발하면 길이 좁혀집니다. 여러 개를 골라도 됩니다.',
    questions: [
      {
        field: 'purposes',
        title: '지금 가장 필요한 것은 무엇인가요?',
        multi: true,
        columns: 2,
        options: [
          { value: 'operating', label: '당장 운영자금', help: '재료비·외주비·비수기 현금 공백' },
          { value: 'refinance', label: '비싼 이자 줄이기', help: '고금리 대출 갈아타기' },
          { value: 'growth', label: '장비·판로에 투자해 키우기' },
          { value: 'crisis', label: '재해·일시적 위기 대응' },
          { value: 'new-product', label: '신제품·서비스 개발', help: '갚지 않는 사업화 지원금' },
          { value: 'idea', label: '아이디어로 창업 시작' },
          { value: 'online', label: '온라인 판로 넓히기' },
          { value: 'restart', label: '폐업 정리·재도전' },
          { value: 'debt', label: '연체·빚 부담 정리' },
          { value: 'safety', label: '퇴직금·실업·산재 등 안전망' },
          { value: 'digital', label: '디지털·AI 역량 키우기' },
        ],
      },
    ],
  },
  {
    id: 'flags',
    label: '해당 사항',
    title: '해당하는 것을 모두 골라 주세요',
    description: '성장 자금, 예비창업자 보증, 재도전 트랙처럼 특정 자격이 필요한 제도를 판단하는 데 씁니다.',
    questions: [
      {
        field: 'flags',
        title: '해당하는 것을 모두 골라 주세요',
        multi: true,
        columns: 2,
        options: [
          { value: 'youth', label: '청년 대표자예요', help: '연령 기준은 제도별 공고 확인' },
          { value: 'export', label: '수출·해외 판매 실적이 있어요' },
          { value: 'tops', label: 'TOPS 선정 또는 소진공 상생협약 플랫폼 입점' },
          { value: 'smart-tech', label: '스마트공장·스마트기술을 도입했어요' },
          { value: 'strong-sbiz', label: '강한소상공인·로컬크리에이터에 선정됐어요' },
          { value: 'sbiz-repaid', label: '소진공 직접대출을 성실히 갚은 이력이 있어요' },
          { value: 'ip', label: '특허·실용신안·디자인권을 보유했어요' },
          { value: 'professional-license', label: '전문자격증으로 그 분야 창업', help: '약사·세무사·변리사·노무사·건축사 등' },
          { value: 'research-career', label: '연구·기술 경력이 길어요', help: '교수·박사·연구원 3년 이상, 기술사·기능장 등' },
          { value: 'career-expert', label: '회사 경력·전문성을 살려 창업해요' },
          { value: 'prior-closure', label: '폐업한 경험이 있어요' },
          { value: 'disaster', label: '화재·침수 등 재해 피해를 입었어요' },
          { value: 'relocate-region', label: '비수도권에서 창업하거나 옮길 계획이에요' },
          { value: 'social-economy', label: '사회적기업·협동조합 등 사회적경제 인증' },
          { value: 'field-work', label: '납품 이동·촬영·현장 작업이 많아요' },
          { value: 'parenting', label: '출산·육아를 앞두고 있어요' },
          { value: 'none', label: '해당 없음', exclusive: true },
        ],
      },
    ],
  },
  {
    id: 'joined',
    label: '안전망',
    title: '이미 가입한 안전망이 있나요?',
    showIf: registered,
    questions: [
      {
        field: 'joined',
        title: '이미 가입한 안전망이 있나요?',
        multi: true,
        columns: 2,
        options: [
          { value: 'yellow-umbrella', label: '노란우산공제' },
          { value: 'emp-insurance', label: '자영업자 고용보험' },
          { value: 'accident-insurance', label: '중소기업 사업주 산재보험' },
          { value: 'none', label: '아직 없어요', exclusive: true },
        ],
      },
    ],
  },
];

export const visibleSteps = (p: Profile) => STEPS.filter((s) => !s.showIf || s.showIf(p));

export const visibleQuestions = (step: Step, p: Profile) => step.questions.filter((q) => !q.showIf || q.showIf(p));

export const optionsOf = (q: Question, p: Profile) => (typeof q.options === 'function' ? q.options(p) : q.options);

export const textOf = (v: string | ((p: Profile) => string | undefined) | undefined, p: Profile) =>
  typeof v === 'function' ? v(p) : v;

/** 화면에 숨겨진 단계의 응답은 판정에서 빼고, 숨겨진 단계의 기본값을 채웁니다. */
export function normalizeProfile(p: Profile): Profile {
  const out: Profile = { ...p };
  if (p.bizStatus === 'pre' || p.bizStatus === 'freelancer') {
    out.bizAge = 'none';
    out.employees = '0';
    delete out.revenue;
    delete out.revenueTrend;
    delete out.joined;
  }
  if (out.bizAge === 'none') {
    delete out.revenue;
    delete out.revenueTrend;
  }
  return out;
}

export const labelOf = (field: keyof Profile, value: string, p: Profile = {}) => {
  for (const s of STEPS)
    for (const q of s.questions)
      if (q.field === field) {
        const o = optionsOf(q, { ...p, bizStatus: p.bizStatus ?? 'closed' }).find((x) => x.value === value);
        if (o) return o.label;
      }
  return value;
};
