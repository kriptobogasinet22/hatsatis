"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Admin kullanıcısını kontrol et
      const { data, error: err } = await supabase.from("admins").select().eq("email", email).single()

      if (err || !data) {
        setError("Geçersiz e-posta veya şifre")
        setLoading(false)
        return
      }

      // Şifre kontrolü (gerçek uygulamada bcrypt ile karşılaştırma yapılmalıdır)
      if (data.password_hash !== password) {
        setError("Geçersiz e-posta veya şifre")
        setLoading(false)
        return
      }

      // Başarılı giriş
      router.push("/dashboard")
    } catch (err) {
      console.error("Giriş hatası:", err)
      setError("Giriş yapılırken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Şapka Satış Sistemi</h1>
        <p className="text-gray-600">Yönetici Girişi</p>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
        >
          {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  )
}
