"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, TrendingUp, DollarSign, AlertCircle } from "lucide-react";

export default function MarketIntelligencePage() {
  const [keyword, setKeyword] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  
  // Contoh data tiruan (Mock Data) yang nanti akan diambil dari database scraper Anda
  const mockProducts = [
    { id: 1, name: "Sepatu Sneakers Pria Olahraga Running Import", price: 89000, monthlySales: 4200, revenue: 373800000, shop: "IndoShoes Official", location: "Jakarta Barat" },
    { id: 2, name: "Sepatu Slip On Wanita Canvas Klasik Anti Slip", price: 55000, monthlySales: 3100, revenue: 170500000, shop: "GrosirSepatu.id", location: "Bandung" },
    { id: 3, name: "Sepatu Boots Kulit Sapi Asli Kerja Lapangan", price: 249000, monthlySales: 1500, revenue: 373500000, shop: "FootwearMaster", location: "Surabaya" },
  ];

  // State untuk menampung hasil produk yang berhasil difilter
  const [filteredProducts, setFilteredProducts] = useState<typeof mockProducts>([]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Jika kotak pencarian kosong, reset tampilan
    if (!keyword.trim()) {
      setFilteredProducts([]);
      setHasSearched(false);
      return;
    }
  
    const lowerKeyword = keyword.toLowerCase();

    // Lakukan pencarian langsung ke mock data tanpa sensitif huruf besar/kecil
    const results = mockProducts.filter((product) =>
      product.name.toLowerCase().includes(lowerKeyword)
    );

    // Update hasilnya ke layar
    setFilteredProducts(results);
    setHasSearched(true);
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* 1. Header & Search Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Market Intelligence Search</h1>
        <p className="text-gray-500 text-sm mb-4">Pantau produk kompetitor terlaris dan analisis tren omzet pasar secara real-time.</p>
        
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ketik produk yang ingin dimata-matai... (contoh: sepatu jinjing, kemeja pria)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 transition"
            />
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 shadow-sm">
            Riset Pasar
          </button>
        </form>
      </div>

      {hasSearched ? (
        <>
          {/* 2. Market Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShoppingBag className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Total Terjual (30 Hari)</p>
                <h3 className="text-xl font-bold text-gray-800">
                  {filteredProducts.reduce((sum, p) => sum + p.monthlySales, 0).toLocaleString("id-ID")}+ pcs
                </h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Estimasi Putaran Uang</p>
                <h3 className="text-xl font-bold text-gray-800">
                  Rp {filteredProducts.reduce((sum, p) => sum + p.revenue, 0).toLocaleString("id-ID")}
                </h3>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Harga Paling Cepat Laku</p>
                <h3 className="text-xl font-bold text-gray-800">Rp 55.000 - Rp 90.000</h3>
              </div>
            </div>
          </div>

          {/* 3. Top Products Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800 text-lg">Produk Kompetitor Terlaris untuk "{keyword}"</h2>
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-semibold">Live Data</span>
            </div>
            <div className="overflow-x-auto">
              {filteredProducts.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-400 text-xs uppercase font-semibold border-b border-gray-100">
                      <th className="p-4">Nama Produk / Toko</th>
                      <th className="p-4">Harga</th>
                      <th className="p-4">Penjualan (Bulanan)</th>
                      <th className="p-4">Estimasi Omzet</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 max-w-md">
                          <p className="font-medium text-gray-800 truncate">{prod.name}</p>
                          <span className="text-xs text-gray-400 font-medium">{prod.shop} • {prod.location}</span>
                        </td>
                        <td className="p-4 font-medium text-gray-800">Rp {prod.price.toLocaleString("id-ID")}</td>
                        <td className="p-4 text-gray-600 font-medium">{prod.monthlySales.toLocaleString("id-ID")} pcs</td>
                        <td className="p-4 text-green-600 font-semibold">Rp {prod.revenue.toLocaleString("id-ID")}</td>
                        <td className="p-4 text-center">
                          <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition">
                            Lihat Tren Grafik
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  Tidak ada produk dengan kata kunci "{keyword}" yang ditemukan.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Tampilan Awal sebelum User mencari sesuatu */
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700">Belum Ada Data yang Ditampilkan</h3>
          <p className="text-sm max-w-md text-gray-400">Silakan masukkan kata kunci produk di atas untuk mulai menarik data intelijen pasar dari marketplace lokal Indonesia.</p>
        </div>
      )}
    </div>
  );
}