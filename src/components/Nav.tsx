import { useState, useEffect, useCallback } from "react";
import { MeloIcon, GitHubIcon } from "./icons";
import { useScrollRevealStyle } from "../ScrollRevealContext";
import { animationStyles } from "../useScrollReveal";

const GITHUB_URL = "https://github.com/meowous3/melo";

const links = [
  { label: "Features", href: "#features" },
  { label: "Demo", href: "#demo" },
  { label: "Themes", href: "#themes" },
  { label: "Download", href: "#download" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { enterStyle, leaveStyle, setEnterStyle, setLeaveStyle } = useScrollRevealStyle();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const smoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  return (
    <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <div className="nav__inner container">
        <a href="#" className="nav__logo" onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}>
          <MeloIcon />
          <span>melo</span>
        </a>

        <div className={`nav__links ${menuOpen ? "nav__links--open" : ""}`}>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={(e) => smoothScroll(e, l.href)}>
              {l.label}
            </a>
          ))}

          <div className="nav__anim-selectors">
            <select
              className="nav__anim-select"
              value={enterStyle}
              onChange={(e) => setEnterStyle(e.target.value as typeof enterStyle)}
              aria-label="Enter animation style"
            >
              {animationStyles.map((s) => (
                <option key={s.id} value={s.id}>Enter: {s.label}</option>
              ))}
            </select>
            <select
              className="nav__anim-select"
              value={leaveStyle}
              onChange={(e) => setLeaveStyle(e.target.value as typeof leaveStyle)}
              aria-label="Leave animation style"
            >
              {animationStyles.map((s) => (
                <option key={s.id} value={s.id}>Leave: {s.label}</option>
              ))}
            </select>
          </div>

          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="nav__github">
            <GitHubIcon />
          </a>
        </div>

        <button className="nav__hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
