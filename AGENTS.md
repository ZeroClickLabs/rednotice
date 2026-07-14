<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# red-downloader

Single-purpose Next.js 16 (App Router, TypeScript) app: paste a RedGifs URL, download the MP4 in HD or SD. Deployed to Vercel. Zero runtime deps beyond `next`/`react` — native fetch, native streaming `Response`, plain CSS in `app/globals.css`.

## Critical constraint: RedGifs auth is IP + User-Agent bound

Temp tokens from `GET https://api.redgifs.com/v2/auth/temporary` are JWTs with `valid_addr` and `valid_agent` claims. Consequences that must hold in any change:

- **Same-invocation rule:** any route that fetches media must do the full token → metadata → media-fetch → stream pipeline inside one serverless invocation. Never obtain a media URL in one invocation (or return it to the client) and consume it in another — different Vercel instance means different egress IP.
- The client never sees upstream RedGifs URLs; it only hits our own `/api/*` routes.
- One shared `USER_AGENT` constant (`lib/redgifs.ts`) goes on **every** upstream request: token, metadata, media, poster.
- Media URLs were unsigned/open as of 2026-07, but the proxy is still required: cross-origin anchors can't force downloads (`Content-Disposition` must come from our origin), and RedGifs has gated media before.

## Architecture

- `lib/redgifs.ts` — all upstream logic: `parseRedgifsId` (pure, handles /watch, /ifr, v3./i. subdomains, direct media links, bare ids), module-scope token cache (~60 min TTL, safe per-instance since an instance's egress IP is stable), `getGif` (401 → force-refresh token, retry exactly once), `fetchMedia` (media 401/403 → full refresh + retry exactly once). Typed `RedgifsError` with `status` for route error mapping.
- `/api/info` — JSON metadata for the UI (`hasHd`/`hasSd` booleans, never raw URLs).
- `/api/download` — streams `upstream.body` straight through (no buffering; streaming bypasses Vercel's payload limit). `maxDuration = 300` (Hobby ceiling with fluid compute). Falls back HD↔SD server-side when the requested quality is absent; filename reflects actual quality. Plain-text error bodies — the route is reached by full-page navigation.
- `/api/poster` — thumbnail proxy (posters are potentially gated too); `Cache-Control: public, max-age=3600`.
- `app/page.tsx` — download buttons are **plain anchors** to `/api/download`, not fetch/blob (blob breaks on large files and iOS; anchors let mobile browsers use their native download manager).

## SEO

Google Search is the primary discovery channel; the page is structured for it.

- `app/page.tsx` is a **server component** holding all crawlable content (h1, how-to steps, features, FAQ, JSON-LD `WebApplication` + `FAQPage`). The interactive widget lives in `app/downloader.tsx` (`"use client"`). Keep SEO content in the server component — don't move it into client-only rendering.
- The `faqs` array in `page.tsx` feeds both the visible FAQ and the FAQPage JSON-LD; they must stay in sync (edit the array, never just one side).
- `lib/site.ts` resolves the absolute site URL: `NEXT_PUBLIC_SITE_URL` → `https://` + `VERCEL_PROJECT_PRODUCTION_URL` → localhost. Used by metadata (canonical/OG), `app/robots.ts`, `app/sitemap.ts`. Set `NEXT_PUBLIC_SITE_URL` in Vercel once a real domain exists.
- `/api/` is disallowed in robots.txt — crawlers must not hit the download proxy.
- `app/layout.tsx` sets `rating: adult` (SafeSearch self-label per Google guidance — deliberate, don't remove) and must never reacquire a `robots: noindex`.
- OG image is generated at build by `app/opengraph-image.tsx` (`next/og` ImageResponse, no deps).

## Gotchas

- `POST /v2/auth/temporary` returns 404 — GET only.
- Gif metadata often has no `title` field; fall back to `description`, then id.
- The absolute project path contains a space (`Shockmouse `) — quote paths in scripts.
- Retry policy is exactly-once everywhere (rate-limit courtesy); keep it that way.

## Verification

User runs `npm run dev` themselves (never start it for them). Then:
- `curl -s "localhost:3000/api/info?url=https://www.redgifs.com/watch/{id}"`
- `curl -sD - -o /dev/null "localhost:3000/api/download?id={id}&quality=sd"` → expect 200, `video/mp4`, `Content-Disposition`, `Content-Length`.
- Library can be tested without a server: import `lib/redgifs.ts` in a scratch `.mts` file and run with `npx tsx` against the live API.
- Localhost can't exercise the same-invocation IP constraint (one IP for everything) — only a Vercel preview deploy tests that for real.
