import { optionalEnv } from "./env";

export async function sendWhatsAppMessage(to: string, message: string) {
  const provider = optionalEnv("WHATSAPP_PROVIDER") || "fonnte";
  if (provider === "fonnte") {
    const token = optionalEnv("FONNTE_TOKEN");
    if (!token) return { ok: false, provider, reason: "FONNTE_TOKEN belum diset." };
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token },
      body: new URLSearchParams({ target: to, message }),
    });
    return { ok: res.ok, provider, status: res.status, body: await res.text() };
  }
  if (provider === "cloud") {
    const token = optionalEnv("WHATSAPP_CLOUD_TOKEN");
    const phoneNumberId = optionalEnv("WHATSAPP_CLOUD_PHONE_NUMBER_ID");
    if (!token || !phoneNumberId) return { ok: false, provider, reason: "WHATSAPP_CLOUD_TOKEN/PHONE_NUMBER_ID belum diset." };
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
    });
    return { ok: res.ok, provider, status: res.status, body: await res.text() };
  }
  return { ok: false, provider, reason: "Provider WhatsApp tidak dikenal." };
}
