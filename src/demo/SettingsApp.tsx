import { useState } from "react";
import CustomSelect from "./components/CustomSelect";
import BackgroundLayer from "./components/BackgroundLayer";
import { PROCEDURAL_REGISTRY } from "./backgrounds";
import { Icon, GlyphProvider, resolveGlyphs } from "./icons";
import { allThemes } from "../themes";
import { defaultBgOptions, defaultGradient } from "./bgDefaults";
import type { DemoSettings, BgType } from "./types";

interface GradientStop {
  color: string;
  pos: number;
}

function parseGradient(value: string): { type: "linear" | "radial"; angle: number; stops: GradientStop[] } {
  const defaults = { type: "linear" as const, angle: 135, stops: [{ color: "#1a1a2e", pos: 0 }, { color: "#0f3460", pos: 100 }] };
  if (!value) return defaults;
  const linearMatch = value.match(/^linear-gradient\((\d+)deg\s*,\s*(.+)\)$/);
  if (linearMatch) {
    const angle = parseInt(linearMatch[1]);
    const stopsStr = linearMatch[2];
    const stops = stopsStr.split(/\s*,\s*/).map((s) => {
      const parts = s.trim().split(/\s+/);
      const color = parts[0];
      const pos = parts[1] ? parseInt(parts[1]) : -1;
      return { color, pos };
    });
    if (stops[0].pos === -1) stops[0].pos = 0;
    if (stops[stops.length - 1].pos === -1) stops[stops.length - 1].pos = 100;
    for (let i = 1; i < stops.length - 1; i++) {
      if (stops[i].pos === -1) stops[i].pos = Math.round((i / (stops.length - 1)) * 100);
    }
    return { type: "linear", angle, stops };
  }
  const radialMatch = value.match(/^radial-gradient\(\s*(.+)\)$/);
  if (radialMatch) {
    const stopsStr = radialMatch[1].replace(/^circle\s*,\s*/, "");
    const stops = stopsStr.split(/\s*,\s*/).map((s) => {
      const parts = s.trim().split(/\s+/);
      return { color: parts[0], pos: parts[1] ? parseInt(parts[1]) : -1 };
    });
    if (stops[0].pos === -1) stops[0].pos = 0;
    if (stops[stops.length - 1].pos === -1) stops[stops.length - 1].pos = 100;
    for (let i = 1; i < stops.length - 1; i++) {
      if (stops[i].pos === -1) stops[i].pos = Math.round((i / (stops.length - 1)) * 100);
    }
    return { type: "radial", angle: 135, stops };
  }
  return defaults;
}

function buildGradient(type: "linear" | "radial", angle: number, stops: GradientStop[]): string {
  const stopsStr = stops.map((s) => `${s.color} ${s.pos}%`).join(", ");
  if (type === "radial") return `radial-gradient(circle, ${stopsStr})`;
  return `linear-gradient(${angle}deg, ${stopsStr})`;
}

function GradientEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = parseGradient(value);
  const [type, setType] = useState<"linear" | "radial">(parsed.type);
  const [angle, setAngle] = useState(parsed.angle);
  const [stops, setStops] = useState<GradientStop[]>(parsed.stops);

  const emit = (t = type, a = angle, s = stops) => onChange(buildGradient(t, a, s));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <CustomSelect
          className="setting-select"
          value={type}
          onChange={(v) => { const t = v as "linear" | "radial"; setType(t); emit(t); }}
          options={[{ value: "linear", label: "Linear" }, { value: "radial", label: "Radial" }]}
        />
        {type === "linear" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="range" min="0" max="360" step="5" value={angle}
              onChange={(e) => { const a = parseInt(e.target.value); setAngle(a); emit(type, a); }}
              style={{ width: 70, accentColor: "var(--accent)" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 30 }}>{angle}</span>
          </div>
        )}
        <button
          style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "4px 8px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", cursor: "pointer" }}
          onClick={() => {
            const mid = stops.length >= 2 ? Math.round((stops[stops.length - 2].pos + stops[stops.length - 1].pos) / 2) : 50;
            const newStops = [...stops, { color: "#333333", pos: mid }].sort((a, b) => a.pos - b.pos);
            setStops(newStops);
            emit(type, angle, newStops);
          }}
        >+ Stop</button>
      </div>
      {stops.map((stop, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="color" value={stop.color}
            onChange={(e) => { const ns = stops.map((s, j) => j === i ? { ...s, color: e.target.value } : s); setStops(ns); emit(type, angle, ns); }}
            style={{ width: 28, height: 22, border: "1px solid var(--bg-hover)", borderRadius: 3, cursor: "pointer", background: "transparent", padding: 0 }}
          />
          <input
            type="range" min="0" max="100" value={stop.pos}
            onChange={(e) => { const ns = stops.map((s, j) => j === i ? { ...s, pos: parseInt(e.target.value) } : s); setStops(ns); emit(type, angle, ns); }}
            style={{ flex: 1, accentColor: "var(--accent)" }}
          />
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)", minWidth: 28 }}>{stop.pos}%</span>
          {stops.length > 2 && (
            <button
              onClick={() => { const ns = stops.filter((_, j) => j !== i); setStops(ns); emit(type, angle, ns); }}
              style={{ border: "none", background: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: "0 4px" }}
            ><Icon name="close" size={10} /></button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SettingsApp({
  settings,
  onUpdateSettings,
  currentTheme,
  onSetTheme,
  onClose,
  onTitleBarMouseDown,
}: {
  settings: DemoSettings;
  onUpdateSettings: (s: DemoSettings) => void;
  currentTheme: { id: string; name: string; palette: ThemePalette };
  onSetTheme: (theme: { id: string; name: string; palette: ThemePalette }) => void;
  onClose: () => void;
  onTitleBarMouseDown?: (e: React.MouseEvent) => void;
}) {
  const glyphs = resolveGlyphs(settings.glyphPreset);

  const update = (partial: Partial<DemoSettings>) => {
    onUpdateSettings({ ...settings, ...partial });
  };

  const updateBg = (partial: Partial<BackgroundConfig>) => {
    const current: BackgroundConfig = settings.background || {
      type: "none", opacity: 1, blur: 0, options: {},
    };
    update({ background: { ...current, ...partial } });
  };

  const bg = settings.background;
  const bgType = bg?.type || "none";
  const bgEntry = bgType !== "none" && bgType !== "gradient" ? PROCEDURAL_REGISTRY[bgType] : null;

  const bgTypeOptions = [
    { value: "none", label: "None" },
    { value: "gradient", label: "Gradient" },
    ...Object.entries(PROCEDURAL_REGISTRY).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  return (
    <GlyphProvider value={glyphs}>
        <div className="settings-window">
          {bg && bg.type !== "none" && <BackgroundLayer config={bg} />}
          <div className="settings-title-bar" onMouseDown={onTitleBarMouseDown}>
            <span className="title-bar-text">Settings</span>
            <div className="title-bar-controls">
              <button className="title-bar-btn title-bar-close" onClick={onClose}><Icon name="close" size={12} /></button>
            </div>
          </div>

          <div className="settings-content" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {/* Theme selector */}
            <div className="setting-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
              <span className="setting-name">Theme</span>
              {allThemes.map((t) => (
                <button
                  key={t.id}
                  className={`setting-theme-btn${t.id === currentTheme.id ? " active" : ""}`}
                  onClick={() => onSetTheme(t)}
                >
                  <span className="setting-theme-swatch" style={{ background: t.palette.accent, borderColor: t.palette.bgBase, boxShadow: `0 0 0 1px ${t.palette.border}` }} />
                  <span style={{ flex: 1, textAlign: "left" }}>{t.name}</span>
                  <span className="setting-theme-colors">
                    {[t.palette.bgBase, t.palette.bgSurface, t.palette.textPrimary].map((c, i) => (
                      <span key={i} style={{ background: c, borderColor: t.palette.border }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>

            {/* Background type */}
            <div className="setting-row">
              <div className="setting-label">
                <span className="setting-name">Background type</span>
                <span className="setting-desc">{bgType === "none" ? "No background effect" : bgEntry ? bgEntry.label : "Custom gradient"}</span>
              </div>
              <CustomSelect className="setting-select" value={bgType}
                onChange={(v) => {
                  if (v === "none") {
                    update({ background: undefined });
                  } else if (v === "gradient") {
                    updateBg({ type: "gradient", options: {}, gradient: defaultGradient(currentTheme.palette.accent, currentTheme.palette.bgBase) });
                  } else {
                    updateBg({ type: v as BgType, options: defaultBgOptions(v, currentTheme.palette.accent) });
                  }
                }}
                options={bgTypeOptions}
              />
            </div>

            {bgType === "gradient" && bg && (
              <div className="setting-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <GradientEditor
                  value={bg.gradient || "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)"}
                  onChange={(v) => updateBg({ gradient: v })}
                />
              </div>
            )}

            {bgEntry && bg && (
              <>
                {Object.entries(bgEntry.optionDefs).map(([key, def]) => {
                  const val = bg.options[key] ?? def.default;
                  if (def.type === "boolean") {
                    return (
                      <div key={key} className="setting-row">
                        <span className="setting-name">{def.label}</span>
                        <label className="setting-checkbox">
                          <input type="checkbox" checked={!!val}
                            onChange={(e) => updateBg({ options: { ...bg.options, [key]: e.target.checked } })}
                          />
                        </label>
                      </div>
                    );
                  }
                  if (def.type === "number") {
                    return (
                      <div key={key} className="setting-row">
                        <span className="setting-name">{def.label}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input type="range" min={def.min} max={def.max} step={def.step} value={val as number}
                            onChange={(e) => updateBg({ options: { ...bg.options, [key]: parseFloat(e.target.value) } })}
                            style={{ width: 80, accentColor: "var(--accent)" }}
                          />
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 30 }}>{val}</span>
                        </div>
                      </div>
                    );
                  }
                  if (def.type === "colors" || def.type === "color") {
                    const colors = String(val).split(",").map((c) => c.trim());
                    return (
                      <div key={key} className="setting-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                        <span className="setting-name">{def.label}</span>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {colors.map((c, i) => (
                            <input key={i} type="color" value={c}
                              onChange={(e) => {
                                const next = [...colors]; next[i] = e.target.value;
                                updateBg({ options: { ...bg.options, [key]: next.join(",") } });
                              }}
                              style={{ width: 28, height: 22, border: "1px solid var(--bg-hover)", borderRadius: 3, cursor: "pointer", background: "transparent", padding: 0 }}
                            />
                          ))}
                          {def.type === "colors" && (
                            <button
                              onClick={() => {
                                const next = [...colors, currentTheme.palette.accent];
                                updateBg({ options: { ...bg.options, [key]: next.join(",") } });
                              }}
                              style={{ width: 28, height: 22, border: "1px dashed var(--border)", borderRadius: 3, background: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 14, lineHeight: "20px" }}
                            >+</button>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                <div className="setting-row">
                  <span className="setting-name">Opacity</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="range" min="0" max="1" step="0.05" value={bg.opacity}
                      onChange={(e) => updateBg({ opacity: parseFloat(e.target.value) })}
                      style={{ width: 80, accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 30 }}>{Math.round(bg.opacity * 100)}%</span>
                  </div>
                </div>

                <div className="setting-row">
                  <span className="setting-name">Blur</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="range" min="0" max="30" step="1" value={bg.blur}
                      onChange={(e) => updateBg({ blur: parseInt(e.target.value) })}
                      style={{ width: 80, accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 30 }}>{bg.blur}px</span>
                  </div>
                </div>
              </>
            )}

            {/* Background opacity */}
            <div className="setting-row">
              <div className="setting-label">
                <span className="setting-name">Background opacity</span>
                <span className="setting-desc">Opacity of the window background color</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="range" min="0" max="1" step="0.05" value={settings.bgOpacity}
                  onChange={(e) => update({ bgOpacity: parseFloat(e.target.value) })}
                  style={{ width: 80, accentColor: "var(--accent)" }}
                />
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", minWidth: 36 }}>{Math.round(settings.bgOpacity * 100)}%</span>
              </div>
            </div>

            {/* Button shape */}
            <div className="setting-row">
              <div className="setting-label">
                <span className="setting-name">Button shape</span>
                <span className="setting-desc">Radius style for buttons and inputs</span>
              </div>
              <CustomSelect className="setting-select" value={settings.buttonShape}
                onChange={(v) => update({ buttonShape: v as DemoSettings["buttonShape"] })}
                options={[
                  { value: "sharp", label: "Sharp" },
                  { value: "rounded", label: "Rounded" },
                  { value: "pill", label: "Pill" },
                ]}
              />
            </div>

            {/* Icon style */}
            <div className="setting-row">
              <div className="setting-label">
                <span className="setting-name">Icon style</span>
                <span className="setting-desc">Glyph preset for all icons</span>
              </div>
              <CustomSelect className="setting-select" value={settings.glyphPreset}
                onChange={(v) => update({ glyphPreset: v })}
                options={[
                  { value: "default", label: "Default" },
                  { value: "rounded", label: "Rounded" },
                  { value: "minimal", label: "Minimal" },
                ]}
              />
            </div>
          </div>
        </div>
    </GlyphProvider>
  );
}
