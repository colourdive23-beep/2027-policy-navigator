import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Clock, ThumbsUp, TriangleAlert } from 'lucide-react';
import SectionHeader, { Mark } from '../components/SectionHeader';
import { PairBars, SingleBars } from '../components/Charts';
import changes from '../data/changes2027.json';

const StatusPill = ({ status }: { status: string }) =>
  status === 'confirmed' ? (
    <span className="pill pill--solid">
      <BadgeCheck size={13} aria-hidden /> 확정
    </span>
  ) : (
    <span className="pill pill--outline">
      <Clock size={13} aria-hidden /> 예정
    </span>
  );

export default function Changes() {
  const h = changes.headline;
  return (
    <>
      <section className="section section--page">
        <div className="container">
          <SectionHeader
            as="h1"
            art="folder"
            label="2027 Change"
            title={
              <>
                2026 → 2027, <Mark>무엇이 바뀌었나</Mark>
              </>
            }
            aside={`이 페이지의 2027년 수치는 ${changes.asOf}입니다. 국회 심의를 거쳐 12월에 확정되며, 확정 전까지는 모두 '예정'으로 표시합니다.`}
          />
          <div className="legend-box" data-reveal>
            <span>
              <span className="pill pill--solid">
                <BadgeCheck size={13} aria-hidden /> 확정
              </span>
              2026년 본예산·공고·실적
            </span>
            <span>
              <span className="pill pill--outline">
                <Clock size={13} aria-hidden /> 예정
              </span>
              2027년 예산안 (국회 심의 전)
            </span>
          </div>
        </div>
      </section>

      <section className="section section--arch-top section--flush">
        <div className="arch arch--tall">
          <div className="container">
            <div className="kpi-grid kpi-grid--overlap">
              <article className="kpi-card kpi-card--wide" data-reveal>
                <p className="kpi-card__label">{h.label}</p>
                <div className="vs">
                  <div className="vs__side">
                    <StatusPill status={h.y2026.status} />
                    <p className="vs__year">2026</p>
                    <p className="vs__val">{h.y2026.text}</p>
                  </div>
                  <ArrowRight className="vs__arrow" size={28} aria-hidden />
                  <div className="vs__side vs__side--to">
                    <StatusPill status={h.y2027.status} />
                    <p className="vs__year">2027</p>
                    <p className="vs__val">
                      <mark className="hl">{h.y2027.text}</mark>
                    </p>
                  </div>
                </div>
                <p className="kpi-card__big">
                  {h.delta}
                  <small> 증가 (예산안)</small>
                </p>
              </article>
              {changes.kpis.map((k, i) => (
                <article key={k.label} className="kpi-card" data-reveal style={{ transitionDelay: `${(i + 1) * 80}ms` }}>
                  <p className="kpi-card__label">{k.label}</p>
                  <p className="kpi-card__value kpi-card__value--text">{k.y2027}</p>
                  <p className="kpi-card__compare">2026 {k.y2026}</p>
                  <StatusPill status={k.status2027} />
                </article>
              ))}
            </div>

            <div className="chart-grid">
              <div className="chart-card" data-reveal>
                <h2 className="chart-card__title">{changes.startupBudget.title}</h2>
                <PairBars rows={changes.startupBudget.rows} unit={changes.startupBudget.unit} title={changes.startupBudget.title} />
              </div>
              <div className="chart-card" data-reveal>
                <h2 className="chart-card__title">{changes.newPrograms.title}</h2>
                <SingleBars rows={changes.newPrograms.rows} unit={changes.newPrograms.unit} title={changes.newPrograms.title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            label="As-is → To-be"
            title={
              <>
                돈을 <Mark>나눠주는 방식</Mark>이 바뀝니다
              </>
            }
            aside="소액으로 넓게 나눠주던 사업을 줄이고, 창업부터 재도전까지 단계별로 몰아주는 구조입니다."
          />
          <div className="compare-list">
            {changes.comparisons.map((c) => (
              <article key={c.area} className="compare" data-reveal>
                <h3 className="compare__area">{c.area}</h3>
                <div className="compare__cols">
                  <div className="compare__col">
                    <span className="pill pill--grey">2026 · 확정</span>
                    <p>{c.y2026}</p>
                  </div>
                  <ArrowRight className="compare__arrow" size={24} aria-hidden />
                  <div className="compare__col compare__col--to">
                    <span className="pill pill--solid-orange">2027 · {c.status2027 === 'confirmed' ? '확정' : '예정'}</span>
                    <p>
                      <b>{c.y2027}</b>
                    </p>
                  </div>
                </div>
                <p className="compare__point">{c.point}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHeader label="For solo owners" title="1인사업자에게 유리해진 것, 주의할 것" />
          <div className="two-col">
            <div className="info-card" data-reveal>
              <h3 className="info-card__title">
                <ThumbsUp size={20} aria-hidden /> 유리해진 것
              </h3>
              <ul className="dot-list">
                {changes.goodNews.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div className="info-card" data-reveal>
              <h3 className="info-card__title">
                <TriangleAlert size={20} aria-hidden /> 주의할 것
              </h3>
              <ul className="dot-list">
                {changes.cautions.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            art="coffee"
            label="Calendar"
            title={
              <>
                큰 사업은 <Mark>해마다 비슷한 시기</Mark>에 열립니다
              </>
            }
            aside="2026년에 실제로 있었던 일정입니다. 날짜는 해마다 조금씩 달라지지만 월 단위 순서는 크게 바뀌지 않습니다."
          />
          <ol className="timeline">
            {changes.calendar.map((c) => (
              <li key={c.when} className="timeline__item" data-reveal>
                <span className="timeline__when">{c.when}</span>
                <div>
                  <p className="timeline__event">{c.event}</p>
                  <p className="timeline__todo">→ {c.todo}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="sources">출처: {changes.sources}</p>
          <div className="center">
            <Link to="/diagnosis" className="btn btn--primary btn--lg">
              내게 맞는 2027 제도 진단하기 <ArrowRight size={20} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
