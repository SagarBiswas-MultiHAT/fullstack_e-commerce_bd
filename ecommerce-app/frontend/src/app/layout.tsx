import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AppProviders } from "@/context/providers";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BazaarFlow | Premium Commerce Experience",
  description: "A modern, conversion-optimized full-stack ecommerce storefront.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-fg">
        <AppProviders>
          <div className="relative min-h-screen">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,122,55,0.2),transparent_46%),radial-gradient(circle_at_85%_15%,rgba(255,215,128,0.2),transparent_45%),linear-gradient(120deg,#f7f3ee_0%,#fffaf4_60%,#f7efe5_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,145,77,0.16),transparent_40%),radial-gradient(circle_at_85%_15%,rgba(255,193,117,0.14),transparent_45%),linear-gradient(120deg,#111012_0%,#171418_55%,#1a1511_100%)]" />
            <SiteHeader />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-6">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
<body className="min-h-full bg-bg text-fg" suppressHydrationWarning></body>