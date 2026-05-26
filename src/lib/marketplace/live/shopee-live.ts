
import axios from "axios";

export async function checkShopeeLive(cookie: string) {
  try {
    const res = await axios.get(
      "https://seller.shopee.co.id/api/v3/shop/get_shop_info",
      {
        headers: {
          cookie,
          "user-agent": "Mozilla/5.0",
        },
      }
    );

    return {
      live: true,
      data: res.data,
    };
  } catch (err: any) {
    return {
      live: false,
      error: err?.message || "connection failed",
    };
  }
}
