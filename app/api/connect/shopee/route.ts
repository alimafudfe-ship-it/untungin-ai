export const runtime = "nodejs";
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    marketplace: "shopee",
    message: "Connected to shopee"
  })
}
