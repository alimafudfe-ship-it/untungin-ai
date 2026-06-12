import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, productsCount, productsSummary } = await req.json();
    
    // Kunci resmi milik Anda dari dashboard
    const GEMINI_API_KEY = "AQ.Ab8RN6KA9u9qLtxetAeGSTbsJa_adt8xpC97l3c0Y3d6tdmBrQ";
    
    // Nomor proyek Anda yang tertera di gambar pertama Anda (projects/760727677131)
    const PROJECT_NUMBER = "760727677131"; 

    // ✅ JALUR RESMI VERTEX AI GOOGLE CLOUD FOR ENTERPRISE CREDENTIALS
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_NUMBER}/locations/us-central1/publishers/google/models/gemini-1.5-flash:predict`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          instances: [
            {
              content: `Anda adalah AI Business Advisor profesional untuk aplikasi SaaS Untungin.ai. Tugas Anda adalah membantu user menganalisis performa toko mereka.\n\nBerikut adalah data riil toko pengguna saat ini:\n- Jumlah Produk aktif: ${productsCount} SKU\n- Ringkasan Profitabilitas: ${productsSummary}\n\nJawablah pertanyaan user di bawah ini secara ringkas, solutif, menggunakan Bahasa Indonesia yang ramah, dan berikan saran bisnis yang tajam:\n"${message}"`
            }
          ],
          parameters: {
            temperature: 1,
            maxOutputTokens: 8192,
            topP: 0.95
          }
        })
      }
    );

    const json = await response.json();

    // Pembaca teks khusus struktur Vertex AI
    let aiText = "";
    if (json?.predictions?.[0]?.content) {
      aiText = json.predictions[0].content;
    } else if (json?.error?.message) {
      aiText = `🚨 Google Cloud Error: ${json.error.message}`;
    } else {
      aiText = `⚠️ Respons Server Google Cloud: ${JSON.stringify(json)}`;
    }

    return NextResponse.json({ text: aiText });
  } catch (error: any) {
    console.error("Backend Vertex AI Error:", error);
    return NextResponse.json({ text: `Gagal memproses data di server backend: ${error?.message}` }, { status: 500 });
  }
}