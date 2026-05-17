import { getStoredLocale, localeTag, normalizeLocale, type Locale } from "@/lib/dashboard/i18n";

function getCurrencyCode(locale: Locale) {
  if (locale === "en") return "USD";
  if (locale === "ms") return "MYR";
  return "IDR";
}

function resolveLocale(locale?: Locale): Locale {
  if (locale) return normalizeLocale(locale);
  if (typeof document !== "undefined") {
    const lang = document.documentElement.lang;
    if (lang.startsWith("en")) return "en";
    if (lang.startsWith("ms")) return "ms";
    if (lang.startsWith("id")) return "id";
  }
  return getStoredLocale();
}

export function money(value: number, locale?: Locale) {
  const activeLocale = resolveLocale(locale);
  return new Intl.NumberFormat(localeTag(activeLocale), {
    style: "currency",
    currency: getCurrencyCode(activeLocale),
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

export function compactMoney(value: number, locale?: Locale) {
  const activeLocale = resolveLocale(locale);
  return new Intl.NumberFormat(localeTag(activeLocale), {
    style: "currency",
    currency: getCurrencyCode(activeLocale),
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export function percent(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

export function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  let cleaned = String(value)
    .replace(/Rp/gi, "")
    .replace(/idr/gi, "")
    .replace(/rm/gi, "")
    .replace(/myr/gi, "")
    .replace(/usd/gi, "")
    .replace(/\$/g, "")
    .replace(/[^0-9,.-]/g, "")
    .trim();
  if (!cleaned || cleaned === "-" || cleaned === "," || cleaned === ".") return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    cleaned = lastComma > lastDot ? cleaned.replace(/\./g, "").replace(/,/g, ".") : cleaned.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const fraction = cleaned.slice(lastComma + 1);
    cleaned = fraction.length === 3 ? cleaned.replace(/,/g, "") : cleaned.replace(/,/g, ".");
  } else if (lastDot >= 0) {
    const fraction = cleaned.slice(lastDot + 1);
    cleaned = fraction.length === 3 ? cleaned.replace(/\./g, "") : cleaned;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getErrorMessage(error: unknown) {
  if (!error) return "Terjadi error.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try { return JSON.stringify(error, null, 2); } catch { return "Terjadi error tidak dikenal."; }
}
