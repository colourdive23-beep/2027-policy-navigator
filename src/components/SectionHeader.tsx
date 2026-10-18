import type { ReactNode } from 'react';
import Art, { type ArtName } from './Art';

interface Props {
  label: string;
  title: ReactNode;
  aside?: ReactNode;
  center?: boolean;
  as?: 'h1' | 'h2';
  /** 제목 옆에 놓을 표지 일러스트 */
  art?: ArtName;
}

/** 영문 라벨 + 굵은 국문 헤드라인 + (데스크톱 오른쪽) 회색 보조 설명 */
export default function SectionHeader({ label, title, aside, center, as = 'h2', art }: Props) {
  const H = as;
  return (
    <div className={`section-header ${center ? 'section-header--center' : ''} ${art ? 'section-header--art' : ''}`} data-reveal>
      <div>
        <p className="section-label">{label}</p>
        <H className="section-title">{title}</H>
      </div>
      {(aside || art) && (
        <div className="section-side">
          {art && <Art name={art} className={`section-art section-art--${art}`} />}
          {aside && <p className="section-aside">{aside}</p>}
        </div>
      )}
    </div>
  );
}

/** 핵심어 강조 (표지 제목의 레드오렌지 단어처럼) */
export const Mark = ({ children }: { children: ReactNode }) => <mark className="hl">{children}</mark>;
