// 책 표지(《2027 1인사업자를 위한 정책자금·지원금 가이드》) 벡터 아트웍.
// 표지 PDF를 SVG로 변환해 요소별로 나눈 파일입니다 (src/assets/art).
import illustration from '../assets/art/illustration.svg';
import folder from '../assets/art/folder.svg';
import laptop from '../assets/art/laptop.svg';
import coffee from '../assets/art/coffee.svg';
import coins from '../assets/art/coins.svg';
import documentArt from '../assets/art/document.svg';
import stamp from '../assets/art/stamp.svg';
import starburst from '../assets/art/starburst.svg';
import asterisk from '../assets/art/asterisk.svg';
import squiggle from '../assets/art/squiggle.svg';
import titleLettering from '../assets/art/title-lettering.svg';
import bookCover from '../assets/art/book-cover.svg';

export const ART = {
  illustration,
  folder,
  laptop,
  coffee,
  coins,
  document: documentArt,
  stamp,
  starburst,
  asterisk,
  squiggle,
  titleLettering,
  bookCover,
} as const;

export type ArtName = keyof typeof ART;

interface Props {
  name: ArtName;
  className?: string;
  /** 의미 있는 그림이면 대체 텍스트, 장식이면 생략(빈 alt) */
  alt?: string;
  width?: number;
}

export default function Art({ name, className, alt = '', width }: Props) {
  return <img src={ART[name]} alt={alt} aria-hidden={alt ? undefined : true} className={`art ${className ?? ''}`} width={width} loading="lazy" decoding="async" draggable={false} />;
}
