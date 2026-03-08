import { allThemes } from "../themes";
import type { LandingTheme } from "../themes";

type DemoView = "home" | "library" | "search";

interface Props {
  currentTheme: LandingTheme;
  onThemeChange: (theme: LandingTheme) => void;
  view: DemoView;
  onViewChange: (view: DemoView) => void;
  onTitleBarMouseDown: (e: React.MouseEvent) => void;
}

export function DemoWindowChrome({
  currentTheme,
  onThemeChange,
  view,
  onViewChange,
  onTitleBarMouseDown,
}: Props) {
  return (
    <>
      <div className="title-bar" onMouseDown={onTitleBarMouseDown}>
        <div className="title-bar-left">
          <div className="title-bar-dots">
            <span className="title-bar-dot red" />
            <span className="title-bar-dot yellow" />
            <span className="title-bar-dot green" />
          </div>
          <span className="title-bar-text">melo</span>
        </div>
        <div className="title-bar-themes">
          {allThemes.map((t) => (
            <button
              key={t.id}
              className={`title-bar-theme-dot${t.id === currentTheme.id ? " active" : ""}`}
              style={{ background: t.palette.accent }}
              onClick={() => onThemeChange(t)}
              title={t.name}
            />
          ))}
        </div>
      </div>
      <div className="tab-bar">
        <button
          className={`tab${view === "home" ? " active" : ""}`}
          onClick={() => onViewChange("home")}
        >
          Home
        </button>
        <button
          className={`tab${view === "library" ? " active" : ""}`}
          onClick={() => onViewChange("library")}
        >
          Library
        </button>
        <button
          className={`tab${view === "search" ? " active" : ""}`}
          onClick={() => onViewChange("search")}
        >
          Search
        </button>
      </div>
    </>
  );
}
