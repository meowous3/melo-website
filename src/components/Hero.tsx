import { MeloIcon } from "./icons";
import { ScrollReveal } from "./ScrollReveal";

const GITHUB_URL = "https://github.com/meowous3/melo";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__content container">
        <ScrollReveal>
          <div className="hero__icon">
            <MeloIcon />
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <h1 className="hero__title">melo</h1>
        </ScrollReveal>
        <ScrollReveal>
          <p className="hero__tagline">
            A customizable desktop music player.
          </p>
        </ScrollReveal>
        <ScrollReveal>
          <div className="hero__actions">
            <a href="#download" className="btn btn-primary" onClick={(e) => {
              e.preventDefault();
              document.querySelector("#download")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>Download</a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              View on GitHub
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
