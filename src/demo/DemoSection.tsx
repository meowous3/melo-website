import { ScrollReveal } from "../components/ScrollReveal";
import { DemoApp } from "./DemoApp";
import type { LandingTheme } from "../themes";
import "./demo.css";

interface Props {
  currentTheme: LandingTheme;
  onThemeChange: (theme: LandingTheme) => void;
}

export function DemoSection({ currentTheme, onThemeChange }: Props) {
  return (
    <section id="demo" className="section">
      <div className="container">
        <ScrollReveal>
          <h2 className="section-title">Try it right here</h2>
          <p className="section-subtitle">
            A fully interactive demo. Search, play, and queue music — no install needed.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="demo-container">
            <DemoApp currentTheme={currentTheme} onThemeChange={onThemeChange} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
