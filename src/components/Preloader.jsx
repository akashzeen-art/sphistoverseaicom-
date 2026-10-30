import { useEffect, useMemo, useRef, useState } from 'react';

const HOLD_MS = 5000;
const EXIT_MS = 700;
const STORAGE_KEY = 'hv-intro-seen';

const FIGURES = [
  { name: 'Shakespeare' },
  { name: 'Lincoln' },
  { name: 'Churchill' },
  { name: 'Agatha' },
  { name: 'Ali' },
  { name: 'Newton' },
  { name: 'Mozart' },
  { name: 'Mandela' },
];

function makeDust(count) {
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 67 + 11) % 997;
    return {
      id: i,
      left: `${seed % 100}%`,
      top: `${(seed * 5) % 100}%`,
      size: 1 + (seed % 3),
      delay: `${(seed % 20) / 10}s`,
      duration: `${6 + (seed % 8)}s`,
    };
  });
}

export default function Preloader({ onDone }) {
  const dust = useMemo(() => makeDust(36), []);
  const [progress, setProgress] = useState(0);
  const [figureIndex, setFigureIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const doneRef = useRef(false);
  const skipRef = useRef(() => {});

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hold = reduced ? 900 : HOLD_MS;
    const total = reduced ? 1400 : HOLD_MS + EXIT_MS;
    const started = performance.now();
    let finishAt = started + total;
    let raf = 0;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // ignore
      }
      document.body.classList.remove('is-preloading');
      onDone?.();
    };

    const beginExit = () => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setLeaving(true);
      setProgress(1);
      finishAt = Math.min(finishAt, performance.now() + EXIT_MS);
    };
    skipRef.current = beginExit;

    document.body.classList.add('is-preloading');

    const tick = (now) => {
      const t = Math.min(1, (now - started) / hold);
      if (!leavingRef.current) setProgress(t);
      if (now - started >= hold) beginExit();
      if (now >= finishAt) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const names = window.setInterval(() => {
      setFigureIndex((i) => (i + 1) % FIGURES.length);
    }, reduced ? 350 : 620);

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') beginExit();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(names);
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('is-preloading');
    };
  }, [onDone]);

  const pct = Math.round(progress * 100);
  const current = FIGURES[figureIndex];

  return (
    <div
      className={`hv-preloader${leaving ? ' is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="HistoVerse está abriendo el archivo"
    >
      <div className="hv-preloader__glow hv-preloader__glow--gold" />
      <div className="hv-preloader__glow hv-preloader__glow--blue" />
      <div className="hv-preloader__grid" aria-hidden="true" />
      <div className="hv-preloader__dust" aria-hidden="true">
        {dust.map((speck) => (
          <span
            key={speck.id}
            className="hv-preloader__speck"
            style={{
              left: speck.left,
              top: speck.top,
              width: speck.size,
              height: speck.size,
              animationDelay: speck.delay,
              animationDuration: speck.duration,
            }}
          />
        ))}
      </div>
      <div className="hv-preloader__vignette" />

      <div className="hv-preloader__stage">
        <div className="hv-preloader__orbit" aria-hidden="true">
          <span className="hv-preloader__halo" />
          <span className="hv-preloader__ring hv-preloader__ring--outer" />
          <span className="hv-preloader__ring hv-preloader__ring--mid" />
          {FIGURES.map((figure, index) => (
            <span
              key={figure.name}
              className={`hv-preloader__pin${index === figureIndex ? ' is-active' : ''}`}
              style={{ '--pin-angle': `${index * 45}deg` }}
            >
              <span className="hv-preloader__pin-dot" />
            </span>
          ))}
          <div className="hv-preloader__mark">
            <span className="hv-preloader__mark-text">HV</span>
          </div>
        </div>

        <p className="hv-preloader__kicker">HistoVerse AI</p>
        <h1 className="hv-preloader__title">La historia habla</h1>
        <p className="hv-preloader__figure">{current.name}</p>
        <p className="hv-preloader__tagline">Habla con leyendas · voz en vivo · IA</p>

        <div
          className="hv-preloader__track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Cargando"
        >
          <span className="hv-preloader__fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="hv-preloader__pct">{pct}%</p>
        <button
          type="button"
          className="hv-preloader__skip"
          onClick={() => skipRef.current()}
        >
          Saltar intro
        </button>
      </div>
    </div>
  );
}

export function shouldShowHistoryPreloader() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    return true;
  }
}
