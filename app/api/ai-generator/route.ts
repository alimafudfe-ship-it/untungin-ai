import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Pastikan NEXT_PUBLIC_GEMINI_API_KEY sudah terdaftar di Vercel/Env lokal Anda
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { productName, niche } = await req.json();

    if (!productName) {
      return NextResponse.json({ success: false, error: "Nama produk kosong" }, { status: 400 });
    }

    // Pembuatan Perintah Promosi Masif Khusus Penjualan Tiktok Shop
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

    // Jalankan permintaan pembuatan teks ke Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const generatedText = response.text || "Gagal menyusun naskah.";

    // URL Audio Dummy (Langkah berikutnya kita integrasikan ke TTS pilihan Anda)
    const mockAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

    return NextResponse.json({
      success: true,
      text: generatedText,
      audioUrl: mockAudioUrl // Nanti diganti dengan file mp3 asli hasil konversi
    });

  } catch (error: any) {
    console.error("Eror API Generator:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}