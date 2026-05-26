import { NextResponse } from "next/server";
import { buildShopeeOAuthUrl } from "@/lib/integrations/marketplace";

export async function POST(req: Request) {
  try {
    const { userId = "demo-user" } = await req.json().catch(() => ({}));
    return NextResponse.json({ provider: "shopee", url: buildShopeeOAuthUrl(userId) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Gagal membuat Shopee OAuth URL" }, { status: 400 });
  }
}
