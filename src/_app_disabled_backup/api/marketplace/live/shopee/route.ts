
import { NextRequest, NextResponse } from "next/server";
import { checkShopeeLive } from "@/src/lib/marketplace/live/shopee-live";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const result = await checkShopeeLive(body.cookie || "");

  return NextResponse.json(result);
}
