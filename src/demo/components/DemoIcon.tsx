// Copied from musetop/src/renderer/src/icons.tsx — default glyph set
// Standalone version that doesn't use React context

interface GlyphDef {
  d: string | string[];
  fill?: boolean;
  viewBox?: string;
  strokeWidth?: number;
}

const glyphs: Record<string, GlyphDef> = {
  close: {
    d: ["M18 6L6 18", "M6 6L18 18"],
    strokeWidth: 2.5,
  },
  chevronDown: {
    d: "M6 9L12 15L18 9",
    strokeWidth: 2,
  },
  chevronUp: {
    d: "M6 15L12 9L18 15",
    strokeWidth: 2,
  },
  search: {
    d: ["M3.5 10.5A7 7 0 1 0 17.5 10.5A7 7 0 1 0 3.5 10.5", "M15.5 15.5L21 21"],
    strokeWidth: 2.5,
  },
  play: {
    d: "M6 3.5L20 12L6 20.5V3.5Z",
    fill: true,
  },
  pause: {
    d: ["M5 3H10V21H5Z", "M14 3H19V21H14Z"],
    fill: true,
  },
  prevTrack: {
    d: ["M4 3H7V21H4Z", "M20 3.5L9 12L20 20.5V3.5Z"],
    fill: true,
  },
  nextTrack: {
    d: ["M4 3.5L15 12L4 20.5V3.5Z", "M17 3H20V21H17Z"],
    fill: true,
  },
  queueList: {
    d: ["M3 6H21", "M3 12H21", "M3 18H21"],
    strokeWidth: 2.5,
  },
  save: {
    d: ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", "M17 21V13H7V21", "M7 3V8H15"],
    strokeWidth: 2,
  },
  shuffle: {
    d: ["M16 3H21V8", "M4 20L21 3", "M21 16V21H16", "M15 15L21 21", "M4 4L9 9"],
    strokeWidth: 2,
  },
  filter: {
    d: ["M12 5A2 2 0 1 0 12 9A2 2 0 1 0 12 5Z", "M12 10A2 2 0 1 0 12 14A2 2 0 1 0 12 10Z", "M12 15A2 2 0 1 0 12 19A2 2 0 1 0 12 15Z"],
    fill: true,
  },
  plus: {
    d: ["M12 5V19", "M5 12H19"],
    strokeWidth: 2.5,
  },
};

export type IconName = keyof typeof glyphs;

export function Icon({
  name,
  size = 14,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const glyph = glyphs[name];
  if (!glyph) return null;
  const viewBox = glyph.viewBox || "0 0 24 24";
  const paths = Array.isArray(glyph.d) ? glyph.d : [glyph.d];
  const isFill = glyph.fill === true;
  const sw = glyph.strokeWidth ?? 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={isFill ? "currentColor" : "none"}
      stroke={isFill ? "none" : "currentColor"}
      strokeWidth={isFill ? undefined : sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0 }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
