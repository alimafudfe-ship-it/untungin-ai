import { NextResponse } from "next/server";
import { buildBlibliLiveUrl } from "@/lib/integrations/marketplace-live";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id") || "demo-user";

    return NextResponse.redirect(buildBlibliLiveUrl(userId));
  } catch (error) {
    return NextResponse.json(
      {
        provider: "blibli",
        status: "configuration_error",
        message: error instanceof Error ? error.message : "Koneksi Blibli gagal.",
        requiredEnv: ["BLIBLI_CLIENT_ID", "BLIBLI_CLIENT_SECRET", "BLIBLI_REDIRECT_URL"],
      },
      { status: 400 }
    );
  }
}
