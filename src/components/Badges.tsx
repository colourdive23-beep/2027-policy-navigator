import { Check, CircleHelp, Clock, Minus, BadgeCheck } from 'lucide-react';
import guide from '../data/guide.json';
import { statusLabel } from '../lib/engine';
import type { Basis, CategoryId, Program, Status } from '../types';

const CATEGORIES = guide.categories as Record<CategoryId, { label: string; tone: string; desc: string }>;

export const categoryLabel = (c: CategoryId) => CATEGORIES[c]?.label ?? c;

export function CategoryBadge({ category }: { category: CategoryId }) {
  const c = CATEGORIES[category];
  return <span className={`pill pill--${c.tone === 'solid' ? 'pale-strong' : c.tone}`}>{c.label}</span>;
}

/** 자격 상태: 색 + 아이콘 + 텍스트 */
export function StatusBadge({ status, size }: { status: Status; size?: 'lg' }) {
  const Icon = status === 'eligible' ? Check : status === 'check' ? CircleHelp : Minus;
  return (
    <span className={`status status--${status} ${size === 'lg' ? 'status--lg' : ''}`}>
      <Icon size={size === 'lg' ? 16 : 14} strokeWidth={2.5} aria-hidden />
      {statusLabel[status]}
    </span>
  );
}

/** 확정 / 예정 구분 */
export function BasisBadge({ basis, label }: { basis: Basis; label?: string }) {
  return basis === 'announced' ? (
    <span className="pill pill--solid" title="2026년까지 공고·실적으로 확정된 정보">
      <BadgeCheck size={13} aria-hidden /> 확정 · {label ?? '2026 공고'}
    </span>
  ) : (
    <span className="pill pill--outline" title="2027 예산안 기준 — 국회 심의·공고 전">
      <Clock size={13} aria-hidden /> 예정 · {label ?? '2027 예산안'}
    </span>
  );
}

export function ProgramBadges({ program }: { program: Program }) {
  return (
    <div className="badge-row">
      <CategoryBadge category={program.category} />
      {program.isNew2027 && <span className="pill pill--outline">2027 신설</span>}
    </div>
  );
}

export const repayLabel = { repay: '갚아야 하는 돈', 'no-repay': '갚지 않는 돈', na: '가입·조정형' } as const;
