export const runtime = "nodejs";
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    marketplace: "lazada",
    message: "Connected to lazada"
  })
}
