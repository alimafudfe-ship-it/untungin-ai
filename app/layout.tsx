import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://untungin.ai"),

  title: {
    default: "Untungin.ai - AI CFO untuk Seller",
    template: "%s | Untungin.ai",
  },

  description:
    "Profit OS untuk seller: hitung profit real, deteksi margin bocor, rekomendasi harga jual, dan action plan dari AI CFO.",

  applicationName: "Untungin.ai",

  keywords: [
    "Untungin.ai",
    "AI CFO",
    "profit seller",
    "hitung profit",
    "margin produk",
    "dashboard bisnis",
    "Shopee seller",
    "analisis profit",
    "pricing produk",
    "seller marketplace",
  ],

  authors: [{ name: "Untungin.ai" }],
  creator: "Untungin.ai",
  publisher: "Untungin.ai",

  alternates: {
    canonical: "https://untungin.ai",
  },

  category: "business",
  classification: "AI Finance SaaS",

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  themeColor: "#020617",

  openGraph: {
    title: "Untungin.ai - AI CFO untuk Seller",
    description:
      "Buka profit sebenarnya, deteksi produk bocor, dan ambil keputusan scale/stop dengan AI CFO.",

    url: "https://untungin.ai",
    siteName: "Untungin.ai",
    locale: "id_ID",
    type: "website",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Untungin.ai",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Untungin.ai - AI CFO untuk Seller",

    description:
      "Profit OS untuk seller: hitung profit real, deteksi margin bocor, dan rekomendasi harga jual.",

    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Untungin.ai",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI CFO untuk seller online: hitung profit real, deteksi margin bocor, rekomendasi harga jual, dan action plan bisnis.",
              url: "https://untungin.ai",
              offers: [
                {
                  "@type": "Offer",
                  name: "PRO Bulanan",
                  price: "29000",
                  priceCurrency: "IDR",
                },
                {
                  "@type": "Offer",
                  name: "PRO Lifetime",
                  price: "99000",
                  priceCurrency: "IDR",
                },
              ],
              publisher: {
                "@type": "Organization",
                name: "Untungin.ai",
                url: "https://untungin.ai",
              },
            }),
          }}
        />

        {children}
      </body>
    </html>
  );
}
