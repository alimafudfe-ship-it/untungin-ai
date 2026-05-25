export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} belum diset di Vercel Environment Variables.`);
  return value;
}

export function optionalEnv(name: string) {
  return process.env[name] || "";
}
