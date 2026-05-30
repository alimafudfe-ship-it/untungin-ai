"use client";

import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

// Memanggil DashboardClient yang berisi 789 baris kode utama Anda
const DashboardPage = dynamicImport(() => import("./DashboardClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-500">
      <div className="text-center">
        <p className="text-lg font-medium animate-pulse">Memuat Dashboard Untungin...</p>
      </div>
    </div>
  ),
});

export default DashboardPage;
