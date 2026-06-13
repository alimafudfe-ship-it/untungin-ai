import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Ambil token akses TikTok user dari database Supabase Anda
  const accessToken = "Tiktok_Access_Token_User_Dari_Supabase";
  
  try {
    // 2. Tembak API resmi Partner Center TikTok Shop
    const response = await fetch("https://open-api.tiktokglobalshop.com/api/v1/affiliate/orders", {
      method: "GET",
      headers: {
        "x-tts-access-token": accessToken,
        "Content-Type": "application/json"
      }
    });
    
    const data = await response.json();
    return NextResponse.json({ success: true, orders: data.orders_list });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal menarik data TikTok" });
  }
}