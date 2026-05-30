"use client";

import dynamicImport from "next/dynamic";

// Mematikan SSR secara total untuk komponen dashboard utama
const DashboardPage = dynamicImport(
  () => import("./page").then((mod) => mod.DashboardComponent), 
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium animate-pulse">Memuat Dashboard Untungin...</p>
        </div>
      </div>
    ),
  }
);

export default DashboardPage;
