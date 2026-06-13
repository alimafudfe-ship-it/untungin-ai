import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productName, niche } = await req.json();

    if (!productName) {
      return NextResponse.json({ success: false, error: "Nama produk kosong" }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key tidak ditemukan di environment variable Vercel!" }, { status: 500 });
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

    // 🔥 BYPASS SDK: Langsung tembak endpoint REST API Gemini resmi menggunakan fetch standard
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // Jika Google merespons dengan eror di level HTTP
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: data?.error?.message || "Gagal berkomunikasi dengan Google API." 
      }, { status: response.status });
    }

    // Ambil hasil teks dari struktur JSON standard Google
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Gagal menyusun naskah.";
    const mockAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    return NextResponse.json({
      success: true,
      text: generatedText,
      audioUrl: mockAudioUrl
    });

  } catch (error: any) {
    console.error("Eror API Generator:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}