"use client";

import React, { useState } from "react";
import { Search, ShoppingBag, TrendingUp, DollarSign, AlertCircle, Loader2 } from "lucide-react";

export default function MarketIntelligencePage() {
  const [keyword, setKeyword] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Interface disesuaikan 100% dengan objek kembalian backend Anda
  interface Product {
    id: string | number;
    productName: string; // Sesuai backend
    priceMin: number;    // Sesuai backend
    sold30d: number;     // Sesuai backend
    revenue30d: number;  // Sesuai backend
    shopName: string;    // Sesuai backend
    location: string;    // Sesuai backend
    marketplace: string;
  }

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const searchInput = formData.get("searchQuery")?.toString() || "";
    
    if (!searchInput.trim()) {
      setFilteredProducts([]);
      setHasSearched(false);
      return;
    }
  
    setKeyword(searchInput);
    setHasSearched(true);
    setIsLoading(true);
    setErrorMsg(null);
    setFilteredProducts([]); 

    try {
      // 1. DISINKRONKAN: Gunakan POST sesuai dengan metode backend Anda
      const response = await fetch(`/api/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: searchInput }),
      });
      
      const data = await response.json();

      if (data.ok && data.products) {
        setFilteredProducts(data.products);
      } else {
        setErrorMsg(data.error || "Gagal mendapatkan data produk.");
      }
    } catch (error) {
      console.error("Gagal mengambil data real-time:", error);
      setErrorMsg("Terjadi gangguan koneksi ke server intelijen.");
    } finally {
      setIsLoading(false);
    }
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
              name="searchQuery"
              disabled={isLoading}
              placeholder="Ketik produk yang ingin dimata-matai... (contoh: sepatu jinjing, kemeja pria)"
              defaultValue={keyword}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 transition disabled:opacity-60"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 shadow-sm disabled:bg-blue-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Menganalisis...
              </>
            ) : (
              "Riset Pasar"
            )}
          </button>
        </form>
      </div>

      {hasSearched ? (
        isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-gray-600">Sedang menarik data langsung dari mesin intelijen marketplace...</p>
          </div>
        ) : errorMsg ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center text-orange-500 flex flex-col items-center justify-center space-y-2">
            <AlertCircle className="h-10 w-10" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        ) : (
          <>
            {/* 2. Market Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><ShoppingBag className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Total Terjual (30 Hari)</p>
                  <h3 className="text-xl font-bold text-gray-800">
                    {/* DISINKRONKAN: p.sold30d */}
                    {filteredProducts.reduce((sum, p) => sum + (p.sold30d || 0), 0).toLocaleString("id-ID")}+ pcs
                  </h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Estimasi Putaran Uang</p>
                  <h3 className="text-xl font-bold text-gray-800">
                    {/* DISINKRONKAN: p.revenue30d */}
                    Rp {filteredProducts.reduce((sum, p) => sum + (p.revenue30d || 0), 0).toLocaleString("id-ID")}
                  </h3>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-gray-400 font-medium">Rata-rata Harga Pasar</p>
                  <h3 className="text-xl font-bold text-gray-800">
                    {/* DISINKRONKAN: p.priceMin */}
                    Rp {filteredProducts.length > 0 
                      ? Math.floor(filteredProducts.reduce((sum, p) => sum + (p.priceMin || 0), 0) / filteredProducts.length).toLocaleString("id-ID")
                      : "0"
                    }
                  </h3>
                </div>
              </div>
            </div>

            {/* 3. Top Products Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-lg">Produk Kompetitor Terlaris untuk "{keyword}"</h2>
                <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-semibold">Live Shopee Scraper</span>
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
                        <th className="p-4 text-center">Platform</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 max-w-md">
                            {/* DISINKRONKAN: prod.productName */}
                            <p className="font-medium text-gray-800 truncate" title={prod.productName}>{prod.productName}</p>
                            {/* DISINKRONKAN: prod.shopName */}
                            <span className="text-xs text-gray-400 font-medium">{prod.shopName} • {prod.location}</span>
                          </td>
                          <td className="p-4 font-medium text-gray-800">
                            {/* DISINKRONKAN: prod.priceMin */}
                            Rp {prod.priceMin.toLocaleString("id-ID")}
                          </td>
                          <td className="p-4 text-gray-600 font-medium">
                            {/* DISINKRONKAN: prod.sold30d */}
                            {prod.sold30d.toLocaleString("id-ID")} pcs
                          </td>
                          <td className="p-4 text-green-600 font-semibold">
                            {/* DISINKRONKAN: prod.revenue30d */}
                            Rp {prod.revenue30d.toLocaleString("id-ID")}
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md font-medium">
                              {prod.marketplace}
                            </span>
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
        )
      ) : (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
          <AlertCircle className="h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700">Belum Ada Data yang Ditampilkan</h3>
          <p className="text-sm max-w-md text-gray-400">Silakan masukkan kata kunci produk di atas untuk mulai menarik data intelijen pasar dari marketplace lokal Indonesia.</p>
        </div>
      )}
    </div>
  );
}