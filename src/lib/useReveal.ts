import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * [data-reveal] 요소가 화면에 들어오면 한 번만 .is-visible 을 붙입니다.
 * JS가 실행되어 <html>에 .js-anim 이 붙은 뒤에만 초기 숨김이 적용되므로
 * 스크립트가 실패해도 콘텐츠는 보입니다.
 */
export function useReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      root.classList.remove('js-anim');
      return;
    }
    root.classList.add('js-anim');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const observe = () =>
      document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => io.observe(el));
    observe();
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
}
