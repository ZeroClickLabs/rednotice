import { NextRequest } from "next/server";
import { fetchMedia, parseRedgifsId, RedgifsError } from "@/lib/redgifs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = parseRedgifsId(request.nextUrl.searchParams.get("id") ?? "");
  if (!id) {
    return new Response("Invalid id.", { status: 400 });
  }

  try {
    const { upstream } = await fetchMedia(id, (gif) => gif.posterUrl);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const status = err instanceof RedgifsError ? err.status : 500;
    return new Response("Poster unavailable.", { status });
  }
}
