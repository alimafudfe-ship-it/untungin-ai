export function money(value: number) {
  const abs = Math.abs(Math.round(value || 0));
  const formatted = abs.toLocaleString("id-ID");
  return `${value < 0 ? "-" : ""}Rp${formatted}`;
}

export function compactMoney(value: number) {
  const abs = Math.abs(value || 0);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}Rp${(abs / 1_000_000_000).toFixed(1).replace(".0", "")}M`;
  if (abs >= 1_000_000) return `${sign}Rp${(abs / 1_000_000).toFixed(1).replace(".0", "")}jt`;
  if (abs >= 1_000) return `${sign}Rp${Math.round(abs / 1_000)}rb`;
  return `${sign}Rp${Math.round(abs)}`;
}

export function percent(value: number) {
  return `${(value || 0).toFixed(1)}%`;
}

export function parseNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  let cleaned = String(value)
    .replace(/Rp/gi, "")
    .replace(/idr/gi, "")
    .replace(/[^0-9,.-]/g, "")
    .trim();
  if (!cleaned || cleaned === "-" || cleaned === "," || cleaned === ".") return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    // 18.000,00 -> 18000.00, 18,000.00 -> 18000.00
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
