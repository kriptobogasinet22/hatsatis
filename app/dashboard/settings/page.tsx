"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function SettingsPage() {
  const [type, setType] = useState("")
  const [account, setAccount] = useState("")
  const [accountName, setAccountName] = useState("")
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from("payment_settings").insert([
        {
          type,
          account,
          account_name: accountName,
          active,
        },
      ])

      if (error) throw error

      alert("Ödeme ayarları başarıyla kaydedildi.")
      setType("")
      setAccount("")
      setAccountName("")
      setActive(true)
    } catch (error) {
      console.error("Ayarlar kaydedilirken hata oluştu:", error)
      alert("Ayarlar kaydedilirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Ayarlar</h1>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Ödeme Ayarları</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium">
              Ödeme Tipi
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
              required
            >
              <option value="">Seçiniz</option>
              <option value="bank">Banka Havalesi</option>
              <option value="paypal">PayPal</option>
              <option value="crypto">Kripto Para</option>
            </select>
          </div>

          <div>
            <label htmlFor="account" className="mb-1 block text-sm font-medium">
              Hesap Bilgisi
            </label>
            <input
              id="account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="accountName" className="mb-1 block text-sm font-medium">
              Hesap Adı
            </label>
            <input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="active" className="ml-2 block text-sm font-medium">
              Aktif
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>
    </div>
  )
}
