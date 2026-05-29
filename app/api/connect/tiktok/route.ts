import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    marketplace: "tiktok",
    message: "Connected to tiktok"
  })
}
