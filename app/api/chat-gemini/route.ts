import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, productsCount, productsSummary } = await req.json();

    // 🔑 Taruh kunci aman Anda di server backend, aman dari intipan browser!
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
    return NextResponse.json(json);
  } catch (error) {
    console.error("Backend Gemini Error:", error);
    return NextResponse.json({ error: "Gagal memproses data di server" }, { status: 500 });
  }
}