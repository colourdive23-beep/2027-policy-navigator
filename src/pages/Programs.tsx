import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import ProgramCard from '../components/ProgramCard';
import SectionHeader, { Mark } from '../components/SectionHeader';
import guide from '../data/guide.json';
import { PROGRAMS } from '../lib/engine';
import type { CategoryId, Purpose } from '../types';

const CATS = guide.categories as Record<CategoryId, { label: string; desc: string }>;
const PURPOSES = guide.purposeLabels as Record<Purpose, string>;

export default function Programs() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = (params.get('cat') ?? 'all') as CategoryId | 'all';
  const purpose = (params.get('purpose') ?? 'all') as Purpose | 'all';
  const basis = params.get('basis') ?? 'all';
  const solo = params.get('solo') ?? 'all';

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROGRAMS.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (purpose !== 'all' && !p.purposes.includes(purpose)) return false;
      if (basis === 'announced' && p.basis !== 'announced') return false;
      if (basis === 'proposal' && p.basis !== 'proposal') return false;
      if (basis === 'new' && !p.isNew2027) return false;
      if (solo !== 'all' && p.solo !== solo) return false;
      if (!needle) return true;
      const hay = [p.name, p.aka, p.agency, p.summary, p.keyFact.value, ...(p.tags ?? []), ...p.card.map((c) => c.value)]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    }).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [q, cat, purpose, basis, solo]);

  const anyFilter = q || cat !== 'all' || purpose !== 'all' || basis !== 'all' || solo !== 'all';

  return (
    <section className="section section--cream section--page">
      <div className="container">
        <SectionHeader
          as="h1"
          art="laptop"
          label="Policy Finder"
          title={
            <>
              1인사업자가 실제로 신청할 수 있는 <Mark>{PROGRAMS.length}개 제도</Mark>
            </>
          }
          aside="원고의 10항목 카드를 그대로 옮겼습니다. 카드의 숫자는 2026년 공고 기준 참고값이며, 2027년 예산안 사업은 '예정'으로 표시합니다."
        />

        <div className="finder" data-reveal>
          <div className="search">
            <Search size={20} aria-hidden />
            <label htmlFor="program-search" className="sr-only">
              제도 검색
            </label>
            <input
              id="program-search"
              type="search"
              placeholder="제도명, 기관, 키워드 검색 (예: 대환, 보증, 굿즈)"
              value={q}
              onChange={(e) => set('q', e.target.value)}
            />
          </div>

          <div className="chips chips--scroll" role="group" aria-label="지원 유형">
            <button className={`chip ${cat === 'all' ? 'is-on' : ''}`} aria-pressed={cat === 'all'} onClick={() => set('cat', 'all')}>
              전체
            </button>
            {(Object.keys(CATS) as CategoryId[]).map((c) => (
              <button key={c} className={`chip ${cat === c ? 'is-on' : ''}`} aria-pressed={cat === c} onClick={() => set('cat', c)} title={CATS[c].desc}>
                {CATS[c].label}
              </button>
            ))}
          </div>

          <div className="selects">
            <label className="select">
              <span>자금 목적</span>
              <select value={purpose} onChange={(e) => set('purpose', e.target.value)}>
                <option value="all">전체</option>
                {(Object.keys(PURPOSES) as Purpose[]).map((x) => (
                  <option key={x} value={x}>
                    {PURPOSES[x]}
                  </option>
                ))}
              </select>
            </label>
            <label className="select">
              <span>1인사업자</span>
              <select value={solo} onChange={(e) => set('solo', e.target.value)}>
                <option value="all">전체</option>
                <option value="possible">가능</option>
                <option value="conditional">조건부</option>
                <option value="difficult">어려움</option>
              </select>
            </label>
            <label className="select">
              <span>정보 기준</span>
              <select value={basis} onChange={(e) => set('basis', e.target.value)}>
                <option value="all">전체</option>
                <option value="announced">확정 (2026 공고)</option>
                <option value="proposal">예정 (2027 예산안)</option>
                <option value="new">2027 신설</option>
              </select>
            </label>
            {anyFilter && (
              <button className="link-btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                <X size={14} aria-hidden /> 필터 초기화
              </button>
            )}
          </div>
        </div>

        <p className="result-count" aria-live="polite">
          <b>{list.length}</b>개 제도
        </p>

        {list.length ? (
          <div className="card-grid card-grid--3">
            {list.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Search size={40} aria-hidden />
            <p className="empty__text">조건에 맞는 제도가 없어요. 검색어나 필터를 바꿔 보세요.</p>
            <button className="btn btn--secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
