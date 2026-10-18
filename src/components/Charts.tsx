import { useEffect, useId, useRef, useState } from 'react';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 화면에 들어오면 0에서 값까지 올라가는 숫자. 움직임 줄이기 설정이면 즉시 표시 */
export function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    setShown(0);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / 800);
        setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className="num">
      {fmt(shown)}
      {suffix}
    </span>
  );
}

function HatchDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#F57824" />
        <line x1="0" y1="0" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.55" />
      </pattern>
    </defs>
  );
}

export function ChartLegend() {
  return (
    <div className="legend">
      <span>
        <i className="legend__sw legend__sw--2026" /> 2026 확정
      </span>
      <span>
        <i className="legend__sw legend__sw--2027" /> 2027 예정(예산안)
      </span>
    </div>
  );
}

interface PairRow {
  label: string;
  y2026: number;
  y2027: number;
  status2027: string;
}

/** 2026(확정) vs 2027(예정) 가로 막대 비교 */
export function PairBars({ rows, unit, title }: { rows: PairRow[]; unit: string; title: string }) {
  const max = Math.max(...rows.flatMap((r) => [r.y2026, r.y2027]));
  const W = 100;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <figure className="chart" data-reveal>
      <figcaption className="sr-only">{title}</figcaption>
      <ChartLegend />
      <div className="pairbars" aria-hidden>
        {rows.map((r, i) => {
          const up = r.y2027 >= r.y2026;
          const confirmed = r.status2027 === 'confirmed';
          const hatch = `hatch${uid}${i}`;
          return (
            <div className="pairbars__row" key={r.label}>
              <div className="pairbars__label">
                {r.label}
                <span className={`delta ${up ? 'delta--up' : 'delta--down'}`}>
                  {up ? '▲' : '▼'} {Math.round(Math.abs((r.y2027 - r.y2026) / r.y2026) * 100)}%
                </span>
              </div>
              <svg className="pairbars__svg" viewBox={`0 0 ${W + 30} 26`} preserveAspectRatio="none">
                <HatchDefs id={hatch} />
                <rect className="bar bar--2026" x="0" y="1" height="10" rx="3" width={(r.y2026 / max) * W} />
                <rect
                  className="bar bar--2027"
                  x="0"
                  y="14"
                  height="10"
                  rx="3"
                  width={(r.y2027 / max) * W}
                  fill={confirmed ? '#F57824' : `url(#${hatch})`}
                  stroke="#241714"
                  strokeWidth={1}
                  strokeDasharray={confirmed ? undefined : '3 2'}
                />
              </svg>
              <div className="pairbars__vals">
                <span>{fmt(r.y2026)}</span>
                <b>{fmt(r.y2027)}</b>
              </div>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>
          {title} (단위: {unit})
        </caption>
        <thead>
          <tr>
            <th>항목</th>
            <th>2026 (확정)</th>
            <th>2027 (예산안, 예정)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{fmt(r.y2026)}</td>
              <td>{fmt(r.y2027)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="chart__unit">단위: {unit}</p>
    </figure>
  );
}

interface SingleRow {
  label: string;
  value: number;
  desc?: string;
  status2027: string;
}

/** 2027 신설 사업 예산안 (모두 예정 → 해칭) */
export function SingleBars({ rows, unit, title }: { rows: SingleRow[]; unit: string; title: string }) {
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <figure className="chart" data-reveal>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="singlebars">
        {rows.map((r) => (
          <div className="singlebars__row" key={r.label}>
            <div className="singlebars__head">
              <span className="singlebars__label">{r.label}</span>
              <span className="singlebars__val">
                {fmt(r.value)}
                <small>{unit}</small>
              </span>
            </div>
            <div className="singlebars__track" aria-hidden>
              <span
                className={`singlebars__fill ${r.status2027 === 'confirmed' ? '' : 'is-planned'}`}
                style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
              />
            </div>
            {r.desc && <p className="singlebars__desc">{r.desc}</p>}
          </div>
        ))}
      </div>
      <p className="chart__unit">단위: {unit} · 사선 무늬 = 예정(예산안)</p>
    </figure>
  );
}
