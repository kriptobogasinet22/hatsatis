import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Toaster } from "sonner" // Sonner'dan Toaster'ı import ediyoruz

export const metadata: Metadata = {
  title: "Şapka Satış Sistemi",
  description: "Şapka satış ve yönetim sistemi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>
        {children}
        <Toaster /> {/* Toaster bileşenini ekliyoruz */}
      </body>
    </html>
  )
}
