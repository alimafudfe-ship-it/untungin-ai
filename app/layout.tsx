import type React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Untungin.ai - Seller Operating System",
  description: "Profit, inventory, cashflow, reports, and AI insights for Indonesian marketplace sellers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
