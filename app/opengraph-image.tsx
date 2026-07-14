import { ImageResponse } from "next/og";

export const alt = "RedGifs Downloader – save RedGifs videos as MP4";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0e",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            ▼
          </div>
          <div style={{ fontSize: 76, fontWeight: 700 }}>
            RedGifs Downloader
          </div>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 36,
            color: "#a1a1aa",
          }}
        >
          HD &amp; SD MP4 · Free · No account needed
        </div>
      </div>
    ),
    size,
  );
}
