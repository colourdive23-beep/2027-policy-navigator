import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, Download, Printer, RotateCcw } from 'lucide-react';
import { CategoryBadge, StatusBadge } from '../components/Badges';
import Art from '../components/Art';
import { matchOne } from '../lib/engine';
import { loadProfile } from '../lib/storage';
import { REQUIREMENT_LABEL, buildChecklist, progressOf, useProgramChecks, type CLItem, type CLStep } from '../lib/checklists';
import { COVERAGE_LABEL } from './ChecklistIndex';
import { SITE_NAME } from '../lib/site';

function ItemRow({ item, checked, onToggle }: { item: CLItem; checked: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const panelId = `panel-${item.id}`;
  const isConfirm = item.requirement === 'confirm';
  return (
    <li className={`cli ${checked ? 'is-done' : ''}`}>
      <div className="cli__row">
        <label className="cli__check">
          <input type="checkbox" checked={checked} onChange={onToggle} />
          <span className="check-item__box" aria-hidden>
            <Check size={16} strokeWidth={3} />
          </span>
          <span className="cli__title">
            {item.title}
            {isConfirm && <span className="sr-only"> (공식 공고 확인 필요 항목)</span>}
          </span>
        </label>
        <span className={`req req--${item.requirement}`}>{item.requirement === 'common' ? '공통 서류' : REQUIREMENT_LABEL[item.requirement]}</span>
        <button className="cli__toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          <span className="sr-only">{open ? '설명 접기' : '설명 펼치기'}: {item.title}</span>
          <ChevronDown size={20} aria-hidden />
        </button>
      </div>
      <div id={panelId} className="cli__panel" hidden={!open}>
        <dl>
          {item.condition && (
            <div>
              <dt>이 제도의 조건</dt>
              <dd>{item.condition}</dd>
            </div>
          )}
          {item.why && (
            <div>
              <dt>왜 필요한가요</dt>
              <dd>{item.why}</dd>
            </div>
          )}
          {item.how && (
            <div>
              <dt>어떻게 준비하나요</dt>
              <dd>{item.how}</dd>
            </div>
          )}
          {item.where && (
            <div>
              <dt>발급처·신청처</dt>
              <dd>
                {item.where}
                {item.url && (
                  <a className="cli__link no-print-after" href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.siteName ?? '공식 사이트'} 바로가기 <ArrowUpRight size={14} aria-hidden />
                    <span className="sr-only">(새 창)</span>
                  </a>
                )}
              </dd>
            </div>
          )}
          {item.caution && (
            <div>
              <dt>주의사항</dt>
              <dd>{item.caution}</dd>
            </div>
          )}
          <div>
            <dt>이 제도의 제출·확인 여부</dt>
            <dd>
              {REQUIREMENT_LABEL[item.requirement]}
              {item.note ? ` — ${item.note}` : ''}
              {item.requirement === 'common' && ' (원고 13장의 공통 서류입니다. 이 제도에서 제출하는지는 공고에서 확인하세요.)'}
              {item.requirement === 'confirm' && ' (원고에 확인된 내용이 없어 공식 공고에서 확인해야 합니다.)'}
            </dd>
          </div>
          <div>
            <dt>원고 출처</dt>
            <dd>{item.source}</dd>
          </div>
        </dl>
      </div>
    </li>
  );
}

function StepBlock({ step, checks, onToggle, open, setOpen }: { step: CLStep; checks: Record<string, boolean>; onToggle: (id: string) => void; open: boolean; setOpen: (v: boolean) => void }) {
  const done = step.items.filter((i) => checks[i.id]).length;
  const id = `step-${step.id}`;
  return (
    <section className={`step ${open ? 'is-open' : ''} ${done === step.items.length ? 'is-complete' : ''}`} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="step__h">
        <button className="step__head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          <span className="step__no">STEP {step.no}</span>
          <span className="step__title">{step.title}</span>
          <span className="step__count">
            {done}/{step.items.length}
          </span>
          <ChevronDown size={22} aria-hidden className="step__chev" />
        </button>
      </h2>
      <div id={id} className="step__body" hidden={!open}>
        {step.desc && <p className="step__desc">{step.desc}</p>}
        <ul className="cli-list">
          {step.items.map((it) => (
            <ItemRow key={it.id} item={it} checked={!!checks[it.id]} onToggle={() => onToggle(it.id)} />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function ChecklistDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFromApp = Boolean((location.state as { from?: string } | null)?.from);
  const cl = useMemo(() => buildChecklist(id), [id]);
  const { checks, toggle, reset } = useProgramChecks(id);
  const profile = useMemo(() => loadProfile(), []);
  const match = useMemo(() => (profile ? matchOne(profile, id) : undefined), [profile, id]);
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({ eligibility: true });

  if (!cl) {
    return (
      <section className="section">
        <div className="container empty">
          <h1 className="section-title">체크리스트를 찾을 수 없어요</h1>
          <Link to="/checklist" className="btn btn--primary">
            체크리스트 목록으로
          </Link>
        </div>
      </section>
    );
  }

  const progress = progressOf(cl, checks);
  const allOpen = cl.steps.every((s) => openSteps[s.id]);
  const today = new Date().toLocaleDateString('ko-KR');
  const back = () => (cameFromApp ? navigate(-1) : navigate('/checklist'));

  const resetThis = () => {
    if (window.confirm(`"${cl.program.name}" 체크리스트의 체크 상태를 모두 지울까요?`)) reset();
  };

  return (
    <>
      <div className="print-only print-head">
        <strong>
          {SITE_NAME} — {cl.meta.title}
        </strong>
        <span>출력일 {today}</span>
      </div>

      <section className="cl-hero">
        <div className="container">
          <button className="back-link no-print" onClick={back}>
            <ArrowLeft size={16} aria-hidden /> {cameFromApp ? '이전 화면으로' : '체크리스트 목록으로'}
          </button>
          <div className="cl-hero__grid">
            <div>
              <div className="badge-row">
                <CategoryBadge category={cl.program.category} />
                {match && <StatusBadge status={match.status} />}
                <span className={`cov cov--${cl.meta.requiredStatus}`}>{COVERAGE_LABEL[cl.meta.requiredStatus]}</span>
              </div>
              <h1 className="cl-hero__title">{cl.program.name}</h1>
              <p className="cl-hero__meta">
                {cl.meta.issuingOrganization} · {cl.trackLabel}
              </p>
              <p className="cl-hero__desc">{cl.meta.description}</p>
              <div className="cl-hero__links no-print">
                <Link to={`/programs/${cl.program.id}`} className="link-arrow">
                  제도 상세(10항목 카드) 보기 →
                </Link>
                {match && (
                  <Link to="/result" className="link-arrow">
                    내 진단 결과 보기 →
                  </Link>
                )}
              </div>
            </div>

            <div className="progress-card cl-progress">
              <Art name="document" className="cl-progress__art" />
              <p className="progress-card__label">준비 진행률</p>
              <p className="progress-card__pct">
                {progress.pct}
                <small>%</small>
              </p>
              <div className="progress progress--thick" role="progressbar" aria-label="준비 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.pct}>
                <span style={{ width: `${progress.pct}%` }} />
              </div>
              <p className="cl-progress__counts">
                준비 항목 <b>{progress.done}</b> / {progress.total}
                {progress.confirmTotal > 0 && (
                  <>
                    {' '}
                    · 공고 확인 항목 <b>{progress.confirmDone}</b> / {progress.confirmTotal}
                  </>
                )}
              </p>
              <p className="cl-progress__note">진행률은 원고에 근거한 준비 항목으로 계산하고, "공식 공고 확인 필요" 항목은 따로 셉니다.</p>
              <div className="progress-card__actions no-print">
                <button className="btn btn--secondary btn--sm" onClick={() => window.print()}>
                  <Printer size={16} aria-hidden /> 인쇄
                </button>
                <button className="btn btn--secondary btn--sm" onClick={() => window.print()} title="인쇄 창의 대상에서 'PDF로 저장'을 고르세요">
                  <Download size={16} aria-hidden /> PDF 저장
                </button>
                <button className="link-btn" onClick={resetThis}>
                  <RotateCcw size={14} aria-hidden /> 이 제도 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container cl-body">
          <div className="cl-toolbar no-print">
            <div className="req-legend" aria-label="항목 구분">
              <span className="req req--stated">원고 명시</span>
              <span className="req req--common">공통 서류</span>
              <span className="req req--confirm">공식 공고 확인 필요</span>
            </div>
            <button className="link-btn" onClick={() => setOpenSteps(allOpen ? {} : Object.fromEntries(cl.steps.map((s) => [s.id, true])))}>
              {allOpen ? '모두 접기' : '모두 펼치기'}
            </button>
          </div>

          {cl.steps.map((s) => (
            <StepBlock key={s.id} step={s} checks={checks} onToggle={toggle} open={!!openSteps[s.id]} setOpen={(v) => setOpenSteps((o) => ({ ...o, [s.id]: v }))} />
          ))}

          <div className="cl-apply" data-reveal>
            <div>
              <p className="cl-apply__title">공식 신청처</p>
              <p>
                {cl.program.apply.label}
                {cl.program.apply.note ? ` — ${cl.program.apply.note}` : ''}
              </p>
            </div>
            {cl.meta.officialUrl ? (
              <a className="btn btn--primary" href={cl.meta.officialUrl} target="_blank" rel="noopener noreferrer">
                공식 신청처로 이동 <ArrowUpRight size={18} aria-hidden />
                <span className="sr-only">(새 창)</span>
              </a>
            ) : (
              <span className="btn btn--disabled">공고 후 신청처 안내</span>
            )}
          </div>
          <p className="notice">
            이 체크리스트는 원고({cl.meta.sourceReference})를 바탕으로 만든 준비 도구입니다. 제출 서류·신청 조건·심사 기준은 공고마다 다를 수 있으니, 신청 전에는 반드시 공식 공고를 확인하세요. 책·서비스와 공고가
            다를 때는 언제나 공고가 우선입니다.
          </p>
        </div>
      </section>
    </>
  );
}
