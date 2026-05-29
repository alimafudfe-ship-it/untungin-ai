import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    success: true,
    marketplace: "tokopedia",
    message: "Connected to tokopedia"
  })
}
