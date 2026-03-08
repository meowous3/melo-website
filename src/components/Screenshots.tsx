import { useState } from "react";
import { ScrollReveal } from "./ScrollReveal";

const screenshots = [
  { src: "screenshots/home.png", label: "Home", wide: false },
  { src: "screenshots/grid.png", label: "Grid View", wide: true },
  { src: "screenshots/library.png", label: "Library", wide: false },
  { src: "screenshots/visualizer.png", label: "Visualizer", wide: false },
];

export function Screenshots({ accent }: { accent: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const base = import.meta.env.BASE_URL;

  return (
    <section id="screenshots" className="section">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title">See it in action</h2>
          <p className="section-subtitle">A clean, focused interface that puts your music first.</p>
        </ScrollReveal>

        <div className="screenshots__grid">
          {screenshots.map((s, i) => (
            <ScrollReveal key={s.label} className={s.wide ? "screenshots__item--wide" : ""}>
              <div
                className="screenshots__item"
                onClick={() => setLightbox(i)}
                style={{ boxShadow: `0 2px 16px ${accent}12` }}
              >
                <img src={`${base}${s.src}`} alt={s.label} loading="lazy" />
                <div className="screenshots__label">{s.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div className="screenshots__lightbox" onClick={() => setLightbox(null)}>
          <img
            src={`${base}${screenshots[lightbox].src}`}
            alt={screenshots[lightbox].label}
          />
        </div>
      )}
    </section>
  );
}
