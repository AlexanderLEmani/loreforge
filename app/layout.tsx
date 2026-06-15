import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollOnNavigate from "@/components/ScrollOnNavigate";
import MobileBottomNav from "@/components/MobileBottomNav";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { APP_NAME } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Математика как RPG",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider>
          <ScrollOnNavigate />
          <MobileBottomNav />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
