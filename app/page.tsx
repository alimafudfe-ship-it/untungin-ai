"use client";

import dynamicImport from "next/dynamic";

// 1. Paksa Next.js untuk tahu bahwa route ini bersifat dynamic
export const dynamic = "force-dynamic";

// 2. Load file dashboard asli murni di browser (Client-Side Only)
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
