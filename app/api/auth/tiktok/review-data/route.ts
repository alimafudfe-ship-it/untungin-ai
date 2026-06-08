import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { seedTikTokReviewData } from "@/lib/integrations/tiktokReviewData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(value: string | null | undefined): value is string {
  return !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getDb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum lengkap.");
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = isUuid(body?.user_id) ? body.user_id : null;
    const workspaceId = isUuid(body?.workspace_id) ? body.workspace_id : isUuid(process.env.DEFAULT_WORKSPACE_ID) ? process.env.DEFAULT_WORKSPACE_ID : null;
    const storeId = isUuid(body?.store_id) ? body.store_id : null;
    const shopId = typeof body?.shop_id === "string" ? body.shop_id : null;

    if (!userId && !workspaceId) {
      return NextResponse.json({ ok: false, message: "Kirim user_id atau workspace_id agar data review bisa disimpan." }, { status: 400 });
    }

    const result = await seedTikTokReviewData({ db: getDb(), userId, workspaceId, storeId, shopId, source: "manual_go_live_review_seed" });
    return NextResponse.json({
      ok: result.ok,
      message: result.ok ? "TikTok Shop review data berhasil dibuat." : "Belum ada data yang tersimpan. Cek error detail.",
      requirement: {
        order_ids: "TikTok order id diawali 57 dan 58",
        product_ids: "TikTok product id diawali 17",
      },
      ...result,
    }, { status: result.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Gagal membuat TikTok review data." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = isUuid(url.searchParams.get("user_id")) ? url.searchParams.get("user_id") : null;
    const workspaceId = isUuid(url.searchParams.get("workspace_id")) ? url.searchParams.get("workspace_id") : null;
    const db = getDb();

    let productQuery = db.from("products").select("id,marketplace,external_product_id,sku,name,quantity_sold,stock_remaining,profit,margin,created_at").eq("marketplace", "tiktok").limit(20);
    if (userId) productQuery = productQuery.eq("user_id", userId);
    if (workspaceId) productQuery = productQuery.eq("workspace_id", workspaceId);
    const { data: products, error: productError } = await productQuery;

    let orders: any[] | null = [];
    let orderError: any = null;
    if (workspaceId) {
      const response = await db.from("orders").select("id,marketplace,external_order_id,status,gross_revenue,net_revenue,created_at,raw").eq("workspace_id", workspaceId).eq("marketplace", "tiktok").limit(20);
      orders = response.data;
      orderError = response.error;
    }

    return NextResponse.json({
      ok: !productError && !orderError,
      products: products || [],
      orders: orders || [],
      checks: {
        hasProductIdStarting17: (products || []).some((item: any) => String(item.external_product_id || "").startsWith("17")),
        hasOrderIdStarting57Or58: (orders || []).some((item: any) => /^5[78]/.test(String(item.external_order_id || ""))),
      },
      errors: [productError?.message, orderError?.message].filter(Boolean),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Gagal membaca TikTok review data." }, { status: 500 });
  }
}
