"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, Truck } from "lucide-react"

interface Order {
  id: string
  user_id: string
  status: string
  total_amount: number
  shipping_address: string | null
  tracking_number: string | null
  created_at: string
  updated_at: string
  users: {
    telegram_id: number
    username: string | null
    first_name: string | null
    last_name: string | null
  }
  order_items: Array<{
    id: string
    product_id: string
    quantity: number
    price: number
    products: {
      name: string
    }
  }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false)
  const [shippingData, setShippingData] = useState({
    status: "",
    tracking_number: "",
    shipping_address: "",
    shipping_update: "",
  })
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          users (
            telegram_id,
            username,
            first_name,
            last_name
          ),
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (
              name
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setOrders(data || [])
    } catch (error) {
      console.error("Siparişler yüklenirken hata:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleViewOrder(order: Order) {
    setSelectedOrder(order)
    setIsViewDialogOpen(true)
  }

  function handleShippingUpdate(order: Order) {
    setSelectedOrder(order)
    setShippingData({
      status: order.status,
      tracking_number: order.tracking_number || "",
      shipping_address: order.shipping_address || "",
      shipping_update: "",
    })
    setIsShippingDialogOpen(true)
  }

  async function updateShipping() {
    if (!selectedOrder) return

    try {
      // Sipariş güncelleme
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: shippingData.status,
          tracking_number: shippingData.tracking_number || null,
          shipping_address: shippingData.shipping_address || null,
        })
        .eq("id", selectedOrder.id)

      if (orderError) throw orderError

      // Kargo güncellemesi ekle
      if (shippingData.shipping_update) {
        const { error: updateError } = await supabase.from("shipping_updates").insert([
          {
            order_id: selectedOrder.id,
            status: shippingData.status,
            description: shippingData.shipping_update,
          },
        ])

        if (updateError) throw updateError
      }

      // Siparişleri yenile
      await fetchOrders()
      setIsShippingDialogOpen(false)
    } catch (error) {
      console.error("Kargo bilgileri güncellenirken hata:", error)
    }
  }

  function getStatusText(status: string): string {
    switch (status) {
      case "pending":
        return "Beklemede"
      case "processing":
        return "Hazırlanıyor"
      case "shipped":
        return "Kargoya Verildi"
      case "delivered":
        return "Teslim Edildi"
      case "completed":
        return "Tamamlandı"
      case "cancelled":
        return "İptal Edildi"
      case "refunded":
        return "İade Edildi"
      case "paid":
        return "Ödendi"
      default:
        return "Bilinmeyen Durum"
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-orange-100 text-orange-800"
      case "paid":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Siparişler</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64">Siparişler yükleniyor...</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      {order.users.first_name || order.users.username || `Kullanıcı #${order.users.telegram_id}`}
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell>₺{Number(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleViewOrder(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleShippingUpdate(order)}>
                          <Truck className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Henüz sipariş bulunmuyor
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sipariş Detay Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sipariş Detayı</DialogTitle>
            <DialogDescription>Sipariş #{selectedOrder?.id.substring(0, 8)}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Müşteri Bilgileri</h3>
                  <p>Telegram ID: {selectedOrder.users.telegram_id}</p>
                  <p>Kullanıcı Adı: {selectedOrder.users.username || "Belirtilmemiş"}</p>
                  <p>Ad: {selectedOrder.users.first_name || "Belirtilmemiş"}</p>
                  <p>Soyad: {selectedOrder.users.last_name || "Belirtilmemiş"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sipariş Bilgileri</h3>
                  <p>Tarih: {new Date(selectedOrder.created_at).toLocaleDateString("tr-TR")}</p>
                  <p>Durum: {getStatusText(selectedOrder.status)}</p>
                  <p>Toplam Tutar: ₺{Number(selectedOrder.total_amount).toFixed(2)}</p>
                  {selectedOrder.tracking_number && <p>Kargo Takip No: {selectedOrder.tracking_number}</p>}
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-semibold mb-2">Teslimat Adresi</h3>
                  <p>{selectedOrder.shipping_address}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Ürünler</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Adet</TableHead>
                      <TableHead>Birim Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.order_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.products.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₺{Number(item.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">₺{(Number(item.price) * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-semibold">
                        Toplam
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₺{Number(selectedOrder.total_amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kargo Güncelleme Dialog */}
      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kargo Bilgilerini Güncelle</DialogTitle>
            <DialogDescription>
              Sipariş #{selectedOrder?.id.substring(0, 8)} için kargo bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Sipariş Durumu</Label>
              <Select
                value={shippingData.status}
                onValueChange={(value) => setShippingData({ ...shippingData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="processing">Hazırlanıyor</SelectItem>
                  <SelectItem value="paid">Ödendi</SelectItem>
                  <SelectItem value="shipped">Kargoya Verildi</SelectItem>
                  <SelectItem value="delivered">Teslim Edildi</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  <SelectItem value="refunded">İade Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tracking">Kargo Takip Numarası</Label>
              <Input
                id="tracking"
                value={shippingData.tracking_number}
                onChange={(e) => setShippingData({ ...shippingData, tracking_number: e.target.value })}
                placeholder="Kargo takip numarası"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Teslimat Adresi</Label>
              <Textarea
                id="address"
                value={shippingData.shipping_address}
                onChange={(e) => setShippingData({ ...shippingData, shipping_address: e.target.value })}
                placeholder="Teslimat adresi"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="update">Kargo Güncellemesi</Label>
              <Textarea
                id="update"
                value={shippingData.shipping_update}
                onChange={(e) => setShippingData({ ...shippingData, shipping_update: e.target.value })}
                placeholder="Kargo durumu hakkında not ekleyin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={updateShipping}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
