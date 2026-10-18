import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, RotateCcw, Search, X } from 'lucide-react';
import SectionHeader, { Mark } from '../components/SectionHeader';
import { CategoryBadge, StatusBadge } from '../components/Badges';
import guide from '../data/guide.json';
import { matchAll } from '../lib/engine';
import { loadProfile } from '../lib/storage';
import { PROGRAM_CHECKLISTS, buildChecklist, progressOf, readChecks, resetAllChecks, useChecklistVersion } from '../lib/checklists';
import type { CategoryId, Status } from '../types';

const CATS = guide.categories as Record<CategoryId, { label: string }>;

export const COVERAGE_LABEL = {
  manuscript: '원고 기반 상세',
  partial: '일부 공고 확인 필요',
  announcement: '공고 전 · 기본 항목만',
} as const;

export default function ChecklistIndex() {
  const [params, setParams] = useSearchParams();
  const version = useChecklistVersion();
  const q = params.get('q') ?? '';
  const cat = (params.get('cat') ?? 'all') as CategoryId | 'all';
  const recommended = params.get('recommended') === '1';
  const started = params.get('started') === '1';

  // 진단 결과는 렌더링마다 다시 읽습니다 (같은 화면에 머무는 동안 새로 진단해도 반영)
  const profile = loadProfile();
  const profileKey = JSON.stringify(profile);
  const statusMap = useMemo(() => {
    const m = new Map<string, Status>();
    const p = JSON.parse(profileKey);
    if (p) for (const x of matchAll(p)) m.set(x.program.id, x.status);
    return m;
  }, [profileKey]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (!value || value === 'all' || value === '0') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    void version;
    return PROGRAM_CHECKLISTS.map((meta) => {
      const cl = buildChecklist(meta.programId)!;
      return { cl, progress: progressOf(cl, readChecks(meta.programId)), status: statusMap.get(meta.programId) };
    });
  }, [version, statusMap]);

  const list = rows
    .filter(({ cl, progress, status }) => {
      const p = cl.program;
      if (cat !== 'all' && p.category !== cat) return false;
      if (recommended && !(status === 'eligible' || status === 'check')) return false;
      if (started && !progress.started) return false;
      const needle = q.trim().toLowerCase();
      if (needle && ![p.name, p.aka, p.agency, cl.meta.title, ...(p.tags ?? [])].join(' ').toLowerCase().includes(needle)) return false;
      return true;
    })
    .sort((a, b) => {
      const w = (s?: Status) => (s === 'eligible' ? 2 : s === 'check' ? 1 : 0);
      return Number(b.progress.started) - Number(a.progress.started) || w(b.status) - w(a.status) || (b.cl.program.priority ?? 0) - (a.cl.program.priority ?? 0);
    });

  const startedCount = rows.filter((r) => r.progress.started).length;
  const anyFilter = q || cat !== 'all' || recommended || started;

  const resetAll = () => {
    if (window.confirm('모든 제도의 체크 상태를 지웁니다. 되돌릴 수 없어요. 전체 초기화할까요?')) resetAllChecks();
  };

  return (
    <section className="section section--page cl-index">
      <div className="container">
        <SectionHeader
          as="h1"
          art="document"
          label="Checklist"
          title={
            <>
              내 지원사업 <Mark>신청 준비</Mark> 체크리스트
            </>
          }
          aside="신청하려는 제도를 선택하고, 필요한 준비사항을 하나씩 확인해 보세요."
        />

        <div className="cl-summary" data-reveal>
          <p>
            준비 중인 제도 <b>{startedCount}</b>개 · 전체 <b>{rows.length}</b>개 제도
          </p>
          <p className="cl-summary__note">체크 상태는 제도별로 이 브라우저에 따로 저장됩니다.</p>
          {startedCount > 0 && (
            <button className="link-btn" onClick={resetAll}>
              <RotateCcw size={14} aria-hidden /> 전체 초기화
            </button>
          )}
        </div>

        <div className="finder" data-reveal>
          <div className="search">
            <Search size={20} aria-hidden />
            <label htmlFor="cl-search" className="sr-only">
              제도명 검색
            </label>
            <input id="cl-search" type="search" placeholder="제도명 검색 (예: 경영안정, 초기창업, 노란우산)" value={q} onChange={(e) => set('q', e.target.value)} />
          </div>
          <div className="chips chips--scroll" role="group" aria-label="지원 유형">
            <button className={`chip ${cat === 'all' ? 'is-on' : ''}`} aria-pressed={cat === 'all'} onClick={() => set('cat', 'all')}>
              전체
            </button>
            {(Object.keys(CATS) as CategoryId[]).map((c) => (
              <button key={c} className={`chip ${cat === c ? 'is-on' : ''}`} aria-pressed={cat === c} onClick={() => set('cat', c)}>
                {CATS[c].label}
              </button>
            ))}
          </div>
          <div className="selects">
            <label className="toggle">
              <input type="checkbox" checked={recommended} disabled={!profile} onChange={(e) => set('recommended', e.target.checked ? '1' : '0')} />
              <span className="toggle__track" aria-hidden />
              추천받은 제도만
            </label>
            <label className="toggle">
              <input type="checkbox" checked={started} onChange={(e) => set('started', e.target.checked ? '1' : '0')} />
              <span className="toggle__track" aria-hidden />
              준비 중인 제도만
            </label>
            {!profile && (
              <Link to="/diagnosis" className="link-arrow">
                자가진단하면 추천 제도만 볼 수 있어요 →
              </Link>
            )}
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
            {list.map(({ cl, progress, status }) => (
              <article key={cl.meta.programId} className="clcard" data-reveal>
                <div className="pcard__badges">
                  <CategoryBadge category={cl.program.category} />
                  {status && status !== 'ineligible' && <StatusBadge status={status} />}
                  <span className="pcard__spacer" />
                  <span className={`cov cov--${cl.meta.requiredStatus}`}>{COVERAGE_LABEL[cl.meta.requiredStatus]}</span>
                </div>
                <h2 className="clcard__title">
                  <Link to={`/checklist/${cl.meta.programId}`} className="pcard__link">
                    {cl.program.name}
                  </Link>
                </h2>
                <p className="clcard__agency">{cl.meta.issuingOrganization}</p>
                <div className="clcard__progress">
                  <div className="progress" role="progressbar" aria-label={`${cl.program.name} 준비 진행률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct}>
                    <span style={{ width: `${progress.pct}%` }} />
                  </div>
                  <p className="clcard__count">
                    <b>{progress.pct}%</b> · 준비 항목 {progress.done} / {progress.total}
                    {progress.confirmTotal > 0 && (
                      <span>
                        {' '}
                        · 공고 확인 {progress.confirmDone} / {progress.confirmTotal}
                      </span>
                    )}
                  </p>
                </div>
                <span className="clcard__more" aria-hidden>
                  상세 체크리스트 보기 <ArrowRight size={16} />
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Search size={40} aria-hidden />
            <p className="empty__text">조건에 맞는 제도가 없어요. 검색어나 필터를 바꿔 보세요.</p>
          </div>
        )}
      </div>
    </section>
  );
}
