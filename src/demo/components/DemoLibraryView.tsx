// Simplified library view — static demo tracks
import { demoTracks } from "../demoTracks";
import TrackList from "./DemoTrackList";
import type { SearchResult } from "../api/types";

export default function LibraryView({
  onPlay,
  onAddToQueue,
  currentTrackId,
}: {
  onPlay: (track: SearchResult) => void;
  onAddToQueue: (track: SearchResult) => void;
  currentTrackId: string | null;
}) {
  return (
    <div className="home-browser">
      <div className="home-section">
        <h2 className="home-section-title">Demo Library</h2>
        <p className="home-section-subtitle">{demoTracks.length} tracks</p>
        <TrackList
          results={demoTracks}
          onSelect={onPlay}
          onAddToQueue={onAddToQueue}
          activeId={currentTrackId}
        />
      </div>
    </div>
  );
}
