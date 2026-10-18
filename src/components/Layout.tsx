import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import guide from '../data/guide.json';
import { useReveal } from '../lib/useReveal';

const NAV = [
  { to: '/diagnosis', label: '자가진단' },
  { to: '/roadmap', label: '추천 트랙' },
  { to: '/programs', label: '정책 탐색' },
  { to: '/checklist', label: '체크리스트' },
  { to: '/changes', label: '2027 변화' },
];

export function Logo() {
  return (
    <span className="logo">
      {/* 파비콘(public/favicon.svg)과 같은 동전 심볼 */}
      <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden>
        <rect x="2" y="2" width="60" height="60" rx="15" fill="#F57824" stroke="#241714" strokeWidth="4" />
        <ellipse cx="42" cy="44" rx="14" ry="7.5" fill="#DEA63B" stroke="#241714" strokeWidth="3" />
        <ellipse cx="42" cy="39" rx="14" ry="7.5" fill="#FFD10A" stroke="#241714" strokeWidth="3" />
        <ellipse cx="42" cy="39" rx="8.5" ry="4.2" fill="#DEA63B" stroke="#241714" strokeWidth="2" />
        <circle cx="25" cy="30" r="17" fill="#FFD10A" stroke="#241714" strokeWidth="3.5" />
        <circle cx="25" cy="30" r="11" fill="#DEA63B" stroke="#241714" strokeWidth="2.5" />
        <path d="M50 10l-3 6M56 17l-5 2" stroke="#241714" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="logo__text">
        정책자금 내비<span className="logo__year">2027</span>
      </span>
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="site-header no-print">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="정책자금 내비 2027 홈">
          <Logo />
        </Link>
        <nav className={`site-nav ${open ? 'is-open' : ''}`} aria-label="주요 메뉴">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `site-nav__link ${isActive ? 'is-active' : ''}`}>
              {n.label}
            </NavLink>
          ))}
          <Link to="/diagnosis" className="btn btn--primary btn--sm site-nav__cta">
            무료 자가진단
          </Link>
        </nav>
        <button
          className="site-header__toggle"
          aria-expanded={open}
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top no-print">
          <Logo />
          <nav className="site-footer__links" aria-label="공식 포털">
            {guide.portals.map((p) => (
              <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer">
                {p.name}
              </a>
            ))}
          </nav>
        </div>
        <p className="site-footer__disclaimer">{guide.disclaimer}</p>
        <p className="site-footer__meta">
          자료 기준: 《2027 1인사업자를 위한 정책자금·지원금 가이드》 원고 (2026년 10월) · 2026년 공고와 2027년 정부 예산안(2026년 9월 국회 제출) ·
          "정책자금 최대 3억 가능" 같은 브로커 문자에 주의하세요. 공식 기관 공고는 직접 찾아야 보입니다.
        </p>
      </div>
    </footer>
  );
}

export default function Layout() {
  useReveal();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <a href="#main" className="skip-link">
        본문 바로가기
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
