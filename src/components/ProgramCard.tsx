import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { Program } from '../types';
import { BasisBadge, CategoryBadge, repayLabel } from './Badges';

/** 정책 탐색 그리드 카드 */
export default function ProgramCard({ program }: { program: Program }) {
  const rows = [
    { label: '1인사업자', value: program.soloNote },
    { label: program.keyFact.label, value: program.keyFact.value },
    { label: '이런 사람에게', value: program.summary },
  ];
  return (
    <article className="pcard" data-reveal>
      <div className="pcard__badges">
        <CategoryBadge category={program.category} />
        {program.isNew2027 && <span className="pill pill--outline">2027 신설</span>}
        <span className="pcard__spacer" />
        <BasisBadge basis={program.basis} label={program.basis === 'announced' ? '2026' : '예산안'} />
      </div>
      <h3 className="pcard__title">
        <Link to={`/programs/${program.id}`} className="pcard__link">
          {program.name}
        </Link>
      </h3>
      <p className="pcard__agency">
        {program.agency} · {repayLabel[program.repay]}
      </p>
      <dl className="pcard__dl">
        {rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
      <span className="pcard__more" aria-hidden>
        자세히 보기 <ArrowRight size={16} />
      </span>
    </article>
  );
}
