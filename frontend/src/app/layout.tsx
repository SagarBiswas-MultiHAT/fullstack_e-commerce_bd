import type { Metadata } from "next";
import { DM_Sans, Sora } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AppProviders } from "@/context/providers";
import "./globals.css";

export { reportWebVitals } from './web-vitals';

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
            <div className="pointer-events-none fixed inset-0 -z-10 app-backdrop" />
            <SiteHeader />
            <main className="mx-auto w-[95%] flex-1 px-4 py-8 lg:px-6">{children}</main>
            <SiteFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}