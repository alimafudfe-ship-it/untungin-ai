type AnalyzePayload = {
  productName?: string;
  costPrice?: string | number;
  sellingPrice?: string | number;
  quantitySold?: string | number;
  otherCost?: string | number;
};

function parseNumber(value: unknown) {
  const parsed = Number(
    String(value ?? "0")
      .replace(/Rp/gi, "")
      .replace(/\./g, "")
      .replace(/,/g, "")
      .trim()
  );

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function formatRupiah(value: number) {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as AnalyzePayload;

    const productName = data.productName?.trim() || "Produk ini";
    const costPrice = parseNumber(data.costPrice);
    const sellingPrice = parseNumber(data.sellingPrice);
    const quantitySold = parseNumber(data.quantitySold);
    const otherCost = parseNumber(data.otherCost);

    if (sellingPrice <= 0 || quantitySold <= 0) {
      return Response.json(
        { error: "Harga jual dan jumlah terjual wajib lebih dari 0." },
        { status: 400 }
      );
    }

    const grossProfitPerUnit = sellingPrice - costPrice;
    const revenue = sellingPrice * quantitySold;
    const modal = costPrice * quantitySold;
    const profit = grossProfitPerUnit * quantitySold - otherCost;
    const margin = sellingPrice > 0 ? (grossProfitPerUnit / sellingPrice) * 100 : 0;
    const netMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const breakEvenPrice = costPrice + otherCost / quantitySold;
    const safePrice = Math.ceil((costPrice + otherCost / quantitySold) / 0.75);
    const priceIncrease1000Profit = profit + 1000 * quantitySold;

    const health =
      profit <= 0
        ? "MERAH - rugi atau belum sehat"
        : margin < 20 || netMargin < 10
        ? "KUNING - untung tipis"
        : "HIJAU - cukup sehat";

    const mainProblem =
      profit <= 0
        ? "Profit masih nol/minus. Harga jual, modal, atau biaya lain perlu segera dicek."
        : margin < 20
        ? "Margin kotor masih di bawah 20%, jadi diskon kecil atau biaya admin bisa menghapus keuntungan."
        : otherCost > grossProfitPerUnit * quantitySold * 0.25
        ? "Biaya lain cukup besar dibanding profit kotor. Ada potensi kebocoran biaya."
        : "Struktur profit sudah cukup aman, tinggal optimasi harga dan scale produk terbaik.";

    const recommendation =
      profit <= 0
        ? [
            `Naikkan harga minimal mendekati ${formatRupiah(safePrice)} agar margin lebih aman.`,
            "Cek ulang biaya admin, iklan, voucher, packing, dan operasional.",
            "Jangan scale iklan dulu sampai profit per order positif.",
          ]
        : margin < 20
        ? [
            `Pertimbangkan harga jual aman sekitar ${formatRupiah(safePrice)}.`,
            "Kurangi promo besar karena margin masih tipis.",
            "Cari supplier atau paket bundling untuk menurunkan modal per unit.",
          ]
        : [
            "Produk ini bisa dipertahankan dan diuji untuk scale pelan-pelan.",
            "Pantau biaya iklan/admin agar net margin tetap sehat.",
            "Buat bundling atau upsell supaya omzet per transaksi naik.",
          ];

    return Response.json({
      profit,
      margin,
      netMargin,
      revenue,
      result: `[RINGKASAN]\n${productName}: ${health}\n\n[ANGKA UTAMA]\nOmzet: ${formatRupiah(revenue)}\nModal total: ${formatRupiah(modal)}\nBiaya lain: ${formatRupiah(otherCost)}\nProfit bersih: ${formatRupiah(profit)}\nMargin kotor: ${margin.toFixed(1)}%\nNet margin: ${netMargin.toFixed(1)}%\n\n[MASALAH UTAMA]\n${mainProblem}\n\n[HARGA AMAN]\nBreak-even sekitar ${formatRupiah(breakEvenPrice)} per produk.\nHarga lebih aman disarankan sekitar ${formatRupiah(safePrice)} jika pasar masih menerima.\n\n[REKOMENDASI]\n1. ${recommendation[0]}\n2. ${recommendation[1]}\n3. ${recommendation[2]}\n\n[SIMULASI]\nKalau harga naik Rp1.000 dan penjualan tetap ${quantitySold}, profit menjadi sekitar ${formatRupiah(priceIncrease1000Profit)}.\n\n[KEPUTUSAN]\n${profit <= 0 ? "Stop scale dulu. Benahi harga/modal/biaya sampai profit positif." : margin < 20 ? "Masih boleh jalan, tapi jangan agresif promo sebelum margin lebih aman." : "Layak dipertahankan dan diuji scale bertahap."}`,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Gagal menganalisa produk." }, { status: 500 });
  }
}
