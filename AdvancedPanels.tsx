import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/integrations/email";

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const to = process.env.DAILY_REPORT_TO;
  if (!to) return NextResponse.json({ ok: false, reason: "DAILY_REPORT_TO belum diset." }, { status: 400 });
  const result = await sendEmail({
    to,
    subject: "Untungin.ai Daily Business Report",
    html: `<h2>Daily report siap</h2><p>Buka dashboard Untungin.ai untuk melihat profit, cashflow, forecast, dan rekomendasi hari ini.</p>`,
  });
  return NextResponse.json(result);
}
