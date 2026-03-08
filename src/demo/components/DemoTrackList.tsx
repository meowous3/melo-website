// Copied from musetop TrackList.tsx — simplified (no playlists, no layouts, no infinite scroll)
import type { SearchResult } from "../api/types";
import { Icon } from "./DemoIcon";

function startTextScroll(e: React.MouseEvent<HTMLSpanElement>) {
  const el = e.currentTarget;
  let overflow = el.scrollWidth - el.clientWidth;
  if (overflow <= 1) return;
  el.style.setProperty("--scroll-dist", `-${overflow + 8}px`);
  el.style.setProperty("--scroll-duration", `${Math.max(4, overflow / 30)}s`);
  el.classList.add("scrolling");
  const newOverflow = el.scrollWidth - el.clientWidth;
  if (newOverflow <= 1) {
    el.style.setProperty("--scroll-dist", "0px");
    el.style.setProperty("--scroll-duration", "0s");
  } else if (newOverflow !== overflow) {
    el.style.setProperty("--scroll-dist", `-${newOverflow + 8}px`);
    el.style.setProperty("--scroll-duration", `${Math.max(4, newOverflow / 30)}s`);
  }
}

function stopTextScroll(e: React.MouseEvent<HTMLSpanElement>) {
  e.currentTarget.classList.remove("scrolling");
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TrackList({
  results,
  onSelect,
  onAddToQueue,
  activeId,
  loading,
}: {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onAddToQueue?: (result: SearchResult) => void;
  activeId: string | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <ul className="track-list">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="track-item">
            <div className="track-thumb skeleton shimmer" />
            <div className="track-info">
              <span className="track-title skeleton shimmer" style={{ width: "60%", height: 14 }} />
              <span className="track-meta skeleton shimmer" style={{ width: "40%", height: 12 }} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (results.length === 0) return null;

  return (
    <ul className="track-list">
      {results.map((r) => (
        <li
          key={r.id}
          className={`track-item${r.id === activeId ? " active" : ""}`}
          onClick={() => onSelect(r)}
        >
          <img
            className="track-thumb"
            src={r.thumbnail}
            alt=""
            loading="lazy"
          />
          <div className="track-info">
            <span className="track-title" onMouseEnter={startTextScroll} onMouseLeave={stopTextScroll}>{r.title}</span>
            <span className="track-meta" onMouseEnter={startTextScroll} onMouseLeave={stopTextScroll}>
              {r.channel}
              {r.duration > 0 && ` · ${formatDuration(r.duration)}`}
            </span>
          </div>
          {onAddToQueue && (
            <button
              className="track-add-btn"
              onClick={(e) => { e.stopPropagation(); onAddToQueue(r); }}
              title="Add to queue"
            >
              <Icon name="plus" size={14} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
