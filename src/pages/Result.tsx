import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Download, Info, ListChecks, Printer, RotateCcw } from 'lucide-react';
import MatchCard from '../components/MatchCard';
import Art from '../components/Art';
import SectionHeader, { Mark } from '../components/SectionHeader';
import { StatusBadge } from '../components/Badges';
import guide from '../data/guide.json';
import { answerChips } from '../lib/profileSummary';
import { alertsFor, evalCond, matchAll, statusLabel, statusRowId, toEvalProfile, topPicks } from '../lib/engine';
import { loadProfile } from '../lib/storage';
import { SITE_NAME } from '../lib/site';
import type { CategoryId, Cond, Status } from '../types';

const CATS = guide.categories as Record<CategoryId, { label: string }>;


export default function Result() {
  const profile = useMemo(() => loadProfile(), []);
  const [tab, setTab] = useState<Status>('eligible');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [onlyPurpose, setOnlyPurpose] = useState(false);

  const matches = useMemo(() => (profile ? matchAll(profile) : []), [profile]);

  if (!profile) {
    return (
      <section className="section">
        <div className="container empty">
          <Art name="coffee" className="empty__art" />
          <p className="section-label">Result</p>
          <h1 className="section-title">아직 진단 결과가 없어요</h1>
          <p className="empty__text">다섯 가지 질문 정도면 내 유형과 볼 만한 제도를 정리해 드립니다.</p>
          <Link to="/diagnosis" className="btn btn--primary btn--lg">
            무료 자가진단 시작하기 <ArrowRight size={20} aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const counts = {
    eligible: matches.filter((m) => m.status === 'eligible').length,
    check: matches.filter((m) => m.status === 'check').length,
    ineligible: matches.filter((m) => m.status === 'ineligible').length,
  };
  const picks = topPicks(matches, 3);
  const pickIds = new Set(picks.map((m) => m.program.id));
  const alerts = alertsFor(profile);
  const rowId = statusRowId(profile);
  const row = guide.statusMatrix.rows.find((r) => r.id === rowId);
  const ep = toEvalProfile(profile);
  const routes = guide.routes.filter((r) => evalCond(r.cond as Cond, ep) === 'pass');
  const purposeLabels = guide.purposeLabels as Record<string, string>;

  const filtered = (s: Status) =>
    matches.filter(
      (m) =>
        m.status === s &&
        (cat === 'all' || m.program.category === cat) &&
        (!onlyPurpose || m.purposeHits.length > 0),
    );

  const today = new Date().toLocaleDateString('ko-KR');

  return (
    <>
      <div className="print-only print-head">
        <strong>{SITE_NAME} — 자가진단 결과</strong>
        <span>출력일 {today}</span>
      </div>

      {/* ───────── 진단 요약 ───────── */}
      <section className="result-hero">
        <div className="container">
          <p className="section-label section-label--on-orange">Result</p>
          <div className="summary-card" data-reveal>
            <Art name="stamp" className="summary-card__art" />
            <h1 className="summary-card__title">
              사장님께 확인해 볼 만한 제도가 <Mark>{counts.eligible + counts.check}개</Mark> 있어요
            </h1>
            <ul className="chip-row" aria-label="내 응답 요약">
              {answerChips(profile).map((c) => (
                <li key={c} className="pill pill--outline">
                  {c}
                </li>
              ))}
              {profile.purposes?.map((x) => (
                <li key={x} className="pill pill--pale">
                  {purposeLabels[x]}
                </li>
              ))}
            </ul>

            <div className="count-grid">
              {(['eligible', 'check', 'ineligible'] as Status[]).map((s) => (
                <button
                  key={s}
                  className={`count-tile count-tile--${s} ${tab === s ? 'is-active' : ''}`}
                  onClick={() => {
                    setTab(s);
                    document.getElementById('all-results')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span className="count-tile__num">{counts[s]}</span>
                  <StatusBadge status={s} />
                </button>
              ))}
            </div>

            {row && (
              <div className="matrix">
                <p className="matrix__title">
                  내 상태 <b>{row.label}</b> — 원고 3장 "사업자 상태별 지원 가능 여부"
                </p>
                <div className="matrix__row">
                  {guide.statusMatrix.columns.map((c, i) => (
                    <div key={c} className={`matrix__cell matrix__cell--${row.values[i].replace('*', '')}`}>
                      <span>{c}</span>
                      <b>{row.values[i]}</b>
                    </div>
                  ))}
                </div>
                <p className="matrix__note">일반적인 경향입니다. 정확한 조건은 아래 제도별 카드와 공고를 확인하세요.</p>
              </div>
            )}

            <div className="summary-card__actions no-print">
              <Link to="/roadmap" className="btn btn--primary">
                나의 추천 신청 트랙 보기 <ArrowRight size={18} aria-hidden />
              </Link>
              <button className="btn btn--secondary" onClick={() => window.print()}>
                <Printer size={18} aria-hidden /> 인쇄하기
              </button>
              <button className="btn btn--secondary" onClick={() => window.print()} title="인쇄 창의 대상에서 'PDF로 저장'을 고르세요">
                <Download size={18} aria-hidden /> PDF로 저장
              </button>
              <Link to="/diagnosis" className="link-btn">
                <RotateCcw size={14} aria-hidden /> 다시 진단하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── 먼저 할 일 / 루트 ───────── */}
      {(alerts.length > 0 || routes.length > 0) && (
        <section className="section section--tight">
          <div className="container">
            {alerts.length > 0 && (
              <div className="alerts">
                {alerts.map((a) => (
                  <div key={a.title} className={`alert alert--${a.tone}`} data-reveal>
                    {a.tone === 'warn' ? <AlertTriangle size={22} aria-hidden /> : <Info size={22} aria-hidden />}
                    <div>
                      <p className="alert__title">{a.title}</p>
                      <p>{a.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {routes.length > 0 && (
              <div className="routes" data-reveal>
                <p className="routes__title">내 유형별 추천 루트 (원고 3장)</p>
                <div className="routes__list">
                  {routes.map((r) => (
                    <div key={r.id} className="route">
                      <span className="route__who">{r.label}</span>
                      <span className="route__step">
                        <b>먼저</b> {r.first}
                      </span>
                      <ArrowRight size={16} aria-hidden className="route__arrow" />
                      <span className="route__step">
                        <b>다음</b> {r.next}
                      </span>
                      <span className="route__ch">{r.chapters}</span>
                    </div>
                  ))}
                </div>
                <p className="routes__note">어떤 유형이든 안전망도 함께 보세요. 혼자 일하는 사업자에게 노란우산공제와 자영업자 고용보험은 대출보다 먼저 챙길 만한 제도입니다.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ───────── 우선 추천 ───────── */}
      {picks.length > 0 && (
        <section className="section section--cream">
          <div className="container">
            <SectionHeader
              label="Top picks"
              title={
                <>
                  자금 목적과 연결되는 <Mark>우선 추천</Mark>
                </>
              }
              aside="기본 조건에 부합하고, 고른 자금 목적과 연결되는 제도를 먼저 보여 드립니다. 판정은 원고의 조건과 응답만으로 계산한 참고 결과입니다."
            />
            <div className="card-grid card-grid--3">
              {picks.map((m) => (
                <MatchCard key={m.program.id} match={m} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── 전체 결과 ───────── */}
      <section className="section" id="all-results">
        <div className="container">
          <SectionHeader label="All results" title="전체 판정 결과" />

          <div className="tabs no-print" role="tablist" aria-label="판정 상태">
            {(['eligible', 'check', 'ineligible'] as Status[]).map((s) => (
              <button key={s} role="tab" aria-selected={tab === s} className={`tab ${tab === s ? 'is-active' : ''}`} onClick={() => setTab(s)}>
                {statusLabel[s]} <span className="tab__count">{filtered(s).length}</span>
              </button>
            ))}
          </div>

          <div className="filter-row no-print">
            <div className="chips" role="group" aria-label="지원 유형 필터">
              <button className={`chip ${cat === 'all' ? 'is-on' : ''}`} aria-pressed={cat === 'all'} onClick={() => setCat('all')}>
                전체
              </button>
              {(Object.keys(CATS) as CategoryId[]).map((c) => (
                <button key={c} className={`chip ${cat === c ? 'is-on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>
                  {CATS[c].label}
                </button>
              ))}
            </div>
            <label className="toggle">
              <input type="checkbox" checked={onlyPurpose} onChange={(e) => setOnlyPurpose(e.target.checked)} />
              <span className="toggle__track" aria-hidden />
              자금 목적과 연결된 것만
            </label>
          </div>

          {(['eligible', 'check', 'ineligible'] as Status[]).map((s) => {
            const list = filtered(s);
            return (
              <div key={s} className={`result-group ${tab === s ? '' : 'screen-hidden'}`}>
                <h3 className="print-only result-group__title">{statusLabel[s]}</h3>
                {list.length ? (
                  <div className="card-grid card-grid--3">
                    {list.map((m) => (
                      <MatchCard key={m.program.id} match={m} featured={pickIds.has(m.program.id)} />
                    ))}
                  </div>
                ) : (
                  <p className="empty__text">이 조건에 해당하는 제도가 없어요.</p>
                )}
              </div>
            );
          })}

          <div className="result-next no-print" data-reveal>
            <div>
              <p className="result-next__title">다음 단계: 신청 준비</p>
              <p>어떤 제도를 먼저 보고 무엇을 함께 준비할지 단계별 트랙으로 정리했어요. 제도마다 체크리스트로 준비할 수 있습니다.</p>
            </div>
            <Link to="/roadmap" className="btn btn--primary btn--lg">
              나의 추천 신청 트랙 보기 <ArrowRight size={20} aria-hidden />
            </Link>
            <Link to="/checklist?recommended=1" className="btn btn--secondary btn--lg">
              <ListChecks size={20} aria-hidden /> 체크리스트로 준비하기
            </Link>
          </div>

          <p className="notice">{guide.disclaimer}</p>
        </div>
      </section>
    </>
  );
}
