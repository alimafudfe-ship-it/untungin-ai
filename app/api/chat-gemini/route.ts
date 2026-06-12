import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, productsCount, productsSummary } = await req.json();
    const GEMINI_API_KEY = "AQ.Ab8RN6KA9u9qLtxetAeGSTbsJa_adt8xpC97l3c0Y3d6tdmBrQ";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Anda adalah AI Business Advisor profesional untuk aplikasi SaaS Untungin.ai. Tugas Anda adalah membantu user menganalisis performa toko mereka.\n\nBerikut adalah data riil toko pengguna saat ini:\n- Jumlah Produk aktif: ${productsCount} SKU\n- Ringkasan Profitabilitas: ${productsSummary}\n\nJawablah pertanyaan user di bawah ini secara ringkas, solutif, menggunakan Bahasa Indonesia yang ramah, dan berikan saran bisnis yang tajam:\n"${message}"`
                }
              ]
            }
          ]
        })
      }
    );

    const json = await response.json();

    // 🔍 SISTEM PEMBACA TEXT SUPER KEBAL (Mencegah Error Struktur JSON Meleset)
    let aiText = "";
    if (json?.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiText = json.candidates[0].content.parts[0].text;
    } else if (json?.error?.message) {
      // Jika Google menolak/error, tangkap alasan aslinya di sini
      aiText = `🚨 Google API Error: ${json.error.message}`;
    } else {
      // Jika format JSON benar-benar aneh, cetak isi mentahnya agar bisa kita baca
      aiText = `⚠️ Gagal membaca format balasan AI. Detail respons: ${JSON.stringify(json)}`;
    }

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    console.error("Backend Gemini Error:", error);
    return NextResponse.json({ text: `Aduh, gagal memproses data di server backend: ${error?.message}` }, { status: 500 });
  }
}