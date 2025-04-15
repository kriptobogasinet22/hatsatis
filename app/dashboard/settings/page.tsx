"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Trash2 } from "lucide-react"

interface PaymentSetting {
  id: string
  type: string
  account: string
  account_name: string | null
  active: boolean
  created_at: string
}

export default function SettingsPage() {
  const [type, setType] = useState("")
  const [account, setAccount] = useState("")
  const [accountName, setAccountName] = useState("")
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)

  const supabase = createClientComponentClient()

  const fetchPaymentSettings = useCallback(async () => {
    try {
      setFetchLoading(true)
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setPaymentSettings(data || [])
    } catch (error) {
      console.error("Ödeme ayarları yüklenirken hata oluştu:", error)
      alert("Ödeme ayarları yüklenirken hata oluştu.")
    } finally {
      setFetchLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPaymentSettings()
  }, [fetchPaymentSettings])

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
      fetchPaymentSettings() // Yeni eklenen ayarı görmek için listeyi yenile
    } catch (error) {
      console.error("Ayarlar kaydedilirken hata oluştu:", error)
      alert("Ayarlar kaydedilirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bu ödeme yöntemini silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const { error } = await supabase.from("payment_settings").delete().eq("id", id)

      if (error) throw error

      alert("Ödeme yöntemi başarıyla silindi.")
      fetchPaymentSettings() // Silinen ayarı listeden kaldırmak için listeyi yenile
    } catch (error) {
      console.error("Ödeme yöntemi silinirken hata oluştu:", error)
      alert("Ödeme yöntemi silinirken hata oluştu.")
    }
  }

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case "bank":
        return "Banka Havalesi"
      case "paypal":
        return "PayPal"
      case "crypto":
        return "Kripto Para"
      default:
        return type
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Ayarlar</h1>

      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Ödeme Yöntemi Ekle</h2>
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

      <div className="rounded-lg border bg-white shadow-sm">
        <h2 className="border-b p-4 text-lg font-semibold">Mevcut Ödeme Yöntemleri</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Ödeme Tipi</th>
                <th className="px-6 py-3 text-left">Hesap Bilgisi</th>
                <th className="px-6 py-3 text-left">Hesap Adı</th>
                <th className="px-6 py-3 text-left">Durum</th>
                <th className="px-6 py-3 text-left">Eklenme Tarihi</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fetchLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Yükleniyor...
                  </td>
                </tr>
              ) : paymentSettings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Henüz ödeme yöntemi bulunmuyor.
                  </td>
                </tr>
              ) : (
                paymentSettings.map((setting) => (
                  <tr key={setting.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{getPaymentTypeText(setting.type)}</td>
                    <td className="px-6 py-4">{setting.account}</td>
                    <td className="px-6 py-4">{setting.account_name || "-"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          setting.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {setting.active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(setting.created_at).toLocaleDateString("tr-TR")}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(setting.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
