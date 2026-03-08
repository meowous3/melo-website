import { useState, useCallback, useRef } from "react";
import type { LandingTheme } from "../themes";
import type { SearchResult } from "./api/types";
import { search, getStream } from "./api/pipedApi";
import { useDemoAudio } from "./hooks/useDemoAudio";
import { DemoWindowChrome } from "./DemoWindowChrome";
import Player from "./components/DemoPlayer";
import SearchBar from "./components/DemoSearchBar";
import TrackList from "./components/DemoTrackList";
import HomeBrowser from "./components/DemoHomeBrowser";
import LibraryView from "./components/DemoLibraryView";
import QueuePanel from "./components/DemoQueuePanel";

type DemoView = "home" | "library" | "search";
type PanelMode = "suggestions" | "queue";

interface Props {
  currentTheme: LandingTheme;
  onThemeChange: (theme: LandingTheme) => void;
}

export function DemoApp({ currentTheme, onThemeChange }: Props) {
  // View state
  const [view, setView] = useState<DemoView>("home");

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Track/stream state
  const [track, setTrack] = useState<SearchResult | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);

  // Queue state
  const [queue, setQueue] = useState<SearchResult[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  // Autoplay / suggestions
  const [autoplay, setAutoplay] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);

  // Panel state
  const [showPanel, setShowPanel] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("suggestions");

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Drag/resize state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ w: 900, h: 540 });
  const dragState = useRef<{ startX: number; startY: number; offX: number; offY: number } | null>(null);
  const resizeState = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);

  // Refs to avoid stale closures in onEnded
  const queueRef = useRef<SearchResult[]>([]);
  const queueIndexRef = useRef(0);
  const autoplayRef = useRef<SearchResult | null>(null);
  const playTrackRef = useRef<(t: SearchResult) => void>(() => {});

  queueRef.current = queue;
  queueIndexRef.current = queueIndex;
  autoplayRef.current = autoplay;

  // Audio ended handler
  const handleTrackEnded = useCallback(() => {
    const q = queueRef.current;
    const qi = queueIndexRef.current;

    if (q.length > 0 && qi < q.length - 1) {
      const next = qi + 1;
      setQueueIndex(next);
      playTrackRef.current(q[next]);
      return;
    }

    const ap = autoplayRef.current;
    if (ap) playTrackRef.current(ap);
  }, []);

  const [audio, controls] = useDemoAudio(handleTrackEnded);

  // Core play function
  const playTrack = useCallback(
    async (t: SearchResult) => {
      setTrack(t);
      setStreamLoading(true);
      setError(null);
      setAutoplay(null);
      setSuggestions([]);

      const res = await getStream(t.id);
      if (!res.ok) {
        setError(res.error);
        setStreamLoading(false);
        return;
      }

      controls.play(res.data.audioUrl);
      setStreamLoading(false);

      if (res.data.relatedStreams.length > 0) {
        setAutoplay(res.data.relatedStreams[0]);
        setSuggestions(res.data.relatedStreams.slice(1));
      }
    },
    [controls],
  );

  playTrackRef.current = playTrack;

  // Search handler
  const handleSearch = useCallback(
    async (query: string) => {
      setView("search");
      setSearching(true);
      setError(null);

      const res = await search(query);
      if (res.ok) setSearchResults(res.data);
      else setError(res.error);
      setSearching(false);
    },
    [],
  );

  // Play from search/trending/library (clears queue)
  const handlePlayTrack = useCallback(
    (t: SearchResult) => {
      setQueue([]);
      setQueueIndex(0);
      playTrack(t);
    },
    [playTrack],
  );

  // Add to queue
  const handleAddToQueue = useCallback(
    (t: SearchResult) => {
      setQueue((prev) => {
        if (prev.length === 0 && track) {
          setQueueIndex(0);
          setPanelMode("queue");
          setShowPanel(true);
          return [track, t];
        }
        return [...prev, t];
      });
    },
    [track],
  );

  // Queue jump
  const handleJumpQueue = useCallback(
    (index: number) => {
      setQueueIndex(index);
      playTrack(queue[index]);
    },
    [queue, playTrack],
  );

  // Queue reorder
  const handleReorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      setQueue((prev) => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        setQueueIndex((qi) => {
          if (qi === fromIndex) return toIndex;
          if (fromIndex < qi && toIndex >= qi) return qi - 1;
          if (fromIndex > qi && toIndex <= qi) return qi + 1;
          return qi;
        });
        return next;
      });
    },
    [],
  );

  // Queue clear
  const handleClearQueue = useCallback(() => {
    setQueue([]);
    setQueueIndex(0);
    setPanelMode("suggestions");
  }, []);

  // Queue shuffle (upcoming only)
  const handleShuffleQueue = useCallback(() => {
    setQueue((prev) => {
      const qi = queueIndexRef.current;
      const played = prev.slice(0, qi + 1);
      const upcoming = prev.slice(qi + 1);
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }
      return [...played, ...upcoming];
    });
  }, []);

  // Play autoplay track
  const handlePlayAutoplay = useCallback(() => {
    if (autoplay) handlePlayTrack(autoplay);
  }, [autoplay, handlePlayTrack]);

  // Play suggestion
  const handlePlaySuggestion = useCallback(
    (index: number) => {
      if (suggestions[index]) handlePlayTrack(suggestions[index]);
    },
    [suggestions, handlePlayTrack],
  );

  // Previous track
  const handlePrev = useCallback(() => {
    if (queue.length > 0 && queueIndex > 0) {
      const prevI = queueIndex - 1;
      setQueueIndex(prevI);
      playTrack(queue[prevI]);
    }
  }, [queue, queueIndex, playTrack]);

  // Next track
  const handleNext = useCallback(() => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      const nextI = queueIndex + 1;
      setQueueIndex(nextI);
      playTrack(queue[nextI]);
    } else if (autoplay) {
      handlePlayAutoplay();
    }
  }, [queue, queueIndex, playTrack, autoplay, handlePlayAutoplay]);

  const hasNext = (queue.length > 0 && queueIndex < queue.length - 1) || !!autoplay;

  // ── Drag handling ──
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        offX: offset.x,
        offY: offset.y,
      };
      const onMove = (ev: MouseEvent) => {
        if (!dragState.current) return;
        setOffset({
          x: dragState.current.offX + ev.clientX - dragState.current.startX,
          y: dragState.current.offY + ev.clientY - dragState.current.startY,
        });
      };
      const onUp = () => {
        dragState.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [offset],
  );

  // ── Resize handling ──
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeState.current = {
        startX: e.clientX,
        startY: e.clientY,
        w: windowSize.w,
        h: windowSize.h,
      };
      const onMove = (ev: MouseEvent) => {
        if (!resizeState.current) return;
        setWindowSize({
          w: Math.max(400, resizeState.current.w + ev.clientX - resizeState.current.startX),
          h: Math.max(300, resizeState.current.h + ev.clientY - resizeState.current.startY),
        });
      };
      const onUp = () => {
        resizeState.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [windowSize],
  );

  return (
    <div
      className="demo-window"
      style={{
        width: windowSize.w,
        height: windowSize.h,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      <DemoWindowChrome
        currentTheme={currentTheme}
        onThemeChange={onThemeChange}
        view={view}
        onViewChange={setView}
        onTitleBarMouseDown={handleDragStart}
      />

      <div className="main-area">
        <div className="main-content">
          {view === "search" && (
            <>
              <SearchBar onSearch={handleSearch} disabled={searching} />
              <TrackList
                results={searchResults}
                onSelect={handlePlayTrack}
                onAddToQueue={handleAddToQueue}
                activeId={track?.id ?? null}
                loading={searching}
              />
            </>
          )}

          {view === "home" && (
            <HomeBrowser
              onPlay={handlePlayTrack}
              onAddToQueue={handleAddToQueue}
              currentTrackId={track?.id ?? null}
            />
          )}

          {view === "library" && (
            <LibraryView
              onPlay={handlePlayTrack}
              onAddToQueue={handleAddToQueue}
              currentTrackId={track?.id ?? null}
            />
          )}

          {error && <div className="demo-error-toast">{error}</div>}
        </div>

        {showPanel && (
          <QueuePanel
            mode={panelMode}
            onSetMode={setPanelMode}
            autoplay={autoplay}
            suggestions={suggestions}
            queue={queue}
            queueIndex={queueIndex}
            onPlayAutoplay={handlePlayAutoplay}
            onPlaySuggestion={handlePlaySuggestion}
            onJumpQueue={handleJumpQueue}
            onReorderQueue={handleReorderQueue}
            hasQueue={queue.length > 0}
            onClearQueue={handleClearQueue}
            onShuffleQueue={handleShuffleQueue}
          />
        )}
      </div>

      <Player
        track={track}
        audio={audio}
        controls={controls}
        loading={streamLoading}
        onPrev={handlePrev}
        onNext={handleNext}
        hasNext={hasNext}
        queueLength={queue.length}
        showQueue={showPanel}
        onToggleQueue={() => setShowPanel((p) => !p)}
      />

      <div className="demo-resize-handle" onMouseDown={handleResizeStart} />
    </div>
  );
}
