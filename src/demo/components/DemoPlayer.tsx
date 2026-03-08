// Copied from musetop Player.tsx — adapted for browser (single audio, no crossfade/drag/resize)
import { useRef, useEffect, useCallback } from "react";
import { Icon } from "./DemoIcon";
import type { SearchResult } from "../api/types";
import type { DemoAudioState, DemoAudioControls } from "../hooks/useDemoAudio";

function formatTime(s: number): string {
  if (!isFinite(s)) return "0:00";
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Player({
  track,
  loading,
  audio,
  controls,
  onPrev,
  onNext,
  hasNext,
  queueLength,
  onToggleQueue,
  showQueue,
}: {
  track: SearchResult | null;
  loading: boolean;
  audio: DemoAudioState;
  controls: DemoAudioControls;
  onPrev: () => void;
  onNext: () => void;
  hasNext: boolean;
  queueLength: number;
  onToggleQueue: () => void;
  showQueue: boolean;
}) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressRafRef = useRef<number>(0);

  // Smooth progress bar via rAF
  useEffect(() => {
    const tick = () => {
      const audioEl = controls.audioRef.current;
      const bar = progressBarRef.current;
      if (audioEl && bar && audioEl.duration > 0) {
        bar.style.width = `${(audioEl.currentTime / audioEl.duration) * 100}%`;
      }
      progressRafRef.current = requestAnimationFrame(tick);
    };
    if (audio.isPlaying) {
      progressRafRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(progressRafRef.current);
  }, [audio.isPlaying, controls.audioRef]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audio.duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      controls.seek(ratio);
    },
    [audio.duration, controls],
  );

  const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  const bufferedPct = audio.duration ? (audio.buffered / audio.duration) * 100 : 0;

  return (
    <div className="player">
      {track ? (
        <div className="player-meta">
          {track.thumbnail && (
            <img className="player-thumb" src={track.thumbnail} alt="" />
          )}
          <div className="player-info">
            <span className="player-title">{track.title}</span>
            <span className="player-channel">{track.channel}</span>
          </div>
        </div>
      ) : (
        <div className="player-skeleton">
          <div className={`player-thumb skeleton${loading ? " shimmer" : ""}`} />
          <div className="player-info">
            <span className={`player-title skeleton${loading ? " shimmer" : ""}`} />
            <span className={`player-channel skeleton${loading ? " shimmer" : ""}`} />
          </div>
        </div>
      )}

      <div className="player-controls">
        <button
          className="player-skip"
          onClick={onPrev}
          disabled={!track}
          title="Previous"
        >
          <Icon name="prevTrack" size={14} />
        </button>

        <button className="player-playpause" onClick={controls.togglePlay} disabled={!track}>
          {audio.isPlaying
            ? <Icon name="pause" size={14} />
            : <Icon name="play" size={14} />
          }
        </button>

        <button
          className="player-skip"
          onClick={onNext}
          disabled={!hasNext}
          title="Next"
        >
          <Icon name="nextTrack" size={14} />
        </button>
      </div>

      <div className="player-progress-wrap">
        <span className="player-time">{formatTime(audio.currentTime)}</span>
        <div className="player-progress" onClick={handleSeek}>
          <div className="player-progress-buffered" style={{ width: `${bufferedPct}%` }} />
          <div ref={progressBarRef} className="player-progress-played" style={{ width: `${progress}%` }} />
        </div>
        <span className="player-time">{formatTime(audio.duration)}</span>
      </div>

      <button
        className={`player-queue-btn${showQueue ? " active" : ""}`}
        onClick={onToggleQueue}
        disabled={!track}
        title="Queue"
      >
        <Icon name="queueList" size={14} />{queueLength > 1 && <span>{queueLength}</span>}
      </button>
    </div>
  );
}
