import { NextRequest } from "next/server";
import { fetchMedia, parseRedgifsId, RedgifsError } from "@/lib/redgifs";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Reached by full-page navigation (anchor click), so errors are plain text
// the browser can render.
function errorResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = parseRedgifsId(params.get("id") ?? "");
  if (!id) {
    return errorResponse("Invalid or missing video id.", 400);
  }
  const requestedQuality = params.get("quality") === "sd" ? "sd" : "hd";

  const posthog = getPostHogClient();
  try {
    let actualQuality = requestedQuality;
    const { upstream } = await fetchMedia(id, (gif) => {
      if (requestedQuality === "hd" && !gif.hdUrl) actualQuality = "sd";
      if (requestedQuality === "sd" && !gif.sdUrl) actualQuality = "hd";
      return actualQuality === "hd" ? gif.hdUrl : gif.sdUrl;
    });

    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${id}-${actualQuality}.mp4"`,
      "Cache-Control": "no-store",
    });
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    posthog.capture({
      distinctId: id,
      event: "download_initiated",
      properties: {
        video_id: id,
        requested_quality: requestedQuality,
        actual_quality: actualQuality,
        quality_fallback: actualQuality !== requestedQuality,
      },
    });
    await posthog.flush();

    return new Response(upstream.body, { headers });
  } catch (err) {
    if (err instanceof RedgifsError) {
      const message =
        err.status === 404
          ? "Video not found."
          : err.status === 410
            ? "This video has been removed."
            : "Download failed — RedGifs is unreachable. Try again in a moment.";
      posthog.capture({
        distinctId: id,
        event: "download_error",
        properties: { video_id: id, requested_quality: requestedQuality, error_status: err.status },
      });
      await posthog.flush();
      return errorResponse(message, err.status);
    }
    posthog.capture({
      distinctId: id,
      event: "download_error",
      properties: { video_id: id, requested_quality: requestedQuality, error_status: 500 },
    });
    await posthog.flush();
    return errorResponse("Download failed. Try again.", 500);
  }
}
