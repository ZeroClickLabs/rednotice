"use client";

import { useState } from "react";
import posthog from "posthog-js";

interface VideoInfo {
  id: string;
  title: string | null;
  duration: number;
  width: number;
  height: number;
  hasHd: boolean;
  hasSd: boolean;
  posterPath: string | null;
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function Downloader() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<VideoInfo | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    posthog.capture("url_submitted", { url_length: input.trim().length });

    setLoading(true);
    setError(null);
    setVideo(null);
    try {
      const res = await fetch(`/api/info?url=${encodeURIComponent(input)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        posthog.capture("lookup_failed", { error_status: res.status });
      } else {
        setVideo(data);
        posthog.capture("video_loaded", {
          has_hd: data.hasHd,
          has_sd: data.hasSd,
          duration: data.duration,
          width: data.width,
          height: data.height,
        });
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      posthog.capture("lookup_failed", { error_status: 0 });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    posthog.capture("download_another_clicked");
    setInput("");
    setVideo(null);
    setError(null);
  }

  return (
    <div className="downloader">
      <form onSubmit={handleSubmit} className="url-form">
        <input
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="https://www.redgifs.com/watch/..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-label="RedGifs video URL"
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? "Downloading..." : "Download"}
        </button>
      </form>

      {error && <p className="error" role="alert">{error}</p>}

      {video && (
        <div className="card">
          {video.posterPath && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="poster" src={video.posterPath} alt="Video preview" />
          )}
          <div className="meta">
            <h2>{video.title ?? video.id}</h2>
            <p>
              {formatDuration(video.duration)} · {video.width}×{video.height}
            </p>
          </div>
          <div className="actions">
            {video.hasHd && (
              <a
                className="download hd"
                href={`/api/download?id=${encodeURIComponent(video.id)}&quality=hd`}
                onClick={() => posthog.capture("download_clicked", { quality: "hd", video_id: video.id })}
              >
                Download HD
              </a>
            )}
            {video.hasSd && (
              <a
                className="download sd"
                href={`/api/download?id=${encodeURIComponent(video.id)}&quality=sd`}
                onClick={() => posthog.capture("download_clicked", { quality: "sd", video_id: video.id })}
              >
                Download SD
              </a>
            )}
          </div>
          <p className="hint">Longer videos can take a moment to start downloading.</p>
          <button type="button" className="reset" onClick={reset}>
            Download another
          </button>
        </div>
      )}
    </div>
  );
}
