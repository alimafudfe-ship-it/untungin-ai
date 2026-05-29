
export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "untungin-ai",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
}
