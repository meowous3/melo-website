import type { SearchResult, StreamResult, ApiResponse } from "./types";

const CORS_PROXY = "https://corsproxy.io/?url=";

const INSTANCES = [
  "https://api.piped.private.coffee",
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
];

let apiBase = INSTANCES[0];

export function setApiBase(url: string) {
  apiBase = url;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; ts: number }>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

function proxyUrl(url: string): string {
  return CORS_PROXY + encodeURIComponent(url);
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithFallback(path: string): Promise<Response> {
  // Try current instance first
  try {
    const res = await fetchWithTimeout(proxyUrl(`${apiBase}${path}`));
    if (res.ok) return res;
  } catch { /* try fallback */ }

  // Try other instances
  for (const instance of INSTANCES) {
    if (instance === apiBase) continue;
    try {
      const res = await fetchWithTimeout(proxyUrl(`${instance}${path}`));
      if (res.ok) {
        apiBase = instance;
        return res;
      }
    } catch { /* try next */ }
  }

  throw new Error("All Piped instances failed");
}

function mapPipedItem(item: any): SearchResult {
  const id = (item.url || "").replace("/watch?v=", "");
  return {
    id,
    title: item.title || "",
    channel: item.uploaderName || item.uploader || "",
    thumbnail: item.thumbnail || "",
    duration: item.duration || 0,
  };
}

export async function search(query: string): Promise<ApiResponse<SearchResult[]>> {
  const cacheKey = `search:${query}`;
  const cached = getCached<SearchResult[]>(cacheKey, 5 * 60_000);
  if (cached) return { ok: true, data: cached };

  try {
    const res = await fetchWithFallback(
      `/search?q=${encodeURIComponent(query)}&filter=music_songs`
    );
    const json = await res.json();
    const items: SearchResult[] = (json.items || [])
      .filter((i: any) => i.type === "stream")
      .map(mapPipedItem);
    setCache(cacheKey, items);
    return { ok: true, data: items };
  } catch (e: any) {
    return { ok: false, error: e.message || "Search failed" };
  }
}

export async function getStream(videoId: string): Promise<ApiResponse<StreamResult>> {
  const cacheKey = `stream:${videoId}`;
  const cached = getCached<StreamResult>(cacheKey, 5 * 60_000);
  if (cached) return { ok: true, data: cached };

  try {
    const res = await fetchWithFallback(`/streams/${videoId}`);
    const json = await res.json();

    // Pick best audio stream (prefer opus/webm, then m4a)
    const audioStreams: any[] = json.audioStreams || [];
    const sorted = audioStreams
      .filter((s: any) => s.mimeType?.startsWith("audio/"))
      .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

    const stream = sorted.find((s: any) => s.mimeType?.includes("webm"))
      || sorted.find((s: any) => s.mimeType?.includes("mp4"))
      || sorted[0];

    if (!stream) {
      return { ok: false, error: "No audio stream found" };
    }

    const result: StreamResult = {
      audioUrl: stream.url,
      duration: json.duration || 0,
      title: json.title || "",
      channel: json.uploader || "",
      thumbnail: json.thumbnailUrl || "",
      relatedStreams: (json.relatedStreams || [])
        .filter((r: any) => r.type === "stream" && r.duration > 0 && r.duration < 600)
        .slice(0, 15)
        .map(mapPipedItem),
    };

    setCache(cacheKey, result);
    return { ok: true, data: result };
  } catch (e: any) {
    return { ok: false, error: e.message || "Stream fetch failed" };
  }
}

export async function getSuggestions(videoId: string): Promise<ApiResponse<SearchResult[]>> {
  const streamResult = await getStream(videoId);
  if (!streamResult.ok) return streamResult;
  return { ok: true, data: streamResult.data.relatedStreams };
}

export async function getTrending(): Promise<ApiResponse<SearchResult[]>> {
  const cacheKey = "trending";
  const cached = getCached<SearchResult[]>(cacheKey, 10 * 60_000);
  if (cached) return { ok: true, data: cached };

  try {
    const res = await fetchWithFallback("/trending?region=US");
    const json = await res.json();
    const items: SearchResult[] = (json || [])
      .filter((i: any) => i.type === "stream" && i.duration > 0 && i.duration < 600)
      .slice(0, 20)
      .map(mapPipedItem);
    setCache(cacheKey, items);
    return { ok: true, data: items };
  } catch (e: any) {
    return { ok: false, error: e.message || "Trending fetch failed" };
  }
}
