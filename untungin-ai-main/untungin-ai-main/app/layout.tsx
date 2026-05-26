import type React from "react";
import type { Metadata } from "next";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://untungin.ai";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Untungin.ai - Seller Operating System",
  description: "Profit, inventory, cashflow, reports, and AI insights for Indonesian marketplace sellers.",
  openGraph: {
    title: "Untungin.ai - Seller Operating System",
    description: "Profit, inventory, cashflow, reports, and AI insights for Indonesian marketplace sellers.",
    url: appUrl,
    siteName: "Untungin.ai",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
