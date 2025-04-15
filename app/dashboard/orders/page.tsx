"use client"

import { useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Order {
  id: string
  user_id: string
  status: string
  total_amount: number
  created_at: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setOrders(data || [])
    } catch (error) {
      console.error("Siparişler yüklenirken hata oluştu:", error)
      alert("Siparişler yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Siparişler</h1>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Sipariş ID</th>
                <th className="px-6 py-3 text-left">Kullanıcı ID</th>
                <th className="px-6 py-3 text-left">Tutar</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Henüz sipariş bulunmuyor.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{order.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4">{order.user_id.substring(0, 8)}...</td>
                    <td className="px-6 py-4">₺{order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status === "pending"
                          ? "Beklemede"
                          : order.status === "processing"
                            ? "İşleniyor"
                            : order.status === "shipped"
                              ? "Kargoda"
                              : order.status === "delivered"
                                ? "Teslim Edildi"
                                : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{new Date(order.created_at).toLocaleDateString("tr-TR")}</td>
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
