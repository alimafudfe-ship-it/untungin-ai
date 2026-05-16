export type PaymentProvider = "xendit" | "midtrans" | "manual";

export function getPaymentProvider(): PaymentProvider {
  const value = (process.env.PAYMENT_PROVIDER || process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || "xendit").toLowerCase();
  if (value === "midtrans" || value === "manual" || value === "xendit") return value;
  return "xendit";
}

export function getPlanAmount(plan: string) {
  if (plan === "monthly") return 49000;
  if (plan === "business") return 149000;
  return 299000;
}

export function getPlanName(plan: string) {
  if (plan === "monthly") return "Untungin.ai PRO Bulanan";
  if (plan === "business") return "Untungin.ai Business";
  return "Untungin.ai PRO Lifetime";
}
