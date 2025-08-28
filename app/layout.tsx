// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { DualAuthProvider } from "@/lib/auth/dual-auth-provider";
import { Navbar } from "@/components/navbar";
import { MobileNav } from "@/components/mobile-nav";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/error-boundary";
import { CartSyncProvider } from "@/components/cart-sync-provider";

export const metadata: Metadata = {
  title: "NovaMart E-Commerce",
  description: "Secure e-commerce application with Asgardeo authentication",
  generator: "Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
  --font-serif: 'Playfair Display', serif;
}
        `}</style>
      </head>
      <body>
        <ErrorBoundary>
          <DualAuthProvider>
            <CartSyncProvider>
              <div className="flex md:hidden">
                <MobileNav />
              </div>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Toaster />
            </CartSyncProvider>
          </DualAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
