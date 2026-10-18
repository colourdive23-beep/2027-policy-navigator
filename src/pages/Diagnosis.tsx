import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';
import { normalizeProfile, optionsOf, textOf, visibleQuestions, visibleSteps, type Question } from '../data/questions';
import { loadDraft, saveDraft, saveProfile } from '../lib/storage';
import type { Profile } from '../types';

function isAnswered(q: Question, p: Profile) {
  const v = p[q.field];
  if (q.multi) return q.optional || (Array.isArray(v) && v.length > 0);
  return v !== undefined;
}

function QuestionBlock({
  q,
  profile,
  onChange,
  soleQuestion,
}: {
  q: Question;
  profile: Profile;
  onChange: (p: Profile) => void;
  soleQuestion: boolean;
}) {
  const opts = optionsOf(q, profile);
  const value = profile[q.field];
  const help = textOf(q.help, profile);
  const name = `q-${q.field}`;

  const select = (v: string) => {
    if (!q.multi) return onChange({ ...profile, [q.field]: v });
    const cur = (Array.isArray(value) ? value : []) as string[];
    const opt = opts.find((o) => o.value === v);
    let next: string[];
    if (cur.includes(v)) next = cur.filter((x) => x !== v);
    else if (opt?.exclusive) next = [v];
    else next = [...cur.filter((x) => !opts.find((o) => o.value === x)?.exclusive), v];
    onChange({ ...profile, [q.field]: next });
  };

  return (
    <fieldset className="q">
      {/* 질문이 하나뿐인 단계는 위 제목과 같은 문장이라 화면에서는 숨기고 스크린리더용으로만 남깁니다 */}
      <legend className={soleQuestion ? 'sr-only' : 'q__title'}>{textOf(q.title, profile)}</legend>
      {help && <p className="q__help">{help}</p>}
      {q.multi && <p className="q__multi">여러 개 선택할 수 있어요</p>}
      <div className={`options options--${q.columns ?? 1}`}>
        {opts.map((o) => {
          const checked = q.multi ? Array.isArray(value) && (value as string[]).includes(o.value) : value === o.value;
          return (
            <label key={o.value} className={`option ${checked ? 'is-checked' : ''}`}>
              <input
                type={q.multi ? 'checkbox' : 'radio'}
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => select(o.value)}
              />
              <span className={`option__mark ${q.multi ? 'option__mark--box' : ''}`} aria-hidden>
                {checked && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="option__text">
                {o.label}
                {o.help && <small>{o.help}</small>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function Diagnosis() {
  const navigate = useNavigate();
  const draft = useMemo(() => loadDraft(), []);
  const [profile, setProfile] = useState<Profile>(draft?.profile ?? {});
  const [index, setIndex] = useState(draft?.step ?? 0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const steps = visibleSteps(profile);
  const i = Math.min(index, steps.length - 1);
  const step = steps[i];
  const questions = visibleQuestions(step, profile);
  const done = questions.every((q) => isAnswered(q, profile));
  const isLast = i === steps.length - 1;
  const progress = Math.round(((i + (done ? 1 : 0)) / steps.length) * 100);

  useEffect(() => {
    saveDraft({ profile, step: i });
  }, [profile, i]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [i]);

  // 사업자 상태가 바뀌면 그 상태에서 고를 수 없는 업력 응답('아직 재창업 전')을 지웁니다.
  const update = (next: Profile) => {
    if (next.bizStatus !== profile.bizStatus && next.bizAge === 'none' && next.bizStatus !== 'closed') {
      next = { ...next };
      delete next.bizAge;
    }
    setProfile(next);
  };

  const go = (d: 1 | -1) => {
    setDir(d === 1 ? 'next' : 'prev');
    setIndex(Math.max(0, Math.min(steps.length - 1, i + d)));
  };

  const finish = () => {
    saveProfile(normalizeProfile(profile));
    saveDraft(null);
    navigate('/result');
  };

  const restart = () => {
    setProfile({});
    setIndex(0);
    saveDraft(null);
  };

  return (
    <section className="diag">
      <div className="diag__progress">
        <div className="container diag__progress-inner">
          <div
            className="progress"
            role="progressbar"
            aria-label="자가진단 진행률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="diag__count">
            <b>{i + 1}</b> / {steps.length}
          </span>
        </div>
      </div>

      <div className="container diag__body">
        <div key={step.id} className={`diag__step diag__step--${dir}`}>
          <p className="diag__label">
            Q{i + 1} · {step.label}
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="diag__title">
            {step.title}
          </h1>
          {step.description && <p className="diag__desc">{step.description}</p>}

          {questions.map((q) => (
            <QuestionBlock key={q.field} q={q} profile={profile} onChange={update} soleQuestion={questions.length === 1} />
          ))}
        </div>
      </div>

      <div className="diag__nav">
        <div className="container diag__nav-inner">
          {!done && <p className="diag__hint">답을 고르면 다음으로 넘어갈 수 있어요</p>}
          <button className="btn btn--secondary btn--lg diag__prev" onClick={() => go(-1)} disabled={i === 0}>
            <ArrowLeft size={20} aria-hidden /> 이전
          </button>
          {isLast ? (
            <button className="btn btn--primary btn--lg diag__next" onClick={finish} disabled={!done}>
              결과 보기 <ArrowRight size={20} aria-hidden />
            </button>
          ) : (
            <button className="btn btn--primary btn--lg diag__next" onClick={() => go(1)} disabled={!done}>
              다음 <ArrowRight size={20} aria-hidden />
            </button>
          )}
        </div>
        {(i > 0 || Object.keys(profile).length > 0) && (
          <div className="container diag__restart">
            <button className="link-btn" onClick={restart}>
              <RotateCcw size={14} aria-hidden /> 처음부터 다시
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
