import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // 1. Menangkap kode otorisasi sinkronisasi dari TikTok / Tokopedia
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    console.log("=== SINKRONISASI TOKO TIKTOK BERHASIL ===");
    console.log("Authorization Code Toko:", code);

    // TODO: Di sini nanti kita tambahkan fungsi untuk menyimpan token toko 
    // ke database Untungin agar data produk afiliasi Anda sinkron otomatis.

    // 2. Alihkan kembali user secara mulus ke halaman dashboard utama aplikasi
    // Pastikan URL tujuan dialihkan ke halaman dashboard lokal atau production Anda
    return NextResponse.redirect(new URL("/dashboard", req.url));
    
  } catch (error: any) {
    return NextResponse.redirect(new URL("/dashboard/integrasi-toko", req.url));
  }
}