// Absolute site URL for canonical/OG/sitemap/JSON-LD.
// NEXT_PUBLIC_SITE_URL is the explicit override (full URL, no trailing slash).
// VERCEL_PROJECT_PRODUCTION_URL is the production domain without protocol —
// deliberately not VERCEL_URL, which is per-deployment and would make preview
// deploys canonical.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");
