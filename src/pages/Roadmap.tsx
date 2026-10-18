import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Download, Pencil, Printer } from 'lucide-react';
import Art from '../components/Art';
import { CategoryBadge } from '../components/Badges';
import { Mark } from '../components/SectionHeader';
import guide from '../data/guide.json';
import checklistLibrary from '../data/checklist-library.json';
import { loadProfile } from '../lib/storage';
import { SITE_NAME } from '../lib/site';
import { useChecklistVersion } from '../lib/checklists';
import { answerChips, financeChips } from '../lib/profileSummary';
import {
  OVERLAP_LABEL,
  RECOMMENDATION_LABEL,
  RELATION_LABEL,
  buildRoadmap,
  readBasics,
  writeBasics,
  type Phase,
  type RelationTag,
  type RoadmapItem,
} from '../lib/roadmap';

const SITES = checklistLibrary.sites as Record<string, { name: string; url: string }>;
const PURPOSES = guide.purposeLabels as Record<string, string>;

function ItemCard({ it }: { it: RoadmapItem }) {
  const [open, setOpen] = useState(false);
  const p = it.match.program;
  const r = it.rule;
  const id = `rm-${p.id}`;
  const deadline = r.applicationDeadline.reference;
  return (
    <article className={`rmcard rmcard--${it.recommendation}`}>
      <div className="rmcard__badges">
        <span className={`rec rec--${it.recommendation}`}>{RECOMMENDATION_LABEL[it.recommendation]}</span>
        <CategoryBadge category={p.category} />
      </div>
      <h4 className="rmcard__title">{p.name}</h4>
      <p className="rmcard__reason">{r.priorityReason}</p>
      {it.unlockText && <p className="rmcard__unlock">{it.unlockText}</p>}

      <dl className="rmcard__facts">
        <div>
          <dt>신청 일정</dt>
          <dd>
            <b>2027: 공고 확인 필요</b>
            {deadline && <span className="rmcard__ref">참고 {deadline}</span>}
          </dd>
        </div>
        {(it.prerequisites.length > 0 || r.prerequisiteConditions.length > 0) && (
          <div>
            <dt>먼저 필요한 것</dt>
            <dd>
              <ul>
                {it.prerequisites.map((x) => (
                  <li key={x.programId}>
                    {x.relation === 'required' ? '먼저 완료: ' : '조건부: '}
                    {x.inRoadmap ? <b>{x.name}</b> : x.name} — {x.text}
                  </li>
                ))}
                {r.prerequisiteConditions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      <ul className="rel-tags" aria-label="다른 제도와의 관계">
        {it.tags.map((t) => (
          <li key={t} className={`rel rel--${t}`}>
            {RELATION_LABEL[t]}
          </li>
        ))}
      </ul>

      <button className="rmcard__more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        병행·중복수혜·준비 기간 {open ? '접기' : '보기'} <ChevronDown size={16} aria-hidden />
      </button>
      <div id={id} className="rmcard__detail" hidden={!open}>
        <dl>
          <div>
            <dt>병행 신청</dt>
            <dd>{r.parallelApplicationStatus.text}</dd>
          </div>
          <div>
            <dt>중복수혜 제한</dt>
            <dd>
              <ul>
                {r.overlapRestrictions.map((o) => (
                  <li key={o.text}>
                    <span className={`ovl ovl--${o.type}`}>{OVERLAP_LABEL[o.type]}</span> {o.text}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          {r.estimatedPreparationSteps.length > 0 && (
            <div>
              <dt>준비 단계·기간</dt>
              <dd>
                <ul>
                  {r.estimatedPreparationSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          <div>
            <dt>원고 출처</dt>
            <dd>
              {r.sourceReference} · {r.verificationStatus === 'manuscript' ? '원고 확인' : r.verificationStatus === 'partial' ? '일부 공고 확인 필요' : '공고 전'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rmcard__progress">
        <div className="progress" role="progressbar" aria-label={`${p.name} 준비 진행률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={it.progress.pct}>
          <span style={{ width: `${it.progress.pct}%` }} />
        </div>
        <p>
          준비 {it.progress.pct}% · {it.progress.done}/{it.progress.total}
          {it.progress.pct === 100 && <b> · 준비 항목 완료</b>}
        </p>
      </div>
      <div className="rmcard__actions no-print">
        <Link to={`/checklist/${p.id}`} state={{ from: 'roadmap' }} className="btn btn--primary btn--sm">
          체크리스트 <ArrowRight size={16} aria-hidden />
        </Link>
        <Link to={`/programs/${p.id}`} className="btn btn--secondary btn--sm">
          공식 신청방법 보기
        </Link>
      </div>
    </article>
  );
}

function phaseState(ph: Phase, basics: Record<string, boolean>) {
  const items = ph.lanes.flatMap((l) => l.items);
  const tasks = ph.tasks ?? [];
  const totalUnits = items.length + tasks.length;
  if (!totalUnits) return 'idle';
  const done = items.filter((i) => i.progress.total > 0 && i.progress.pct === 100).length + tasks.filter((t) => basics[t.id]).length;
  const started = items.some((i) => i.progress.started) || tasks.some((t) => basics[t.id]);
  return done === totalUnits ? 'done' : started ? 'doing' : 'idle';
}

export default function Roadmap() {
  const version = useChecklistVersion();
  const profile = loadProfile();
  const key = JSON.stringify(profile);
  const [basics, setBasics] = useState<Record<string, boolean>>(() => readBasics());
  const roadmap = useMemo(() => {
    void version;
    return profile ? buildRoadmap(JSON.parse(key)) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  if (!profile || !roadmap) {
    return (
      <section className="section">
        <div className="container empty">
          <Art name="folder" className="empty__art" />
          <p className="section-label">My Roadmap</p>
          <h1 className="section-title">자가진단을 하면 나만의 신청 트랙을 만들어 드려요</h1>
          <p className="empty__text">어떤 제도를 먼저 보고, 무엇을 함께 준비하고, 다음에 무엇을 신청할지 단계별로 정리합니다.</p>
          <Link to="/diagnosis" className="btn btn--primary btn--lg">
            무료 자가진단 시작하기 <ArrowRight size={20} aria-hidden />
          </Link>
        </div>
      </section>
    );
  }

  const toggleBasic = (id: string) => {
    const next = { ...basics, [id]: !basics[id] };
    if (!next[id]) delete next[id];
    setBasics(next);
    writeBasics(next);
  };
  const today = new Date().toLocaleDateString('ko-KR');

  return (
    <>
      <div className="print-only print-head">
        <strong>{SITE_NAME} — 나의 추천 신청 트랙</strong>
        <span>출력일 {today}</span>
      </div>

      <section className="rm-hero">
        <div className="container rm-hero__grid">
          <div>
            <p className="section-label">My Roadmap</p>
            <h1 className="rm-hero__title">나의 추천 신청 트랙</h1>
            <p className="rm-track">
              <span className="rm-track__main">{roadmap.primary.label}</span>
              {roadmap.secondary.map((t) => (
                <span key={t.id} className="rm-track__sub">
                  {t.label}
                </span>
              ))}
            </p>
            <p className="rm-hero__desc">
              {roadmap.primary.desc} <span className="src">({roadmap.primary.source})</span>
            </p>
            <div className="rm-cond" aria-label="나의 사업 조건 요약">
              <p className="rm-cond__title">나의 사업 조건</p>
              <ul className="chip-row">
                {answerChips(profile).map((c) => (
                  <li key={c} className="pill pill--outline">
                    {c}
                  </li>
                ))}
                {financeChips(profile).map((c) => (
                  <li key={c} className="pill pill--white">
                    {c}
                  </li>
                ))}
                {(profile.purposes ?? []).map((x) => (
                  <li key={x} className="pill pill--pale">
                    {PURPOSES[x]}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rm-hero__actions no-print">
              <button className="btn btn--secondary btn--sm" onClick={() => window.print()}>
                <Printer size={16} aria-hidden /> 인쇄
              </button>
              <button className="btn btn--secondary btn--sm" onClick={() => window.print()} title="인쇄 창의 대상에서 'PDF로 저장'을 고르세요">
                <Download size={16} aria-hidden /> PDF 저장
              </button>
              <Link to="/diagnosis" className="link-btn">
                <Pencil size={14} aria-hidden /> 진단 수정하기
              </Link>
              <Link to="/result" className="link-arrow">
                진단 결과 보기 →
              </Link>
            </div>
          </div>

          <aside className="first-card" aria-labelledby="first-h">
            <Art name="coins" className="first-card__art" />
            <h2 id="first-h" className="first-card__title">가장 먼저 확인할 사항</h2>
            <ol className="first-list">
              {roadmap.firstActions.map((a, i) => (
                <li key={a.text}>
                  <span className="first-list__no">{i + 1}</span>
                  {a.to ? (
                    <Link to={a.to} state={{ from: 'roadmap' }}>
                      {a.text} →
                    </Link>
                  ) : (
                    <span>{a.text}</span>
                  )}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="rm-notice" role="note">
            <AlertTriangle size={20} aria-hidden />
            <p>
              2027년 공고 일정이 아직 발표되지 않아 <b>마감일 순으로 정렬하지 않았습니다.</b> 각 제도에는 원고에 있는 2026년 실제 일정을 참고로만 표시합니다. 체크리스트를 모두 마쳐도 실제 신청·승인이 완료된 것은
              아닙니다.
            </p>
          </div>

          <div className="rel-legend no-print" aria-label="관계 표시">
            {(['first', 'parallel', 'conditional', 'overlap', 'overlap-unverified', 'announcement'] as RelationTag[]).map((t) => (
              <span key={t} className={`rel rel--${t}`}>
                {RELATION_LABEL[t]}
              </span>
            ))}
          </div>

          <ol className="rm-timeline">
            {roadmap.phases.map((ph, idx) => {
              const state = phaseState(ph, basics);
              const multi = ph.lanes.length > 1;
              return (
                <li key={ph.id} className={`rm-phase rm-phase--${ph.id} is-${state}`}>
                  <div className="rm-phase__node" aria-hidden>
                    {state === 'done' ? <Check size={18} strokeWidth={3} /> : ph.no}
                  </div>
                  <div className="rm-phase__body">
                    <header className="rm-phase__head">
                      <span className="rm-phase__step">STEP {ph.no}</span>
                      <h2 className="rm-phase__title">{ph.title}</h2>
                      <span className={`rm-state rm-state--${state}`}>{state === 'done' ? '준비 항목 완료' : state === 'doing' ? '준비 중' : '시작 전'}</span>
                    </header>
                    <div className="rm-why">
                      <p className="rm-why__title">왜 이 순서인가요</p>
                      {ph.reasons.map((r) => (
                        <p key={r.text}>
                          {r.text} <span className="src">({r.source})</span>
                        </p>
                      ))}
                    </div>
                    {ph.warnings?.map((w) => (
                      <p key={w} className="rm-warn">
                        <AlertTriangle size={16} aria-hidden /> {w}
                      </p>
                    ))}
                    {ph.tasks && (
                      <ul className="rm-tasks">
                        {ph.tasks.map((t) => (
                          <li key={t.id}>
                            <label className={`check-item ${basics[t.id] ? 'is-done' : ''}`}>
                              <input type="checkbox" checked={!!basics[t.id]} onChange={() => toggleBasic(t.id)} />
                              <span className="check-item__box" aria-hidden>
                                <Check size={16} strokeWidth={3} />
                              </span>
                              <span className="check-item__text">
                                {t.title}
                                <small>
                                  {t.source}
                                  {t.site && SITES[t.site] && (
                                    <>
                                      {' · '}
                                      <a href={SITES[t.site].url} target="_blank" rel="noopener noreferrer">
                                        {SITES[t.site].name} <ArrowUpRight size={12} aria-hidden />
                                      </a>
                                    </>
                                  )}
                                </small>
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    {ph.lanes.length > 0 && (
                      <>
                        {multi && <p className="rm-parallel-label">‖ 아래 {ph.lanes.length}개 갈래는 동시에 준비할 수 있어요</p>}
                        <div className={`rm-lanes ${multi ? 'rm-lanes--multi' : ''}`}>
                          {ph.lanes.map((lane) => (
                            <section key={lane.id + lane.label} className="rm-lane" aria-label={lane.label}>
                              <h3 className="rm-lane__title">{lane.label}</h3>
                              {lane.items.map((it, i) => {
                                const req = it.prerequisites.find((x) => x.relation === 'required' && lane.items.slice(0, i).some((y) => y.match.program.id === x.programId));
                                return (
                                  <div key={it.match.program.id}>
                                    {req && (
                                      <p className="rm-chain">
                                        <ArrowDown size={16} aria-hidden /> 먼저 완료한 뒤: {req.text}
                                      </p>
                                    )}
                                    <ItemCard it={it} />
                                  </div>
                                );
                              })}
                            </section>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {idx < roadmap.phases.length - 1 && <span className="sr-only">다음 단계로</span>}
                </li>
              );
            })}
          </ol>

          <section className="rm-cautions" aria-labelledby="caution-h">
            <h2 id="caution-h" className="section-title section-title--sm">
              신청 전 <Mark>주의사항</Mark>
            </h2>
            {roadmap.overlapWarnings.length > 0 && (
              <ul className="rm-overlaps">
                {roadmap.overlapWarnings.map((w) => (
                  <li key={w.type + w.programs.join()}>
                    <span className={`ovl ovl--${w.type}`}>{OVERLAP_LABEL[w.type]}</span>
                    <p>
                      <b>{w.programs.join(', ')}</b>
                    </p>
                    <p>{w.text}</p>
                  </li>
                ))}
              </ul>
            )}
            <ul className="dot-list">
              <li>체크리스트를 모두 마쳐도 실제 신청이나 승인이 완료된 것은 아닙니다. 접수 완료와 승인 결과는 각 기관에서 확인하세요.</li>
              <li>신청 전에 "이 돈은 갚는 돈인가, 사업비인가"를 한 줄로 적어 보세요. 지원금은 사업비로만 쓸 수 있고 고정비 공백을 메워 주지 않습니다. (원고 15장 7절)</li>
              <li>여기에 표시되지 않은 중복 제한도 공고마다 있을 수 있습니다. 공고문의 "중복지원 제한"과 "지원 제외 대상"을 가장 먼저 읽으세요. (원고 1장 4절, 10장 2절)</li>
              <li>책·서비스와 공고가 다를 때는 언제나 공고가 우선입니다.</li>
            </ul>
            {roadmap.excluded > 0 && (
              <p className="rm-excluded">
                자금 목적과 직접 연결되지 않아 트랙에 넣지 않은 제도가 {roadmap.excluded}개 더 있어요.{' '}
                <Link to="/result" className="link-arrow">
                  전체 판정 결과 보기 →
                </Link>
              </p>
            )}
          </section>
        </div>
      </section>
    </>
  );
}
