"use client"

import { useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface PaymentRequest {
  id: string
  user_id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
}

export default function PaymentsPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  const fetchPaymentRequests = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("payment_requests")
        .select("*")
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

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Ödemeler</h1>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Ödeme Talepleri</h2>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Kullanıcı ID</th>
                <th className="px-6 py-3 text-left">Tutar</th>
                <th className="px-6 py-3 text-left">Ödeme Yöntemi</th>
                <th className="px-6 py-3 text-left">Durum</th>
                <th className="px-6 py-3 text-left">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Yükleniyor...
                  </td>
                </tr>
              ) : paymentRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Henüz ödeme talebi bulunmuyor.
                  </td>
                </tr>
              ) : (
                paymentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{request.user_id.substring(0, 8)}...</td>
                    <td className="px-6 py-4">₺{request.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">{request.payment_method}</td>
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
