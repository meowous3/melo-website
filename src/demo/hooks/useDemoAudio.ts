import { useRef, useState, useCallback, useEffect } from "react";

export interface DemoAudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  loading: boolean;
}

export interface DemoAudioControls {
  play: (url: string) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (fraction: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export function useDemoAudio(onEnded: () => void): [DemoAudioState, DemoAudioControls] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const [state, setState] = useState<DemoAudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    loading: false,
  });

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onLoadedMetadata = () => {
      setState((s) => ({ ...s, duration: audio.duration, loading: false }));
    };
    const onTimeUpdate = () => {
      setState((s) => ({
        ...s,
        currentTime: audio.currentTime,
        duration: audio.duration || s.duration,
      }));
    };
    const onProgress = () => {
      if (audio.buffered.length > 0) {
        setState((s) => ({
          ...s,
          buffered: audio.buffered.end(audio.buffered.length - 1),
        }));
      }
    };
    const onWaiting = () => setState((s) => ({ ...s, loading: true }));
    const onCanPlay = () => setState((s) => ({ ...s, loading: false }));

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("progress", onProgress);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("progress", onProgress);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  // Keep onEnded callback fresh without recreating audio element
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  // Actually, let's fix the ended handler to use ref
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handler = () => {
      setState((s) => ({ ...s, isPlaying: false }));
      onEndedRef.current();
    };
    audio.addEventListener("ended", handler);
    return () => audio.removeEventListener("ended", handler);
  }, []);

  // Smooth progress bar via rAF
  useEffect(() => {
    if (!state.isPlaying) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        setState((s) => ({ ...s, currentTime: audio.currentTime }));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [state.isPlaying]);

  const play = useCallback((url: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    setState((s) => ({ ...s, loading: true, currentTime: 0, duration: 0, buffered: 0 }));
    audio.src = url;
    audio.play().catch(() => {
      setState((s) => ({ ...s, loading: false }));
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, []);

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = fraction * audio.duration;
  }, []);

  return [state, { play, pause, resume, togglePlay, seek, audioRef }];
}
