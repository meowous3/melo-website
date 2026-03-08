// Adapted from musetop HomeBrowser.tsx — uses Piped trending instead of YouTube API
import { useEffect, useState } from "react";
import { getTrending } from "../api/pipedApi";
import type { SearchResult } from "../api/types";
import TrackList from "./DemoTrackList";

export default function HomeBrowser({
  onPlay,
  onAddToQueue,
  currentTrackId,
}: {
  onPlay: (track: SearchResult) => void;
  onAddToQueue: (track: SearchResult) => void;
  currentTrackId: string | null;
}) {
  const [tracks, setTracks] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTrending().then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setTracks(res.data);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (error) {
    return <div className="home-error">{error}</div>;
  }

  return (
    <div className="home-browser">
      <div className="home-section">
        <h2 className="home-section-title">Trending</h2>
        <TrackList
          results={tracks}
          onSelect={onPlay}
          onAddToQueue={onAddToQueue}
          activeId={currentTrackId}
          loading={loading}
        />
      </div>
    </div>
  );
}
