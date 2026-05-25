import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question, products, metrics } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY belum diset di environment." },
        { status: 500 }
      );
    }

    const compactProducts = (products || []).slice(0, 80).map((item: any) => ({
      name: item.name,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      quantitySold: item.quantitySold,
      otherCost: item.otherCost,
      profit: item.profit,
      margin: item.margin,
    }));

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah AI CFO untuk seller marketplace Indonesia. Jawab dalam Bahasa Indonesia, praktis, tajam, dan berbasis angka. Fokus pada profit, margin, biaya bocor, harga saran, produk untuk scale, produk untuk stop, dan action plan harian. Jangan berhalusinasi di luar data.",
          },
          {
            role: "user",
            content: JSON.stringify({ question, metrics, products: compactProducts }),
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || "AI CFO belum menghasilkan jawaban.";
    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal menjalankan AI CFO." }, { status: 500 });
  }
}
