import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Safe Walk - דירוג סיכון הליכה עם כלב | בטחון חיות מחמד",
  description: "חשב את רמת הסיכון של הליכה עם הכלב שלך בזמן אמת ומצא מקלט בחירום קרוב אליך. כלי בטחון חיות מחמד חיוני.",
  keywords: "כלב, ליכה בטוחה, מקלט, דירוג סיכון, Safe Walk, בטחון חיות מחמד, אפליקציית כלבים",
  authors: [{ name: "Safe Walk Team" }],
  creator: "Safe Walk",
  publisher: "Safe Walk",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://dan-safe-walk.vercel.app",
    siteName: "Safe Walk",
    title: "Safe Walk - דירוג סיכון הליכה עם כלב",
    description: "חשב את רמת הסיכון של הליכה עם הכלב שלך ומצא מקלט בחירום קרוב",
    images: [
      {
        url: "https://dan-safe-walk.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Safe Walk - דירוג סיכון הליכה עם כלב",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Safe Walk - דירוג סיכון הליכה עם כלב",
    description: "חשב את רמת הסיכון של הליכה עם הכלב שלך ומצא מקלט בחירום קרוב",
    images: ["https://dan-safe-walk.vercel.app/og-image.png"],
  },
  alternates: {
    canonical: "https://dan-safe-walk.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Safe Walk" />
        
        {/* JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Safe Walk",
              "description": "חשב את רמת הסיכון של הליכה עם הכלב שלך ומצא מקלט בחירום קרוב",
              "url": "https://dan-safe-walk.vercel.app",
              "applicationCategory": "Utilities",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "ILS"
              },
              "author": {
                "@type": "Organization",
                "name": "Safe Walk"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
