import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, ListChecks, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import PhoneMockup from '../components/PhoneMockup';
import Art from '../components/Art';
import SectionHeader, { Mark } from '../components/SectionHeader';
import { CountUp } from '../components/Charts';
import guide from '../data/guide.json';
import changes from '../data/changes2027.json';

const FLOW = [
  { icon: Stethoscope, title: '자가진단', desc: '사업자 상태·업력·매출·신용·자금 목적', to: '/diagnosis' },
  { icon: ClipboardCheck, title: '결과 확인', desc: '기본 조건 부합 / 추가 확인 / 미충족', to: '/result' },
  { icon: Search, title: '정책 탐색', desc: '40여 개 제도의 10항목 카드', to: '/programs' },
  { icon: ListChecks, title: '체크리스트', desc: '서류·사전 요건·마지막 점검', to: '/checklist' },
  { icon: ShieldCheck, title: '공식 신청처', desc: '최신 공고 확인 후 신청', to: '/programs' },
];

const NEEDS: { purpose: string; label: string; hint: string }[] = [
  { purpose: 'operating', label: '당장 운영자금', hint: '소진공 정책자금 · 지역신보 보증' },
  { purpose: 'refinance', label: '비싼 이자 줄이기', hint: '대환대출 · 서민금융' },
  { purpose: 'new-product', label: '신제품·서비스 개발', hint: '초기·도약 패키지' },
  { purpose: 'idea', label: '아이디어만 있음', hint: '모두의 창업' },
  { purpose: 'online', label: '온라인 판로', hint: 'TOPS → 상생성장촉진자금' },
  { purpose: 'restart', label: '폐업·재도전', hint: '희망리턴 · 재도전 트랙' },
  { purpose: 'safety', label: '다치거나 쉴 때 대비', hint: '노란우산 · 고용·산재보험' },
  { purpose: 'growth', label: '장비·판로 투자', hint: '성장기반자금 · 기보' },
];

export default function Home() {
  const h = changes.headline;
  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="pill pill--white">2027 1인사업자 정책자금·지원금 가이드</span>
            <h1 className="hero__title display">
              <span className="display__key">나에게 맞는</span> 정책자금,
              <br />
              5분 만에 찾아보세요.
            </h1>
            <p className="hero__sub">직원 없는 사장님을 위한 정책자금·지원금 맞춤형 가이드</p>
            <Link to="/diagnosis" className="btn btn--white btn--lg">
              무료 자가진단 시작하기 <ArrowRight size={20} aria-hidden />
            </Link>
            <p className="hero__facts">회원가입 없음 · 약 5분 · 결과 즉시 확인</p>
          </div>
          <div className="hero__visual">
            <Art name="illustration" className="hero__art" alt="2027 폴더, 노트북, 커피, 동전, 도장, 체크리스트 서류 일러스트" />
          </div>
        </div>
      </section>

      {/* ───────── 결과 미리보기 ───────── */}
      <section className="section section--cream preview">
        <div className="container preview__inner">
          <div className="preview__copy" data-reveal>
            <p className="section-label">Preview</p>
            <h2 className="section-title">
              공고문 40쪽 대신, <Mark>내 조건</Mark>으로 정리한 결과
            </h2>
            <ul className="preview__list">
              <li>
                <span className="status status--eligible">기본 조건 부합</span>원고의 자격 요건과 응답이 모두 맞는 제도
              </li>
              <li>
                <span className="status status--check">추가 확인 필요</span>공고·지역별로 확인할 조건이 남은 제도
              </li>
              <li>
                <span className="status status--ineligible">조건 미충족</span>어떤 조건 때문에 어려운지 이유와 함께
              </li>
            </ul>
            <p className="preview__note">아래 화면은 원고 12장 사례 1(서울, 디자인 1인사업자, 업력 2년)의 실제 진단 결과입니다.</p>
          </div>
          <div className="preview__visual">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ───────── 다섯 가지 돈 ───────── */}
      <section className="section">
        <div className="container">
          <SectionHeader
            art="coins"
            label="Basics"
            title={
              <>
                정책자금은 <Mark>다섯 가지 돈</Mark>으로 나뉩니다
              </>
            }
            aside="이 구분만 알아도 공고문의 절반은 읽힙니다. 가장 흔한 오해는 지원금과 대출을 섞어 생각하는 것입니다."
          />
          <div className="money-grid">
            {guide.fiveMoneys.map((m, i) => (
              <article className="money-card" key={m.kind} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <span className={`money-card__repay ${m.repay === '갚지 않음' ? 'is-free' : ''}`}>{m.repay}</span>
                <h3 className="money-card__title">{m.kind}</h3>
                <p className="money-card__who">{m.who}</p>
                <p className="money-card__core">{m.core}</p>
                <p className="money-card__ex">예: {m.example}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 이용 흐름 ───────── */}
      <section className="section">
        <div className="container">
          <SectionHeader
            art="laptop"
            label="How it works"
            title={
              <>
                제도에서 출발하면 길을 잃고, <Mark>필요에서 출발하면</Mark> 길이 좁혀집니다
              </>
            }
          />
          <ol className="flow">
            {FLOW.map((f, i) => (
              <li key={f.title} className={`flow__step ${i === 0 ? 'is-current' : ''}`} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
                <Link to={f.to} className="flow__box">
                  <f.icon size={24} aria-hidden />
                  <span className="flow__num">STEP {i + 1}</span>
                  <strong>{f.title}</strong>
                  <span className="flow__desc">{f.desc}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── 2027 변화 (아치) ───────── */}
      <section className="section section--arch-top">
        <div className="container">
          <SectionHeader
            art="folder"
            label="2027 Change"
            title={
              <>
                2027년, 규모보다 <Mark>나눠주는 방식</Mark>이 바뀝니다
              </>
            }
            aside={`${changes.asOf}. 국회 심의를 거쳐 12월에 확정됩니다.`}
          />
        </div>
        <div className="arch">
          <div className="container">
            <div className="kpi-grid kpi-grid--overlap">
              <article className="kpi-card" data-reveal>
                <p className="kpi-card__label">{h.label}</p>
                <p className="kpi-card__value">
                  <CountUp value={18} />
                  <small>조 724억 원</small>
                </p>
                <p className="kpi-card__compare">
                  2026 {h.y2026.text} <span className="delta delta--up">▲ {h.delta.replace('+', '')}</span>
                </p>
                <span className="pill pill--outline">예정 · 예산안</span>
              </article>
              <article className="kpi-card" data-reveal style={{ transitionDelay: '80ms' }}>
                <p className="kpi-card__label">소상공인 정책금융</p>
                <p className="kpi-card__value">
                  <CountUp value={2} />
                  <small>조 원 이차보전</small>
                </p>
                <p className="kpi-card__compare">직접 융자 중심 → 융자 2조 2,500억 원 + 이차보전 2조 원</p>
                <span className="pill pill--outline">예정 · 예산안</span>
              </article>
              <article className="kpi-card" data-reveal style={{ transitionDelay: '160ms' }}>
                <p className="kpi-card__label">모두의 창업 선발 인원</p>
                <p className="kpi-card__value">
                  <CountUp value={20000} />
                  <small>명</small>
                </p>
                <p className="kpi-card__compare">2026 1만 5천 명 · 예비창업패키지는 통합</p>
                <span className="pill pill--outline">예정 · 예산안</span>
              </article>
            </div>
            <div className="arch__cta">
              <Link to="/changes" className="btn btn--white">
                2026 → 2027 전체 비교 보기 <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── 필요에서 출발 ───────── */}
      <section className="section">
        <div className="container">
          <SectionHeader
            art="coffee"
            label="Start from need"
            title={
              <>
                지금 가장 <Mark>급한 것 하나</Mark>를 골라 보세요
              </>
            }
            aside="여러 유형에 해당한다면 지금 가장 급한 문제를 기준으로 고르세요. 이자 부담이 크다면 대환이 먼저, 새 사업이 목표라면 지원금이 먼저입니다."
          />
          <div className="need-grid">
            {NEEDS.map((n, i) => (
              <Link key={n.purpose} to={`/programs?purpose=${n.purpose}`} className="need-card" data-reveal style={{ transitionDelay: `${i * 50}ms` }}>
                <strong>{n.label}</strong>
                <span>{n.hint}</span>
                <ArrowRight size={18} aria-hidden className="need-card__arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── 원작 도서 ───────── */}
      <section className="section section--cream">
        <div className="container book">
          <div className="book__cover" data-reveal>
            <Art name="bookCover" alt="《2027 1인사업자를 위한 정책자금·지원금 가이드》 표지" />
          </div>
          <div className="book__copy" data-reveal>
            <p className="section-label">The book</p>
            <h2 className="section-title">
              이 서비스는 <Mark>한 권의 책</Mark>에서 시작했습니다
            </h2>
            <p className="book__text">
              《2027 1인사업자를 위한 정책자금·지원금 가이드》는 직원 없이 혼자 일하는 사장님이 실제로 신청할 수 있는 대출, 보증, 지원금, 안전망만 골라, 각 제도마다
              "직원 없이도 가능한가"를 가장 먼저 표시한 책입니다. 이 사이트의 모든 제도 카드와 판정 조건은 이 원고에서 옮겼습니다.
            </p>
            <ul className="book__parts">
              <li>
                <b>PART 1</b> 기초와 2027년 변화, 자가진단
              </li>
              <li>
                <b>PART 2</b> 빌리는 돈 — 융자·보증
              </li>
              <li>
                <b>PART 3</b> 받는 돈 — 지원금·지원사업
              </li>
              <li>
                <b>PART 4</b> 지켜주는 돈 — 안전망
              </li>
              <li>
                <b>PART 5</b> 신청 실전
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── CTA 밴드 ───────── */}
      <section className="cta-band">
        <Art name="stamp" className="cta-band__art cta-band__art--l" />
        <Art name="document" className="cta-band__art cta-band__art--r" />
        <div className="container cta-band__inner" data-reveal>
          <h2 className="cta-band__title display">공고는 40쪽, 내 얘기는 어디에도 없었다면</h2>
          <p className="cta-band__sub">각 제도마다 "직원 없이도 가능한가"를 가장 먼저 확인해 드립니다.</p>
          <Link to="/diagnosis" className="btn btn--white btn--lg">
            무료 자가진단 시작하기 <ArrowRight size={20} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
