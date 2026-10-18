import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, CircleHelp, Minus } from 'lucide-react';
import type { Match } from '../types';
import { BasisBadge, CategoryBadge, StatusBadge } from './Badges';

interface Props {
  match: Match;
  featured?: boolean;
}

/** 진단 결과 카드: 상태 + 추천 근거 + 추가 확인 조건 + 공식 신청처 */
export default function MatchCard({ match, featured }: Props) {
  const { program: p, status, reasons, checks, failures } = match;
  return (
    <article className={`mcard ${featured ? 'mcard--featured' : ''} mcard--${status}`} data-reveal>
      <div className="mcard__badges">
        {featured && <span className="pill pill--solid">추천</span>}
        <StatusBadge status={status} />
        <CategoryBadge category={p.category} />
        <span className="pcard__spacer" />
        <BasisBadge basis={p.basis} label={p.basis === 'announced' ? '2026' : '예산안'} />
      </div>

      <h3 className="mcard__title">{p.name}</h3>
      <p className="mcard__agency">
        {p.agency}
        {p.method ? ` · ${p.method}` : ''}
      </p>
      <p className="mcard__fact">
        <span>{p.keyFact.label}</span> {p.keyFact.value}
      </p>

      {status !== 'ineligible' && reasons.length > 0 && (
        <div className="mcard__box mcard__box--reason">
          <p className="mcard__box-title">추천 근거</p>
          <ul>
            {reasons.slice(0, 4).map((r) => (
              <li key={r}>
                <Check size={16} aria-hidden /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status === 'ineligible' && failures.length > 0 && (
        <div className="mcard__box mcard__box--fail">
          <p className="mcard__box-title">충족하지 못한 조건</p>
          <ul>
            {failures.map((r) => (
              <li key={r}>
                <Minus size={16} aria-hidden /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status !== 'ineligible' && checks.length > 0 && (
        <div className="mcard__box mcard__box--check">
          <p className="mcard__box-title">추가 확인이 필요한 조건</p>
          <ul>
            {checks.slice(0, 4).map((r) => (
              <li key={r}>
                <CircleHelp size={16} aria-hidden /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mcard__actions no-print">
        <Link to={`/programs/${p.id}`} className="btn btn--ghost btn--sm">
          상세 보기
        </Link>
        {p.apply.url ? (
          <a className="btn btn--secondary btn--sm btn--grow" href={p.apply.url} target="_blank" rel="noopener noreferrer">
            공식 신청처로 이동 <ArrowUpRight size={16} aria-hidden />
            <span className="sr-only">(새 창)</span>
          </a>
        ) : (
          <span className="btn btn--disabled btn--sm btn--grow">공고 후 신청처 안내</span>
        )}
      </div>
      <p className="mcard__dest">
        {p.apply.label}
        {p.apply.note ? ` — ${p.apply.note}` : ''}
      </p>
      {status !== 'ineligible' && (
        <Link to={`/checklist/${p.id}`} state={{ from: 'result' }} className="mcard__prep no-print">
          이 제도 신청 준비하기 <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </article>
  );
}
