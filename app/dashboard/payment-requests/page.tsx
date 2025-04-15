"use client"

import { useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Check, X } from "lucide-react"

interface PaymentRequest {
  id: string
  user_id: string
  amount: number
  payment_method: string
  payment_details: string
  status: string
  admin_notes: string | null
  created_at: string
  updated_at: string
  users?: {
    telegram_id: number
    username: string | null
    first_name: string | null
    last_name: string | null
  }
}

export default function PaymentRequestsPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [adminNote, setAdminNote] = useState("")
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const fetchPaymentRequests = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("payment_requests")
        .select(`
          *,
          users (telegram_id, username, first_name, last_name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setPaymentRequests(data || [])
    } catch (error) {
      console.error("Ödeme talepleri yüklenirken hata oluştu:", error)
      alert("Ödeme talepleri yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPaymentRequests()
  }, [fetchPaymentRequests])

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "approved",
          admin_notes: adminNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      // İlgili siparişi de güncelle
      const { data: paymentRequest } = await supabase
        .from("payment_requests")
        .select("payment_details")
        .eq("id", id)
        .single()

      if (paymentRequest && paymentRequest.payment_details) {
        // Ürün adından sipariş ID'sini çıkarmaya çalış
        const orderMatch = paymentRequest.payment_details.match(/Sipariş ID: ([a-f0-9-]+)/i)
        if (orderMatch && orderMatch[1]) {
          const orderId = orderMatch[1]
          await supabase
            .from("orders")
            .update({
              status: "processing",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
        }
      }

      alert("Ödeme talebi onaylandı.")
      setAdminNote("")
      setSelectedRequestId(null)
      fetchPaymentRequests()
    } catch (error) {
      console.error("Ödeme talebi onaylanırken hata oluştu:", error)
      alert("Ödeme talebi onaylanırken hata oluştu.")
    }
  }

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "rejected",
          admin_notes: adminNote || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      alert("Ödeme talebi reddedildi.")
      setAdminNote("")
      setSelectedRequestId(null)
      fetchPaymentRequests()
    } catch (error) {
      console.error("Ödeme talebi reddedilirken hata oluştu:", error)
      alert("Ödeme talebi reddedilirken hata oluştu.")
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "bank":
        return "Banka Havalesi"
      case "paypal":
        return "PayPal"
      case "crypto":
        return "Kripto Para"
      default:
        return method
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Ödeme Talepleri</h1>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Kullanıcı</th>
                <th className="px-6 py-3 text-left">Tutar</th>
                <th className="px-6 py-3 text-left">Ödeme Yöntemi</th>
                <th className="px-6 py-3 text-left">Detaylar</th>
                <th className="px-6 py-3 text-left">Durum</th>
                <th className="px-6 py-3 text-left">Tarih</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Yükleniyor...
                  </td>
                </tr>
              ) : paymentRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Henüz ödeme talebi bulunmuyor.
                  </td>
                </tr>
              ) : (
                paymentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {request.users ? (
                        <>
                          {request.users.first_name || request.users.username || "İsimsiz Kullanıcı"}
                          <br />
                          <span className="text-xs text-gray-500">ID: {request.users.telegram_id}</span>
                        </>
                      ) : (
                        `Kullanıcı: ${request.user_id.substring(0, 8)}...`
                      )}
                    </td>
                    <td className="px-6 py-4">₺{request.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">{getPaymentMethodText(request.payment_method)}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate">{request.payment_details}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          request.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : request.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status === "pending"
                          ? "Beklemede"
                          : request.status === "approved"
                            ? "Onaylandı"
                            : request.status === "rejected"
                              ? "Reddedildi"
                              : request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(request.created_at).toLocaleDateString("tr-TR")}</td>
                    <td className="px-6 py-4 text-right">
                      {request.status === "pending" && (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setSelectedRequestId(request.id)}
                            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                          >
                            İşlem
                          </button>
                        </div>
                      )}
                      {selectedRequestId === request.id && (
                        <div className="absolute right-10 mt-2 w-64 rounded-md border bg-white p-4 shadow-lg">
                          <h4 className="mb-2 font-medium">İşlem Yap</h4>
                          <div className="mb-3">
                            <label className="mb-1 block text-xs">Admin Notu:</label>
                            <textarea
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              className="w-full rounded border p-1 text-sm"
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-between">
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="flex items-center rounded bg-green-100 px-2 py-1 text-xs text-green-800"
                            >
                              <Check className="mr-1 h-3 w-3" /> Onayla
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="flex items-center rounded bg-red-100 px-2 py-1 text-xs text-red-800"
                            >
                              <X className="mr-1 h-3 w-3" /> Reddet
                            </button>
                            <button
                              onClick={() => setSelectedRequestId(null)}
                              className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      )}
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
