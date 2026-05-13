import { NextResponse } from "next/server";
import { buildTokopediaOAuthUrl } from "@/lib/integrations/marketplace";

export async function POST(req: Request) {
  try {
    const { userId = "demo-user" } = await req.json().catch(() => ({}));
    return NextResponse.json({ provider: "tokopedia", url: buildTokopediaOAuthUrl(userId) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Gagal membuat Tokopedia OAuth URL" }, { status: 400 });
  }
}
