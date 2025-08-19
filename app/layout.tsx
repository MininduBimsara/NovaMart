import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { DualAuthProvider } from "@/lib/auth/dual-auth-provider"
import { Navbar } from "@/components/navbar"
import { MobileNav } from "@/components/mobile-nav"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"

export const metadata: Metadata = {
  title: "E-Commerce App",
  description: "Secure e-commerce application with demo authentication",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ErrorBoundary>
          <DualAuthProvider>
            <div className="flex md:hidden">
              <MobileNav />
            </div>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Toaster />
          </DualAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
