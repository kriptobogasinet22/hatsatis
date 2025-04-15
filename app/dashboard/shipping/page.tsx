"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner" // Sonner'dan toast'u import ediyoruz
import { Truck, Package, Search, Eye, RefreshCw } from "lucide-react"

interface Order {
  id: string
  user_id: string
  status: string
  total_amount: number
  shipping_address: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
  user: {
    telegram_id: number
    username: string | null
    first_name: string | null
    last_name: string | null
  }
}

interface ShippingUpdate {
  id: string
  order_id: string
  status: string
  description: string | null
  created_at: string
}

export default function ShippingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [shippingUpdates, setShippingUpdates] = useState<ShippingUpdate[]>([])
  const [status, setStatus] = useState("")
  const [description, setDescription] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function fetchOrders() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          user:users(telegram_id, username, first_name, last_name)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setOrders(data || [])
    } catch (error) {
      console.error("Siparişler yüklenirken hata oluştu:", error)
      toast.error("Siparişler yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  async function fetchShippingUpdates(orderId: string) {
    try {
      const { data, error } = await supabase
        .from("shipping_updates")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setShippingUpdates(data || [])
    } catch (error) {
      console.error("Kargo güncellemeleri yüklenirken hata oluştu:", error)
      toast.error("Kargo güncellemeleri yüklenirken hata oluştu.")
    }
  }

  async function handleSelectOrder(order: Order) {
    setSelectedOrder(order)
    setTrackingNumber(order.tracking_number || "")
    await fetchShippingUpdates(order.id)
  }

  async function handleAddUpdate(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedOrder) return

    try {
      // Kargo güncellemesi ekle
      const { error: updateError } = await supabase.from("shipping_updates").insert([
        {
          order_id: selectedOrder.id,
          status,
          description,
        },
      ])

      if (updateError) throw updateError

      // Sipariş durumunu güncelle
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status,
          tracking_number: trackingNumber || null,
        })
        .eq("id", selectedOrder.id)

      if (orderError) throw orderError

      // Formu sıfırla
      setStatus("")
      setDescription("")

      // Güncellemeleri yeniden yükle
      await fetchShippingUpdates(selectedOrder.id)
      await fetchOrders()

      toast.success("Kargo güncellemesi başarıyla eklendi.")
    } catch (error) {
      console.error("Kargo güncellemesi eklenirken hata oluştu:", error)
      toast.error("Kargo güncellemesi eklenirken hata oluştu.")
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase()
    const orderIdMatch = order.id.toLowerCase().includes(searchLower)
    const trackingMatch = order.tracking_number?.toLowerCase().includes(searchLower) || false
    const userMatch =
      order.user?.username?.toLowerCase().includes(searchLower) ||
      order.user?.first_name?.toLowerCase().includes(searchLower) ||
      order.user?.last_name?.toLowerCase().includes(searchLower) ||
      false

    return orderIdMatch || trackingMatch || userMatch
  })

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Kargo Takibi</h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Sipariş ID, takip numarası veya kullanıcı adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => fetchOrders()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-4">
              <h2 className="font-semibold">Siparişler</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-2">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Yükleniyor...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">Sipariş bulunamadı.</div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`mb-2 cursor-pointer rounded-md p-3 transition-colors hover:bg-gray-50 ${
                      selectedOrder?.id === order.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {order.user?.username || order.user?.first_name || "Kullanıcı"}
                        </span>
                      </div>
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
                    {order.tracking_number && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <Truck className="h-3 w-3" />
                        <span>{order.tracking_number}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="border-b p-4">
                <h2 className="font-semibold">Kargo Bilgileri</h2>
              </div>
              <div className="p-4">
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="tracking-number">Takip Numarası</Label>
                    <Input
                      id="tracking-number"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Kargo takip numarası"
                    />
                  </div>
                  <div>
                    <Label>Teslimat Adresi</Label>
                    <div className="rounded-md border p-2 text-sm">
                      {selectedOrder.shipping_address || "Adres belirtilmemiş"}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAddUpdate} className="mb-6 space-y-4">
                  <div>
                    <Label htmlFor="status">Durum</Label>
                    <Select value={status} onValueChange={setStatus} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Beklemede</SelectItem>
                        <SelectItem value="processing">İşleniyor</SelectItem>
                        <SelectItem value="shipped">Kargoya Verildi</SelectItem>
                        <SelectItem value="in_transit">Taşınıyor</SelectItem>
                        <SelectItem value="out_for_delivery">Dağıtıma Çıktı</SelectItem>
                        <SelectItem value="delivered">Teslim Edildi</SelectItem>
                        <SelectItem value="failed_delivery">Teslimat Başarısız</SelectItem>
                        <SelectItem value="returned">İade Edildi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Kargo durumu hakkında açıklama"
                      rows={3}
                    />
                  </div>

                  <Button type="submit">Güncelleme Ekle</Button>
                </form>

                <div>
                  <h3 className="mb-2 font-medium">Kargo Güncellemeleri</h3>
                  {shippingUpdates.length === 0 ? (
                    <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                      Henüz kargo güncellemesi bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {shippingUpdates.map((update) => (
                        <div key={update.id} className="rounded-md border p-3">
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                update.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : update.status === "shipped"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {update.status === "pending"
                                ? "Beklemede"
                                : update.status === "processing"
                                  ? "İşleniyor"
                                  : update.status === "shipped"
                                    ? "Kargoya Verildi"
                                    : update.status === "in_transit"
                                      ? "Taşınıyor"
                                      : update.status === "out_for_delivery"
                                        ? "Dağıtıma Çıktı"
                                        : update.status === "delivered"
                                          ? "Teslim Edildi"
                                          : update.status === "failed_delivery"
                                            ? "Teslimat Başarısız"
                                            : update.status === "returned"
                                              ? "İade Edildi"
                                              : update.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(update.created_at).toLocaleString("tr-TR")}
                            </span>
                          </div>
                          {update.description && <p className="mt-2 text-sm">{update.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border bg-white p-8 shadow-sm">
              <div className="text-center">
                <Eye className="mx-auto mb-4 h-12 w-12 text-gray-300" />
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
