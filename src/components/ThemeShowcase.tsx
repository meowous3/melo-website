import type { LandingTheme } from "../themes";
import { allThemes } from "../themes";
import { ScrollReveal } from "./ScrollReveal";

interface CyclerState {
  theme: LandingTheme;
  index: number;
  pool: LandingTheme[];
  paused: boolean;
  progress: number;
  jumpTo: (target: LandingTheme | number) => void;
  next: () => void;
  prev: () => void;
  togglePause: () => void;
}

export function ThemeShowcase({ cycler }: { cycler: CyclerState }) {
  const { theme, pool, paused, progress, jumpTo, next, prev, togglePause } = cycler;

  return (
    <section id="themes" className="section">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title">8 built-in themes</h2>
          <p className="section-subtitle">Every element adapts. Watch the page transform in real time.</p>
        </ScrollReveal>

        <ScrollReveal>
        <div className="theme-showcase__panel glass">
          <div className="theme-showcase__name">{theme.name}</div>

          <div className="theme-showcase__dots">
            {allThemes.map((t) => (
              <button
                key={t.id}
                className={`theme-showcase__dot ${t.id === theme.id ? "theme-showcase__dot--active" : ""}`}
                style={{ background: t.palette.accent }}
                onClick={() => jumpTo(t)}
                title={t.name}
                aria-label={`Switch to ${t.name} theme`}
              />
            ))}
          </div>

          <div className="theme-showcase__controls">
            <button onClick={prev} className="theme-showcase__btn" aria-label="Previous theme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button onClick={togglePause} className="theme-showcase__btn" aria-label={paused ? "Resume" : "Pause"}>
              {paused ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              )}
            </button>
            <button onClick={next} className="theme-showcase__btn" aria-label="Next theme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="theme-showcase__info">
            Cycling through {pool.length} {pool[0]?.family} themes
          </div>

          <div className="theme-showcase__progress-bar">
            <div className="theme-showcase__progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
