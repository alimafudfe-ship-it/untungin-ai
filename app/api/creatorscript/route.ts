import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productName, niche } = await req.json();

    // 🛠️ AMAN: Menggunakan Environment Variable murni Sisi Server (Tanpa NEXT_PUBLIC_)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key di server Vercel kosong!" }, { status: 500 });
    }

    const prompt = `
      Anda adalah seorang kreator konten TikTok dan spesialis Copywriter Afiliasi E-commerce papan atas di Indonesia.
      Buatkan naskah video komersial berdurasi 30-45 detik yang sangat persuasif untuk menjual produk ini: "${productName}".
      Gaya penyampaian video wajib menggunakan tipe: "${niche}".
      
      Format struktur output wajib memiliki pembagian yang jelas seperti ini:
      [HOOK - Detik 0-5] (Bagian pembuka yang bikin mata penonton stop scroll)
      [PROBLEM/STORY] (Masalah nyata atau cerita yang dialami sehari-hari)
      [SOLUTION & BENEFIT] (Keunggulan mutlak produk ini dibanding yang lain)
      [CALL TO ACTION] (Ajakan mendesak untuk klik keranjang kuning sekarang juga sebelum kehabisan diskon)

      Gunakan bahasa Indonesia kasual, gaul, interaktif, dan hindari kata-kata kaku. Tuliskan teks narasinya saja tanpa tambahan instruksi kamera.
    `;

// 1. URL Bersih tanpa parameter '?key=' di ujungnya
    const googleUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`;

    // 2. Kirim request dengan Header Autentikasi yang tepat
    const response = await fetch(googleUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        // 🔥 PERBAIKAN MUTLAK: Kunci berawalan 'AQ.' wajib dikirim via header X-Goog-Api-Key
        "X-Goog-Api-Key": apiKey 
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      }),
      cache: "no-store" 
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data?.error?.message || "Google menolak akses server." 
      }, { status: response.status });
    }

    const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal memuat teks.";

    return NextResponse.json({
      success: true,
      text: textOutput,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}