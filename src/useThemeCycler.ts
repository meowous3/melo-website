import { useState, useEffect, useCallback, useRef } from "react";
import { darkThemes, lightThemes, applyTheme } from "./themes";
import type { LandingTheme } from "./themes";

const CYCLE_INTERVAL = 30_000;

export function useThemeCycler() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const pool = prefersDark ? darkThemes : lightThemes;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const theme = pool[index % pool.length];

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Reset when dark/light changes
  useEffect(() => {
    setIndex(0);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [prefersDark]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (progressRef.current) { clearInterval(progressRef.current); progressRef.current = null; }
  }, []);

  const startCycling = useCallback(() => {
    clearTimers();
    startTimeRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % pool.length);
      startTimeRef.current = Date.now();
      setProgress(0);
    }, CYCLE_INTERVAL);

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min(elapsed / CYCLE_INTERVAL, 1));
    }, 100);
  }, [pool.length, clearTimers]);

  useEffect(() => {
    if (!paused) startCycling();
    else clearTimers();
    return clearTimers;
  }, [paused, startCycling, clearTimers]);

  // Pause on tab hidden
  useEffect(() => {
    const handler = () => {
      if (document.hidden) clearTimers();
      else if (!paused) startCycling();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [paused, startCycling, clearTimers]);

  const jumpTo = useCallback((target: LandingTheme | number) => {
    const newIndex = typeof target === "number"
      ? target % pool.length
      : pool.findIndex((t) => t.id === target.id);
    if (newIndex >= 0) setIndex(newIndex);
    setProgress(0);
    startTimeRef.current = Date.now();
    if (!paused) startCycling();
  }, [pool, paused, startCycling]);

  const next = useCallback(() => jumpTo((index + 1) % pool.length), [index, pool.length, jumpTo]);
  const prev = useCallback(() => jumpTo((index - 1 + pool.length) % pool.length), [index, pool.length, jumpTo]);
  const togglePause = useCallback(() => setPaused((p) => !p), []);

  return { theme, index, pool, paused, progress, jumpTo, next, prev, togglePause };
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
