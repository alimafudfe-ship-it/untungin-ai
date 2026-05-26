import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/integrations/email";

export async function POST(req: Request) {
  const { organizationId, email, role = "staff" } = await req.json().catch(() => ({}));
  if (!organizationId || !email) return NextResponse.json({ error: "organizationId dan email wajib diisi" }, { status: 400 });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY belum diset" }, { status: 400 });
  const db = createClient(supabaseUrl, serviceKey);
  const { data, error } = await db.from("team_invitations").insert({ organization_id: organizationId, email, role, status: "pending" }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await sendEmail({ to: email, subject: "Undangan Team Untungin.ai", html: `<p>Kamu diundang sebagai ${role} di Untungin.ai.</p>` });
  return NextResponse.json({ ok: true, invitationId: data?.id });
}
