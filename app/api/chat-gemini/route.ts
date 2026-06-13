import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, productsCount, productsSummary } = await req.json();
    
    // 🔑 Kunci Groq murni milik Anda yang baru saja dibuat
    const GROQ_API_KEY = "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";

    // Request murni ke kecerdasan AI Llama-3-70b lewat server Groq yang super cepat
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Model papan atas yang sangat pintar menganalisis data bisnis
        messages: [
          {
            role: "system",
            content: `Anda adalah AI Business Advisor profesional untuk aplikasi SaaS Untungin.ai. Tugas Anda adalah membantu user menganalisis performa toko mereka sekaligus memberikan wawasan bisnis global secara luas.\n\nBerikut adalah data riil toko pengguna saat ini:\n- Jumlah Produk aktif: ${productsCount} SKU\n- Ringkasan Profitabilitas: ${productsSummary}\n\nJika user bertanya tentang data tokonya, jawab secara presisi berdasarkan data tersebut. Namun, jika user bertanya tentang wawasan bisnis umum, tren pasar, strategi marketing, atau industri kreatif eksternal, jawablah dengan pengetahuan global Anda secara cerdas, mengalir alami, ramah, dan berikan saran bisnis yang tajam.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7
      })
    });

    const json = await response.json();
    const aiText = json?.choices?.[0]?.message?.content;

    if (!aiText) {
      return NextResponse.json({ text: `🚨 Groq API Error: ${JSON.stringify(json)}` });
    }

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    return NextResponse.json({ text: `Aduh, terjadi kesalahan pada server AI: ${error?.message}` }, { status: 500 });
  }
}