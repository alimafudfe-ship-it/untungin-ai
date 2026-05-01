import { NextResponse } from "next/server";

function cleanPhone(value: string) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export async function POST(req: Request) {
  try {
    const { phone, code, plan, email } = await req.json();

    const to = cleanPhone(phone);
    if (!to || to.length < 10) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid." }, { status: 400 });
    }

    if (!code || String(code).length !== 6) {
      return NextResponse.json({ error: "Kode OTP tidak valid." }, { status: 400 });
    }

    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v21.0";
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "id";

    if (!token || !phoneNumberId) {
      return NextResponse.json(
        { error: "WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID belum diset." },
        { status: 500 }
      );
    }

    if (!templateName) {
      return NextResponse.json(
        { error: "WHATSAPP_OTP_TEMPLATE_NAME belum diset. Production wajib pakai template WhatsApp approved." },
        { status: 500 }
      );
    }

    const endpoint = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(code) },
              { type: "text", text: String(plan || "PRO") },
              { type: "text", text: String(email || "-") },
            ],
          },
        ],
      },
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("WA OTP ERROR:", data);
      return NextResponse.json(
        {
          error: data?.error?.message || "Gagal mengirim OTP WhatsApp.",
          detail: data,
        },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, mode: "whatsapp", data });
  } catch (error: any) {
    console.error("WA OTP ROUTE ERROR:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menjalankan WhatsApp OTP." },
      { status: 500 }
    );
  }
}
