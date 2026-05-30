"use client";

import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

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

<<<<<<< HEAD
export default DashboardPage;
=======
export default DashboardPage;
>>>>>>> a8e71864d9e65f928c6ff93cae82f5f5773ddfb0
