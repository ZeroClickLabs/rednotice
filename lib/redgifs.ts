// Minimal RedGifs API v2 client.
//
// Tokens from /v2/auth/temporary are JWTs bound to the requesting IP
// (`valid_addr`) and User-Agent (`valid_agent`). Media URLs may be gated the
// same way. Everything that touches a media URL must therefore happen in the
// same serverless invocation that fetched the token, with the same User-Agent.

const API_BASE = "https://api.redgifs.com/v2";

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export class RedgifsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "RedgifsError";
  }
}

export interface GifInfo {
  id: string;
  title: string | null;
  duration: number;
  width: number;
  height: number;
  hdUrl: string | null;
  sdUrl: string | null;
  posterUrl: string | null;
}

/**
 * Extract a gif id from any RedGifs URL form or a bare id.
 * Accepts watch/ifr pages, v3/i subdomains, direct media links, or the id itself.
 */
export function parseRedgifsId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (/^(https?:)?\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
    } catch {
      return null;
    }
    if (!/(^|\.)redgifs\.com$/i.test(url.hostname)) return null;
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return null;
    // /watch/{id}, /ifr/{id}, /i/{id}.mp4 — the id is the last segment
    candidate = segments[segments.length - 1];
  }

  // Strip a file extension from direct media links, and any -hd/-mobile suffix
  candidate = candidate
    .replace(/\.(mp4|webm|jpg|jpeg|png|gif)$/i, "")
    .replace(/-(hd|sd|mobile|silent|poster)$/i, "")
    .toLowerCase();

  return /^[a-z0-9]+$/.test(candidate) ? candidate : null;
}

let cachedToken: { token: string; fetchedAt: number } | null = null;
const TOKEN_TTL_MS = 60 * 60 * 1000;

async function getToken(force = false): Promise<string> {
  if (!force && cachedToken && Date.now() - cachedToken.fetchedAt < TOKEN_TTL_MS) {
    return cachedToken.token;
  }
  const res = await fetch(`${API_BASE}/auth/temporary`, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new RedgifsError(`token request failed (${res.status})`, 502);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    throw new RedgifsError("token missing from auth response", 502);
  }
  cachedToken = { token: data.token, fetchedAt: Date.now() };
  return data.token;
}

interface GifResponse {
  gif?: {
    id: string;
    title?: string | null;
    description?: string | null;
    duration?: number;
    width?: number;
    height?: number;
    urls?: {
      hd?: string;
      sd?: string;
      poster?: string;
      thumbnail?: string;
    };
  };
}

export async function getGif(id: string): Promise<GifInfo> {
  let res = await fetchGif(id, await getToken());
  if (res.status === 401) {
    res = await fetchGif(id, await getToken(true));
  }
  if (res.status === 404) {
    throw new RedgifsError("video not found", 404);
  }
  if (res.status === 410) {
    throw new RedgifsError("video has been removed", 410);
  }
  if (!res.ok) {
    throw new RedgifsError(`metadata request failed (${res.status})`, 502);
  }

  const { gif } = (await res.json()) as GifResponse;
  if (!gif) {
    throw new RedgifsError("malformed metadata response", 502);
  }
  return {
    id: gif.id,
    title: gif.title || gif.description || null,
    duration: gif.duration ?? 0,
    width: gif.width ?? 0,
    height: gif.height ?? 0,
    hdUrl: gif.urls?.hd ?? null,
    sdUrl: gif.urls?.sd ?? null,
    posterUrl: gif.urls?.poster ?? gif.urls?.thumbnail ?? null,
  };
}

function fetchGif(id: string, token: string): Promise<Response> {
  return fetch(`${API_BASE}/gifs/${id}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

/**
 * Fetch a media URL (video or poster). On 401/403 — a rejected signed URL —
 * refresh the token, re-fetch metadata for a fresh URL, and retry exactly once.
 */
export async function fetchMedia(
  id: string,
  pickUrl: (gif: GifInfo) => string | null,
): Promise<{ gif: GifInfo; upstream: Response }> {
  let gif = await getGif(id);
  let url = pickUrl(gif);
  if (!url) {
    throw new RedgifsError("no media available for this video", 404);
  }

  let upstream = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Referer: "https://www.redgifs.com/" },
    cache: "no-store",
  });

  if (upstream.status === 401 || upstream.status === 403) {
    await getToken(true);
    gif = await getGif(id);
    url = pickUrl(gif);
    if (!url) {
      throw new RedgifsError("no media available for this video", 404);
    }
    upstream = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Referer: "https://www.redgifs.com/" },
      cache: "no-store",
    });
  }

  if (!upstream.ok || !upstream.body) {
    throw new RedgifsError(`media fetch failed (${upstream.status})`, 502);
  }
  return { gif, upstream };
}
