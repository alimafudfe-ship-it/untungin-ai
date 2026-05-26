import nodemailer from "nodemailer";
import { optionalEnv } from "./env";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const host = optionalEnv("SMTP_HOST");
  const port = Number(optionalEnv("SMTP_PORT") || 587);
  const user = optionalEnv("SMTP_USER");
  const pass = optionalEnv("SMTP_PASS");
  const from = optionalEnv("SMTP_FROM") || user;
  if (!host || !user || !pass || !from) return { ok: false, reason: "SMTP env belum lengkap." };
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  const info = await transporter.sendMail({ from, to, subject, html });
  return { ok: true, id: info.messageId };
}
