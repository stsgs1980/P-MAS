import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "P-MAS Dashboard — Multi-Agent System",
  description: "P-MAS Agent Hierarchy Dashboard — Prompt-based Multi-Agent System with 26 agents across 8 role groups.",
  keywords: ["P-MAS", "Multi-Agent System", "Agent Hierarchy", "Cognitive Formulas", "Dashboard", "Next.js"],
  authors: [{ name: "P-MAS Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "P-MAS Dashboard",
    description: "Prompt-based Multi-Agent System Dashboard",
    url: "https://chat.z.ai",
    siteName: "P-MAS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "P-MAS Dashboard",
    description: "Prompt-based Multi-Agent System Dashboard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
