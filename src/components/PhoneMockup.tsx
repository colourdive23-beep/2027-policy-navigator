import { useMemo } from 'react';
import { Check, CircleHelp } from 'lucide-react';
import { matchAll, topPicks, statusLabel } from '../lib/engine';
import type { Profile } from '../types';

/** 원고 12장 사례 1: 직원 없는 디자인 1인사업자, 업력 2년, 연매출 5천만 원, 서울 */
export const SAMPLE_PROFILE: Profile = {
  bizStatus: 'operating',
  bizAge: '1to3y',
  industry: 'knowledge-service',
  region: 'seoul',
  revenue: '12mto100m',
  revenueTrend: 'irregular',
  employees: '0',
  credit: '840to964',
  vulnerable: 'no',
  taxArrears: 'no',
  delinquency: 'none',
  debtRelief: 'none',
  highInterest: 'no',
  currentFinance: ['none'],
  purposes: ['operating', 'new-product', 'safety'],
  flags: ['none'],
  joined: ['none'],
};

function StatusBar() {
  return (
    <div className="phone__status" aria-hidden>
      <span>9:41</span>
      <span className="phone__icons">
        <i />
        <i />
        <b />
      </span>
    </div>
  );
}

export default function PhoneMockup() {
  const matches = useMemo(() => matchAll(SAMPLE_PROFILE), []);
  const picks = topPicks(matches, 2);
  const eligible = matches.filter((m) => m.status === 'eligible').length;
  const check = matches.filter((m) => m.status === 'check').length;

  return (
    <div
      className="mockups"
      role="img"
      aria-label={`진단 결과 화면 예시: 원고 사례 1(서울 디자인 1인사업자, 업력 2년)의 결과로 기본 조건 부합 ${eligible}개, 추가 확인 필요 ${check}개`}
    >
      <div className="phone phone--back">
        <div className="phone__screen">
          <StatusBar />
          <div className="mk-progress">
            <span style={{ width: '60%' }} />
          </div>
          <p className="mk-q-label">Q6 / 10</p>
          <p className="mk-q">대표자 개인신용평점은 어느 구간인가요?</p>
          <div className="mk-opt">595 ~ 839점</div>
          <div className="mk-opt mk-opt--on">
            <span className="mk-radio" />
            840 ~ 964점
          </div>
          <div className="mk-opt">965점 이상</div>
          <div className="mk-btns">
            <span>이전</span>
            <b>다음</b>
          </div>
        </div>
      </div>

      <div className="phone phone--front">
        <div className="phone__screen">
          <StatusBar />
          <p className="mk-label">진단 결과 · 예시</p>
          <div className="mk-summary">
            <p className="mk-summary__title">
              확인해 볼 제도가
              <br />
              <b>{eligible + check}개</b> 있어요
            </p>
            <div className="mk-counts">
              <span>
                <b>{eligible}</b>부합
              </span>
              <span>
                <b>{check}</b>확인
              </span>
            </div>
          </div>
          {picks.map((m, i) => (
            <div key={m.program.id} className={`mk-card ${i === 0 ? 'mk-card--top' : ''}`}>
              <div className="mk-card__badges">
                {i === 0 && <span className="mk-pill mk-pill--solid">추천</span>}
                <span className={`mk-pill mk-pill--${m.status}`}>
                  {m.status === 'eligible' ? <Check size={9} strokeWidth={3} /> : <CircleHelp size={9} strokeWidth={3} />}
                  {statusLabel[m.status]}
                </span>
              </div>
              <p className="mk-card__title">{m.program.name}</p>
              <p className="mk-card__fact">{m.program.keyFact.value}</p>
            </div>
          ))}
          <div className="mk-apply">공식 신청처로 이동 ↗</div>
        </div>
      </div>

      <svg className="mockups__star mockups__star--1" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 0c1 6.5 5.5 11 12 12-6.5 1-11 5.5-12 12-1-6.5-5.5-11-12-12C6.5 11 11 6.5 12 0z" />
      </svg>
      <svg className="mockups__star mockups__star--2" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 0c1 6.5 5.5 11 12 12-6.5 1-11 5.5-12 12-1-6.5-5.5-11-12-12C6.5 11 11 6.5 12 0z" />
      </svg>
      <span className="mockups__dot" aria-hidden />
    </div>
  );
}
