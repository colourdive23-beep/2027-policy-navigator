# 정책자금 내비 2027

《2027 1인사업자를 위한 정책자금·지원금 가이드》 원고를 바탕으로 만든 자가진단 웹사이트입니다.
React + TypeScript + Vite, 디자인 기준은 `디자인_방향_변경_프롬프트_오렌지.md` (9절: 책 표지 컨셉).

표지 일러스트는 책 PDF 표지를 벡터 그대로 SVG로 변환해 요소별로 나눈 것입니다 (`src/assets/art/`, 사용은 `src/components/Art.tsx`).
제목 글꼴 G마켓 산스는 jsDelivr 웹폰트로 불러옵니다.

## 로컬 실행

Node.js 20 이상이 필요합니다.

```bash
npm install        # 처음 한 번
npm run dev        # 개발 서버 → http://localhost:5173
```

배포본과 똑같이 확인하려면:

```bash
npm run build      # 데이터 검증 → 타입 검사 → dist/ 생성
npm run preview    # → http://localhost:4173
```

## GitHub Pages 배포

1. GitHub에 새 저장소를 만들고 이 폴더를 올립니다 (`main` 브랜치).
   원고 `.docx` / `.pdf` 는 `.gitignore`로 제외되어 올라가지 않습니다.
2. 저장소 **Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 바꿉니다.
3. `main`에 push하면 `.github/workflows/deploy.yml`이 빌드·배포합니다.
   주소: `https://<아이디>.github.io/<저장소이름>/`

경로는 상대 경로(`base: './'`)와 해시 라우팅(`#/result`)을 쓰므로 저장소 이름을 바꿔도 설정을 고칠 필요가 없습니다.

## 화면

| 경로 | 화면 |
|---|---|
| `#/` | 홈 (히어로, 다섯 가지 돈, 2027 변화 요약) |
| `#/diagnosis` | 단계별 자가진단 (최대 12단계, 응답에 따라 단계 생략) |
| `#/result` | 진단 결과 — 기본 조건 부합 / 추가 확인 필요 / 조건 미충족, 인쇄·PDF |
| `#/programs` | 정책 탐색 (검색·유형·목적·확정/예정 필터) |
| `#/programs/:id` | 제도 상세 (10항목 카드, 내 조건별 충족 여부, 공식 신청처) |
| `#/checklist` | 제도별 체크리스트 목록 (검색·유형 필터·추천 제도만·준비 중인 제도만, 제도별 진행률) |
| `#/checklist/:id` | 제도별 상세 체크리스트 5단계 (자격 → 서류 → 계획 → 절차 → 최종 점검), 제도별 저장, 인쇄·PDF |
| `#/changes` | 2026 → 2027 정책 변화 |

진단 응답과 체크 상태는 사용자 브라우저(localStorage)에만 저장되며 서버로 보내지 않습니다.

## 정책 데이터 수정 (공고가 나왔을 때)

데이터는 모두 `src/data/` 의 JSON 파일입니다. 고친 뒤 `npm run validate`로 오타·잘못된 참조를 확인하세요 (빌드할 때도 자동 실행).

| 파일 | 내용 |
|---|---|
| `programs.json` | 제도 40개: 10항목 카드(`card`), 판정 조건(`criteria`), 추가 확인사항(`checks`), 신청처(`apply`) |
| `common-rules.json` | 여러 제도가 함께 쓰는 조건 (체납·연체·소상공인 기준 등) |
| `changes2027.json` | 2026/2027 예산 비교, 신설 사업, 공고 캘린더 |
| `program-checklists.json` | 제도별 상세 체크리스트: programId(= programs.json의 id), 서류와 출처 상태, 신청 절차 유형(track), 제도 전용 항목 |
| `checklist-library.json` | 체크리스트 공통 항목(왜 필요한지·준비 방법·발급처·주의사항·원고 출처·공식 링크)과 절차 유형별 단계 구성 |
| `guide.json` | 유형 이름, 3장 상태별 표·유형별 루트, 안내 문구 |

### 확정 / 예정 표시

- 제도: `"basis": "announced"` = 확정(2026 공고 기준), `"proposal"` = 예정(2027 예산안)
- 2027 공고가 나오면 해당 제도의 `card` 수치를 고치고 `basis`를 `"announced"`, `basisLabel`을 `"2027 공고 기준"`으로 바꿉니다.
- `changes2027.json`의 `status2027`을 `"confirmed"`로 바꾸면 막대그래프의 사선 무늬(예정)가 실선(확정)으로 바뀝니다.
- 세부 조건이 아직 없는 제도는 `"needsAnnouncement": true` 로 두면 최고 판정이 '추가 확인 필요'로 제한됩니다.

### 판정 조건 쓰는 법

```json
{
  "label": "업력 90일 이상",
  "cond": { "field": "bizAge", "minMonths": 3 },
  "pass": "충족했을 때 보여줄 문장 (추천 근거)",
  "fail": "충족하지 못했을 때 보여줄 문장",
  "unknown": "응답이 '모르겠어요'일 때 보여줄 문장 (선택)",
  "soft": true
}
```

- 결과는 충족 / 미충족 / 확인 필요 세 가지입니다. 하나라도 미충족이면 **조건 미충족**, 확인 필요가 있으면 **추가 확인 필요**, 모두 충족이면 **기본 조건 부합**입니다.
- `soft: true` — 지역·상품별로 기준이 달라 미충족이어도 '확인 필요'로 처리합니다.
- 조건 종류: `in`, `notIn`, `maybe`(확인 필요로 처리할 값), `has`/`hasAny`/`lacks`(다중 선택), `minMonths`/`maxMonths`(업력), `minScore`/`maxScore`(신용점수), `all`/`any`/`not`(묶음), `then: "unknown"`(맞으면 '확인 필요').
- 필드와 값 목록은 `scripts/validate-data.mjs` 맨 위 `FIELDS` 와 `src/data/questions.ts` 에 있습니다.

### 체크리스트 항목의 출처 상태

`requirement`: `stated` = 원고에 이 제도(절차)의 준비사항으로 명시 · `common` = 원고 13장의 유형별 공통 서류(제출 여부 확인 필요) · `confirm` = 공식 공고 확인 필요.
진행률은 `stated`·`common` 항목으로 계산하고 `confirm` 항목은 따로 셉니다. STEP 1(자격)은 `programs.json`의 10항목 카드와 판정 조건에서 자동으로 만들어집니다.

원고에 없는 자격 요건이나 금액은 넣지 말고, 확인되지 않은 내용은 `checks`나 `soft`/`maybe`로 '추가 확인 필요'가 되게 하세요.
