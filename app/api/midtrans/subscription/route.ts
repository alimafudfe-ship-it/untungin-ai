import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return NextResponse.json({ status: "env_missing", message: "MIDTRANS_SERVER_KEY belum diset." }, { status: 400 });
  return NextResponse.json({
    status: "ready_for_integration",
    message: "Endpoint subscription PRO siap. Sambungkan tokenisasi kartu/e-wallet dan webhook recurring sesuai dashboard Midtrans.",
    plan: body.plan || "monthly",
    email: body.email || null,
  });
}
