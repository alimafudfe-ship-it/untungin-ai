import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json(
      {
        ok: false,
        error: "Keyword wajib diisi"
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    keyword,
    generatedAt: new Date().toISOString(),
    totalProducts: 0,
    products: [],
    message:
      "Crawler worker belum tersedia di environment Vercel. Gunakan worker terpisah atau sumber data database."
  });
}