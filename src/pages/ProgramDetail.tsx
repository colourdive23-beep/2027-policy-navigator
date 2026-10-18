import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CircleHelp, Clock, Minus } from 'lucide-react';
import { BasisBadge, CategoryBadge, StatusBadge, repayLabel } from '../components/Badges';
import ProgramCard from '../components/ProgramCard';
import { PROGRAMS, matchOne } from '../lib/engine';
import { buildChecklist, progressOf } from '../lib/checklists';
import { loadProfile } from '../lib/storage';
import Art, { type ArtName } from '../components/Art';
import type { CategoryId } from '../types';

const CATEGORY_ART: Record<CategoryId, ArtName> = {
  loan: 'coins',
  guarantee: 'stamp',
  microfinance: 'coins',
  debt: 'document',
  grant: 'folder',
  support: 'laptop',
  safety: 'coffee',
};

const CIRCLED =['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫'];

export default function ProgramDetail() {
  const { id } = useParams();
  const program = PROGRAMS.find((p) => p.id === id);
  const profile = useMemo(() => loadProfile(), []);
  const match = useMemo(() => (profile && id ? matchOne(profile, id) : undefined), [profile, id]);

  if (!program) {
    return (
      <section className="section">
        <div className="container empty">
          <h1 className="section-title">제도를 찾을 수 없어요</h1>
          <Link to="/programs" className="btn btn--primary">
            정책 탐색으로
          </Link>
        </div>
      </section>
    );
  }

  const related = PROGRAMS.filter((p) => p.category === program.category && p.id !== program.id).slice(0, 3);
  const checklist = buildChecklist(program.id);
  const prep = checklist ? progressOf(checklist) : undefined;

  return (
    <>
      <section className="detail-hero">
        <div className="container detail-hero__inner">
          <Art name={CATEGORY_ART[program.category]} className="detail-hero__art" />
          <Link to="/programs" className="back-link no-print">
            <ArrowLeft size={16} aria-hidden /> 정책 탐색
          </Link>
          <div className="badge-row">
            <CategoryBadge category={program.category} />
            {program.isNew2027 && <span className="pill pill--outline">2027 신설</span>}
            <BasisBadge basis={program.basis} label={program.basisLabel} />
          </div>
          <h1 className="detail-hero__title">
            {program.name}
            {program.aka && <small> ({program.aka})</small>}
          </h1>
          <p className="detail-hero__agency">
            {program.agency}
            {program.method ? ` · ${program.method}` : ''} · {repayLabel[program.repay]} · 원고 {program.chapter}
          </p>
          <div className="detail-hero__facts">
            <div>
              <span>1인사업자</span>
              <b>{program.soloNote}</b>
            </div>
            <div>
              <span>{program.keyFact.label}</span>
              <b>{program.keyFact.value}</b>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container detail-layout">
          <div className="detail-main">
            {match && (
              <div className={`my-status my-status--${match.status}`} data-reveal>
                <div className="my-status__head">
                  <p className="my-status__title">내 진단 결과로 보면</p>
                  <StatusBadge status={match.status} size="lg" />
                </div>
                <ul className="crit-list">
                  {match.criteria.map((c) => (
                    <li key={c.label + c.text} className={`crit crit--${c.result}`}>
                      {c.result === 'pass' ? <Check size={16} aria-hidden /> : c.result === 'fail' ? <Minus size={16} aria-hidden /> : <CircleHelp size={16} aria-hidden />}
                      <span>
                        <b>{c.label}</b> {c.text}
                      </span>
                      <span className="sr-only">({c.result === 'pass' ? '충족' : c.result === 'fail' ? '미충족' : '확인 필요'})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="info-card" data-reveal>
              <h2 className="info-card__title">10항목 카드</h2>
              <p className="info-card__sub">{program.basisLabel} · 숫자는 참고값이며 공고가 우선합니다</p>
              <dl className="ten">
                {program.card.map((row, i) => (
                  <div key={row.label} className="ten__row">
                    <dt>
                      <span className="ten__no">{CIRCLED[i]}</span>
                      {row.label}
                    </dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {program.change2027 && (
              <div className="change-box" data-reveal>
                <p className="change-box__title">
                  <Clock size={18} aria-hidden /> 2027 변화 <span className="pill pill--outline">예정</span>
                </p>
                <p>{program.change2027}</p>
              </div>
            )}

            <div className="info-card" data-reveal>
              <h2 className="info-card__title">신청 전 추가 확인사항</h2>
              <ul className="check-list">
                {program.needsAnnouncement && (
                  <li>
                    <CircleHelp size={16} aria-hidden />
                    {program.isNew2027 ? '2027년 신설 사업 — 대상·금액·신청 방법은 공고에서 확정됩니다' : '세부 조건이 지역·상품별로 달라 공고 원문 확인이 필요합니다'}
                  </li>
                )}
                {program.checks.map((c) => (
                  <li key={c}>
                    <CircleHelp size={16} aria-hidden /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="detail-side">
            <div className="side-card" data-reveal>
              <p className="side-card__title">공식 신청처</p>
              <p className="side-card__dest">{program.apply.label}</p>
              {program.apply.note && <p className="side-card__note">{program.apply.note}</p>}
              {program.apply.url ? (
                <a className="btn btn--primary btn--block" href={program.apply.url} target="_blank" rel="noopener noreferrer">
                  공식 신청처로 이동 <ArrowUpRight size={18} aria-hidden />
                  <span className="sr-only">(새 창)</span>
                </a>
              ) : (
                <span className="btn btn--disabled btn--block">공고 후 신청처 안내</span>
              )}
              <p className="side-card__note">신청 전에는 반드시 해당 기관의 최신 공고와 상담 창구를 확인하세요.</p>
            </div>

            {checklist && (
              <div className="side-card side-card--prep" data-reveal>
                <p className="side-card__title">신청 준비 체크리스트</p>
                <div className="progress" role="progressbar" aria-label="준비 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={prep!.pct}>
                  <span style={{ width: `${prep!.pct}%` }} />
                </div>
                <p className="side-card__note">
                  {prep!.pct}% · 준비 항목 {prep!.done} / {prep!.total}
                  {prep!.confirmTotal > 0 ? ` · 공고 확인 ${prep!.confirmDone} / ${prep!.confirmTotal}` : ''}
                </p>
                <Link to={`/checklist/${program.id}`} state={{ from: 'program' }} className="btn btn--primary btn--block">
                  이 제도 신청 준비하기 <ArrowRight size={18} aria-hidden />
                </Link>
              </div>
            )}

            {!profile && (
              <div className="side-card side-card--pale" data-reveal>
                <p className="side-card__title">내가 해당되는지 궁금하다면</p>
                <p className="side-card__note">자가진단을 하면 이 제도의 조건별 충족 여부를 보여 드려요.</p>
                <Link to="/diagnosis" className="btn btn--secondary btn--block">
                  자가진단 하기
                </Link>
              </div>
            )}

            {program.sources && <p className="sources">출처: {program.sources.join(', ')}</p>}
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section section--cream no-print">
          <div className="container">
            <p className="section-label">Related</p>
            <h2 className="section-title section-title--sm">같은 유형의 제도</h2>
            <div className="card-grid card-grid--3">
              {related.map((p) => (
                <ProgramCard key={p.id} program={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
