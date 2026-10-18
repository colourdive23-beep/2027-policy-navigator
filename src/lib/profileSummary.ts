import { REGIONS, labelOf } from '../data/questions';
import type { Profile } from '../types';

const STATUS = { pre: '예비 창업자', freelancer: '등록 전 프리랜서', operating: '영업 중', suspended: '휴업 중', closed: '폐업·재창업 준비' };

/** 진단 응답을 짧은 칩 문구로 요약 */
export function answerChips(p: Profile): string[] {
  const out: string[] = [];
  if (p.bizStatus) out.push(STATUS[p.bizStatus]);
  if (p.bizAge && p.bizAge !== 'none') out.push(`업력 ${labelOf('bizAge', p.bizAge)}`);
  if (p.industry) out.push(labelOf('industry', p.industry));
  if (p.region) out.push(REGIONS.find((r) => r.value === p.region)?.label ?? p.region);
  if (p.revenue && p.revenue !== 'unknown') out.push(`매출 ${labelOf('revenue', p.revenue)}`);
  if (p.employees) out.push(p.employees === '0' ? '직원 없음' : `직원 ${labelOf('employees', p.employees)}`);
  return out;
}

/** 로드맵용: 체납·연체·대출 상태 요약 */
export function financeChips(p: Profile): string[] {
  const out: string[] = [];
  if (p.taxArrears === 'yes') out.push('세금 체납 있음');
  if (p.delinquency === 'current') out.push('연체 중');
  if (p.delinquency === 'resolved-recent') out.push('최근 3개월 연체 이력');
  if (p.debtRelief === 'in-progress') out.push('채무조정·회생 진행 중');
  if (p.debtRelief === 'completed') out.push('채무조정·회생 완료');
  if (p.highInterest === 'yes') out.push('연 7% 이상 대출 있음');
  const cf = (p.currentFinance ?? []).filter((x) => x !== 'none');
  const names: Record<string, string> = { 'sbiz-direct': '소진공 직접대출 이용 중', 'regional-guarantee': '지역신보 보증 이용 중', 'kodit-kibo': '신보·기보 보증 이용 중', kosmes: '중진공 자금 이용 중' };
  for (const c of cf) out.push(names[c]);
  if (!out.length) out.push('체납·연체 없음');
  return out;
}
