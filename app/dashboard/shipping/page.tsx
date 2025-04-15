"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Order {
  id: string
  user_id: string
  status: string
  total_amount: number
  shipping_address: string | null
  tracking_number: string | null
  created_at: string
}

export default function ShippingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [status, setStatus] = useState("")

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

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order)
    setTrackingNumber(order.tracking_number || "")
    setStatus(order.status || "")
  }

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedOrder) return

    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status,
          tracking_number: trackingNumber || null,
        })
        .eq("id", selectedOrder.id)

      if (error) throw error

      alert("Sipariş başarıyla güncellendi.")
      fetchOrders()
    } catch (error) {
      console.error("Sipariş güncellenirken hata oluştu:", error)
      alert("Sipariş güncellenirken hata oluştu.")
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Kargo Takibi</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-4 font-semibold">Siparişler</h2>
            {loading ? (
              <div className="text-center">Yükleniyor...</div>
            ) : orders.length === 0 ? (
              <div className="text-center">Henüz sipariş bulunmuyor.</div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`cursor-pointer rounded-md p-3 hover:bg-gray-50 ${
                      selectedOrder?.id === order.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Sipariş #{order.id.substring(0, 8)}</div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
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
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("tr-TR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          {selectedOrder ? (
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h2 className="mb-4 font-semibold">Kargo Bilgileri</h2>
              <form onSubmit={handleUpdateOrder} className="space-y-4">
                <div>
                  <label htmlFor="tracking-number" className="mb-1 block text-sm font-medium">
                    Takip Numarası
                  </label>
                  <input
                    id="tracking-number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
                    placeholder="Kargo takip numarası"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="mb-1 block text-sm font-medium">
                    Durum
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
                    required
                  >
                    <option value="pending">Beklemede</option>
                    <option value="processing">İşleniyor</option>
                    <option value="shipped">Kargoya Verildi</option>
                    <option value="delivered">Teslim Edildi</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="address" className="mb-1 block text-sm font-medium">
                    Teslimat Adresi
                  </label>
                  <div className="rounded-md border border-gray-300 p-2 text-sm">
                    {selectedOrder.shipping_address || "Adres belirtilmemiş"}
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none"
                >
                  Güncelle
                </button>
              </form>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border bg-white p-8 shadow-sm">
              <div className="text-center">
                <h3 className="mb-1 text-lg font-medium">Kargo Detayları</h3>
                <p className="text-gray-500">Detayları görüntülemek için bir sipariş seçin.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
