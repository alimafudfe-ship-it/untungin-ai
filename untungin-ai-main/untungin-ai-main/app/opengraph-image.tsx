import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg,#020617,#064e3b)",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <div style={{ fontSize: 34, color: "#86efac", fontWeight: 700 }}>
          Untungin.ai
        </div>

        <div style={{ fontSize: 78, fontWeight: 900, lineHeight: 1.05, marginTop: 24 }}>
          AI CFO untuk Seller Online
        </div>

        <div style={{ fontSize: 30, color: "#cbd5e1", marginTop: 28, maxWidth: 900 }}>
          Hitung profit real, deteksi margin bocor, dan ambil keputusan scale/stop berbasis data.
        </div>

        <div style={{ fontSize: 28, color: "#bbf7d0", marginTop: 42 }}>
          Mulai dari Rp29.000/bulan
        </div>
      </div>
    ),
    size
  );
}
