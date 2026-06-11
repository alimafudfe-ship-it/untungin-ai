import { NextResponse } from "next/server";

// Hapus baris edge runtime agar kembali menggunakan Node.js standar
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get("auth_code") || searchParams.get("code");
    const stateParams = searchParams.get("state") || "";

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Otorisasi dibatalkan atau auth_code tidak ditemukan." }, 
        { status: 400 }
      );
    }

    let workspaceId = null;
    try {
      const parsedState = JSON.parse(decodeURIComponent(stateParams));
      workspaceId = parsedState.workspaceId;
    } catch (e) {
      console.error("Gagal membaca data state parameter:", e);
    }

    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "6k9tqhh1i366s"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809";

    const tokenUrl = "https://open-api.tiktok-shops.com/api/v2/token/get"; 
    
    // Format form-urlencoded yang murni
    const searchValues = {
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorization_code"
    };

    console.log("Menukarkan token via Node.js standar...");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams(searchValues).toString()
    });

    const responseText = await tokenResponse.text();
    console.log("Response mentah dari TikTok:", responseText);

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`TikTok tidak mengembalikan JSON valid. Response mentah: ${responseText.substring(0, 200)}`);
    }

    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code}): ${JSON.stringify(tokenData)}`);
    }

    const sellerName = tokenData.data.seller_name || "Toko TikTok Resmi";
    console.log(`Sukses mengintegrasikan Toko: ${sellerName}`);

    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    return new NextResponse(
      `<html>
        <body style="font-family:sans-serif; padding:40px; line-height:1.6;">
          <h2 style="color:red;">🚨 Integrasi Tertahan (Gagal Tukar Token)</h2>
          <p><strong>Pesan Error:</strong> ${error.message}</p>
          <hr/>
          <p>Silakan kembalilah ke dashboard utama dan coba klik tombol integrasi sekali lagi.</p>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}