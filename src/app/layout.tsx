import type { Metadata, Viewport } from "next";
import { LangProvider } from "@/lib/i18n";
import CustomCursor from "@/components/ui/CustomCursor";
import InteractiveGridBackground from "@/components/ui/InteractiveGridBackground";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fbf8fc",
};

export const metadata: Metadata = {
  title: {
    default: "ArqFlow — AI WhatsApp Customer Support",
    template: "%s | ArqFlow",
  },
  description:
    "ArqFlow builds intelligent AI WhatsApp agents that answer your customers, take orders, and book appointments — 24/7, in Arabic and English.",
  keywords: [
    "AI WhatsApp bot",
    "customer support automation",
    "WhatsApp business Egypt",
    "AI agent",
    "ArqFlow",
  ],
  openGraph: {
    title: "ArqFlow — AI WhatsApp Customer Support",
    description:
      "Your business never sleeps. AI agents that answer customers, take orders, and book appointments on WhatsApp — 24/7.",
    type: "website",
    locale: "ar_EG",
    alternateLocale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Manrope:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased relative min-h-screen">
        <InteractiveGridBackground />
        <CustomCursor />
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
