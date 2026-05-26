
export function parseCookie(rawCookie: string) {
  return rawCookie
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function validateCookie(rawCookie: string) {
  return rawCookie.includes("=") && rawCookie.length > 20;
}
