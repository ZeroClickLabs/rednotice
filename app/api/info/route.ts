import { NextRequest, NextResponse } from "next/server";
import { getGif, parseRedgifsId, RedgifsError } from "@/lib/redgifs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url") ?? "";
  const id = parseRedgifsId(url);
  if (!id) {
    return NextResponse.json(
      { error: "That doesn't look like a RedGifs link. Paste a URL like https://www.redgifs.com/watch/..." },
      { status: 400 },
    );
  }

  try {
    const gif = await getGif(id);
    return NextResponse.json(
      {
        id: gif.id,
        title: gif.title,
        duration: gif.duration,
        width: gif.width,
        height: gif.height,
        hasHd: Boolean(gif.hdUrl),
        hasSd: Boolean(gif.sdUrl),
        posterPath: gif.posterUrl ? `/api/poster?id=${encodeURIComponent(gif.id)}` : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof RedgifsError) {
      const message =
        err.status === 404
          ? "Video not found. Check the link and try again."
          : err.status === 410
            ? "This video has been removed."
            : "RedGifs is unreachable right now. Try again in a moment.";
      return NextResponse.json({ error: message }, { status: err.status });
    }
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
