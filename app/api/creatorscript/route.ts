import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { productName, niche } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "API Key kosong!" }, { status: 500 });
    }

    // Menggunakan SDK Resmi Google Gen AI untuk membaca kunci AQ. secara sah
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `Anda adalah seorang kreator konten TikTok papan atas di Indonesia. Buatkan naskah video komersial persuasif berdurasi 30-45 detik untuk menjual produk ini: "${productName}". Gaya video wajib: "${niche}". Gunakan bahasa Indonesia kasual.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return NextResponse.json({
      success: true,
      text: response.text || "Gagal memuat teks.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}