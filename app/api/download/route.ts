import { NextRequest } from "next/server";
import { fetchMedia, parseRedgifsId, RedgifsError } from "@/lib/redgifs";

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

    return new Response(upstream.body, { headers });
  } catch (err) {
    if (err instanceof RedgifsError) {
      const message =
        err.status === 404
          ? "Video not found."
          : err.status === 410
            ? "This video has been removed."
            : "Download failed — RedGifs is unreachable. Try again in a moment.";
      return errorResponse(message, err.status);
    }
    return errorResponse("Download failed. Try again.", 500);
  }
}
