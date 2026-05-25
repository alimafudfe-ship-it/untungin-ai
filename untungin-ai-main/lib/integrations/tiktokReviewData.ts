import { SupabaseClient } from "@supabase/supabase-js";

export type TikTokReviewSeedInput = {
  db: SupabaseClient<any, "public", any>;
  userId?: string | null;
  workspaceId?: string | null;
  storeId?: string | null;
  shopId?: string | null;
  source?: string;
};

export type TikTokReviewSeedResult = {
  ok: boolean;
  productExternalIds: string[];
  orderExternalIds: string[];
  inserted: {
    products: number;
    orders: number;
    orderItems: number;
    sales: number;
  };
  errors: string[];
};

const REVIEW_PRODUCTS = [
  {
    external_product_id: "1729384756100012345",
    sku: "TTK-REVIEW-17-001",
    name: "TikTok Shop Review Product 17 - Paket Sample Profit",
    cost_price: 45000,
    selling_price: 79000,
    quantity_sold: 2,
    stock_initial: 25,
    stock_remaining: 23,
    other_cost: 3500,
  },
  {
    external_product_id: "1729384756100012346",
    sku: "TTK-REVIEW-17-002",
    name: "TikTok Shop Review Product 17 - Bundle Seller Demo",
    cost_price: 60000,
    selling_price: 99000,
    quantity_sold: 1,
    stock_initial: 18,
    stock_remaining: 17,
    other_cost: 4500,
  },
];

const REVIEW_ORDERS = [
  {
    external_order_id: "5770012345678901234",
    buyer_name: "TikTok Review Buyer 57",
    productIndex: 0,
    quantity: 2,
    unit_price: 79000,
    marketplace_fee: 6500,
    ads_cost: 5000,
    voucher_cost: 4000,
  },
  {
    external_order_id: "5880012345678901234",
    buyer_name: "TikTok Review Buyer 58",
    productIndex: 1,
    quantity: 1,
    unit_price: 99000,
    marketplace_fee: 7500,
    ads_cost: 6000,
    voucher_cost: 5000,
  },
];

function calcProfit(product: typeof REVIEW_PRODUCTS[number]) {
  return product.selling_price * product.quantity_sold - product.cost_price * product.quantity_sold - product.other_cost;
}

function calcMargin(product: typeof REVIEW_PRODUCTS[number]) {
  const revenue = product.selling_price * product.quantity_sold;
  return revenue > 0 ? Number(((calcProfit(product) / revenue) * 100).toFixed(2)) : 0;
}

function errorMessage(error: any) {
  return error?.message || error?.details || JSON.stringify(error || {});
}

export async function seedTikTokReviewData({ db, userId, workspaceId, storeId, shopId, source = "tiktok_go_live_review" }: TikTokReviewSeedInput): Promise<TikTokReviewSeedResult> {
  const result: TikTokReviewSeedResult = {
    ok: false,
    productExternalIds: REVIEW_PRODUCTS.map((item) => item.external_product_id),
    orderExternalIds: REVIEW_ORDERS.map((item) => item.external_order_id),
    inserted: { products: 0, orders: 0, orderItems: 0, sales: 0 },
    errors: [],
  };

  const productIdByExternal = new Map<string, string>();

  for (const product of REVIEW_PRODUCTS) {
    const profit = calcProfit(product);
    const margin = calcMargin(product);
    const raw = {
      source,
      shop_id: shopId || null,
      tiktok_product_id: product.external_product_id,
      note: "Seed data untuk bukti TikTok Shop Go Live Review: product id diawali 17.",
    };

    const preferredPayload: Record<string, any> = {
      ...(userId ? { user_id: userId } : {}),
      ...(workspaceId ? { workspace_id: workspaceId } : {}),
      ...(storeId ? { store_id: storeId } : {}),
      marketplace: "tiktok",
      external_product_id: product.external_product_id,
      sku: product.sku,
      name: product.name,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      quantity_sold: product.quantity_sold,
      stock_initial: product.stock_initial,
      stock_remaining: product.stock_remaining,
      other_cost: product.other_cost,
      profit,
      margin,
      updated_at: new Date().toISOString(),
    };

    let selectedId: string | null = null;

    try {
      const { data: existing } = await db
        .from("products")
        .select("id")
        .eq("marketplace", "tiktok")
        .eq("external_product_id", product.external_product_id)
        .maybeSingle();
      selectedId = existing?.id || null;
    } catch {
      selectedId = null;
    }

    if (selectedId) {
      const { error } = await db.from("products").update(preferredPayload).eq("id", selectedId);
      if (error) result.errors.push(`products update ${product.external_product_id}: ${errorMessage(error)}`);
      productIdByExternal.set(product.external_product_id, selectedId);
      continue;
    }

    const insertAttempts = [
      preferredPayload,
      {
        ...(userId ? { user_id: userId } : {}),
        marketplace: "tiktok",
        sku: product.sku,
        name: `${product.name} (${product.external_product_id})`,
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        quantity_sold: product.quantity_sold,
        stock_initial: product.stock_initial,
        stock_remaining: product.stock_remaining,
        other_cost: product.other_cost,
        profit,
        margin,
      },
    ];

    for (const payload of insertAttempts) {
      const { data, error } = await db.from("products").insert(payload as any).select("id").single();
      if (!error && data?.id) {
        result.inserted.products += 1;
        productIdByExternal.set(product.external_product_id, data.id);
        break;
      }
      result.errors.push(`products insert ${product.external_product_id}: ${errorMessage(error)}`);
    }
  }

  if (workspaceId) {
    for (const order of REVIEW_ORDERS) {
      const product = REVIEW_PRODUCTS[order.productIndex];
      const grossRevenue = order.quantity * order.unit_price;
      const totalCost = order.quantity * product.cost_price;
      const totalFee = order.marketplace_fee + order.ads_cost + order.voucher_cost;
      const profit = grossRevenue - totalCost - totalFee;
      const raw = {
        source,
        shop_id: shopId || null,
        tiktok_order_id: order.external_order_id,
        tiktok_product_id: product.external_product_id,
        note: "Seed data untuk bukti TikTok Shop Go Live Review: order id diawali 57/58.",
      };

      let orderId: string | null = null;
      try {
        const { data: existing } = await db
          .from("orders")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("marketplace", "tiktok")
          .eq("external_order_id", order.external_order_id)
          .maybeSingle();
        orderId = existing?.id || null;
      } catch {
        orderId = null;
      }

      if (!orderId) {
        const { data, error } = await db
          .from("orders")
          .insert({
            workspace_id: workspaceId,
            ...(storeId ? { store_id: storeId } : {}),
            marketplace: "tiktok",
            external_order_id: order.external_order_id,
            order_date: new Date().toISOString(),
            status: "completed",
            buyer_name: order.buyer_name,
            gross_revenue: grossRevenue,
            marketplace_fee: order.marketplace_fee,
            ads_cost: order.ads_cost,
            voucher_cost: order.voucher_cost,
            net_revenue: grossRevenue - totalFee,
            source_file: source,
            raw,
          } as any)
          .select("id")
          .single();

        if (!error && data?.id) {
          result.inserted.orders += 1;
          orderId = data.id;
        } else {
          result.errors.push(`orders insert ${order.external_order_id}: ${errorMessage(error)}`);
        }
      }

      if (orderId) {
        const productId = productIdByExternal.get(product.external_product_id) || null;
        const { error } = await db.from("order_items").insert({
          order_id: orderId,
          ...(productId ? { product_id: productId } : {}),
          sku: product.sku,
          product_name: product.name,
          quantity: order.quantity,
          unit_price: order.unit_price,
          cost_price: product.cost_price,
          total_fee: totalFee,
          profit,
          raw,
        } as any);
        if (!error) result.inserted.orderItems += 1;
        else result.errors.push(`order_items insert ${order.external_order_id}: ${errorMessage(error)}`);
      }
    }
  }

  if (userId) {
    for (const order of REVIEW_ORDERS) {
      const product = REVIEW_PRODUCTS[order.productIndex];
      const grossRevenue = order.quantity * order.unit_price;
      const netProfit = grossRevenue - order.quantity * product.cost_price - order.marketplace_fee - order.ads_cost - order.voucher_cost;
      const productId = productIdByExternal.get(product.external_product_id) || null;
      const { error } = await db.from("sales").insert({
        user_id: userId,
        ...(productId ? { product_id: productId } : {}),
        marketplace: "tiktok",
        order_ref: order.external_order_id,
        qty: order.quantity,
        gross_revenue: grossRevenue,
        marketplace_fee: order.marketplace_fee,
        ads_cost: order.ads_cost,
        packing_cost: order.voucher_cost,
        net_profit: netProfit,
        sold_at: new Date().toISOString(),
      } as any);
      if (!error) result.inserted.sales += 1;
      else result.errors.push(`sales insert ${order.external_order_id}: ${errorMessage(error)}`);
    }
  }

  result.ok = result.inserted.products > 0 || result.inserted.orders > 0 || result.inserted.sales > 0;
  result.errors = result.errors.slice(-8);
  return result;
}
