import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()

  console.log("lazada webhook:", body)

  return NextResponse.json({
    success: true
  })
}
