import { NextResponse } from "next/server";

export async function GET() {
  // Mengambil kunci API yang sudah kita daftarkan di Vercel
  const appKey = process.env.TIKTOK_APP_KEY;
  const appSecret = process.env.TIKTOK_APP_SECRET;

  if (!appKey || !appSecret) {
    return NextResponse.json(
      { error: "Kredensial API TikTok belum dikonfigurasi di server." },
      { status: 500 }
    );
  }

  try {
    // Di sini nanti tempat integrasi fetch ke API TikTok Shop / Tokopedia setelah Review selesai
    // Contoh endpoint dummy sebelum app review live:
    const mockData = {
      platform: "TikTok Shop",
      statusApp: "Under Review (Jam Kuning)",
      message: "Koneksi API siap. Menunggu approval token otorisasi seller."
    };

    return NextResponse.json({ success: true, data: mockData });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menarik data dari platform." },
      { status: 500 }
    );
  }
}