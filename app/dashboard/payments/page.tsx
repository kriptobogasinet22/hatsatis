"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Check, X, Eye, Plus, Pencil, Trash2 } from "lucide-react"

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
  users: {
    telegram_id: number
    username: string | null
    first_name: string | null
    last_name: string | null
  }
}

interface PaymentSetting {
  id: string
  type: string
  account: string
  account_name: string | null
  active: boolean
}

export default function PaymentsPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [settingForm, setSettingForm] = useState({
    id: "",
    type: "trx",
    account: "",
    account_name: "",
    active: true,
  })
  const [isEditSetting, setIsEditSetting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchPaymentRequests()
    fetchPaymentSettings()
  }, [])

  async function fetchPaymentRequests() {
    try {
      const { data, error } = await supabase
        .from("payment_requests")
        .select(`
          *,
          users (
            telegram_id,
            username,
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setPaymentRequests(data || [])
    } catch (error) {
      console.error("Ödeme talepleri yüklenirken hata:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchPaymentSettings() {
    try {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setPaymentSettings(data || [])
    } catch (error) {
      console.error("Ödeme ayarları yüklenirken hata:", error)
    }
  }

  function handleViewRequest(request: PaymentRequest) {
    setSelectedRequest(request)
    setAdminNotes(request.admin_notes || "")
    setIsViewDialogOpen(true)
  }

  async function handleApproveRequest() {
    if (!selectedRequest) return

    try {
      // Ödeme talebini onayla
      const { error: requestError } = await supabase
        .from("payment_requests")
        .update({
          status: "approved",
          admin_notes: adminNotes,
        })
        .eq("id", selectedRequest.id)

      if (requestError) throw requestError

      // Kullanıcı bakiyesini güncelle
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("balance")
        .eq("id", selectedRequest.user_id)
        .single()

      if (userError) throw userError

      const newBalance = Number(userData.balance) + Number(selectedRequest.amount)

      const { error: balanceError } = await supabase
        .from("users")
        .update({ balance: newBalance })
        .eq("id", selectedRequest.user_id)

      if (balanceError) throw balanceError

      // Ödeme taleplerini yenile
      await fetchPaymentRequests()
      setIsViewDialogOpen(false)
    } catch (error) {
      console.error("Ödeme talebi onaylanırken hata:", error)
    }
  }

  async function handleRejectRequest() {
    if (!selectedRequest) return

    try {
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
        })
        .eq("id", selectedRequest.id)

      if (error) throw error

      // Ödeme taleplerini yenile
      await fetchPaymentRequests()
      setIsViewDialogOpen(false)
    } catch (error) {
      console.error("Ödeme talebi reddedilirken hata:", error)
    }
  }

  function handleAddSetting() {
    setIsEditSetting(false)
    setSettingForm({
      id: "",
      type: "trx",
      account: "",
      account_name: "",
      active: true,
    })
    setIsSettingDialogOpen(true)
  }

  function handleEditSetting(setting: PaymentSetting) {
    setIsEditSetting(true)
    setSettingForm({
      id: setting.id,
      type: setting.type,
      account: setting.account,
      account_name: setting.account_name || "",
      active: setting.active,
    })
    setIsSettingDialogOpen(true)
  }

  async function handleSaveSetting() {
    try {
      if (isEditSetting) {
        // Güncelleme
        const { error } = await supabase
          .from("payment_settings")
          .update({
            type: settingForm.type,
            account: settingForm.account,
            account_name: settingForm.account_name || null,
            active: settingForm.active,
          })
          .eq("id", settingForm.id)

        if (error) throw error
      } else {
        // Yeni ekleme
        const { error } = await supabase.from("payment_settings").insert([
          {
            type: settingForm.type,
            account: settingForm.account,
            account_name: settingForm.account_name || null,
            active: settingForm.active,
          },
        ])

        if (error) throw error
      }

      // Ödeme ayarlarını yenile
      await fetchPaymentSettings()
      setIsSettingDialogOpen(false)
    } catch (error) {
      console.error("Ödeme ayarı kaydedilirken hata:", error)
    }
  }

  async function handleDeleteSetting(id: string) {
    try {
      const { error } = await supabase.from("payment_settings").delete().eq("id", id)

      if (error) throw error

      // Ödeme ayarlarını yenile
      await fetchPaymentSettings()
    } catch (error) {
      console.error("Ödeme ayarı silinirken hata:", error)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ödemeler</h1>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Ödeme Talepleri</TabsTrigger>
          <TabsTrigger value="settings">Ödeme Ayarları</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">Ödeme talepleri yükleniyor...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Ödeme Yöntemi</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRequests.length > 0 ? (
                    paymentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.users.first_name ||
                            request.users.username ||
                            `Kullanıcı #${request.users.telegram_id}`}
                        </TableCell>
                        <TableCell>₺{Number(request.amount).toFixed(2)}</TableCell>
                        <TableCell>{request.payment_method === "trx" ? "TRX (Tron)" : "Banka Havalesi"}</TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {request.status === "pending"
                              ? "Beklemede"
                              : request.status === "approved"
                                ? "Onaylandı"
                                : "Reddedildi"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="icon" onClick={() => handleViewRequest(request)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Henüz ödeme talebi bulunmuyor
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleAddSetting}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ödeme Yöntemi
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {paymentSettings.map((setting) => (
              <Card key={setting.id}>
                <CardHeader>
                  <CardTitle>
                    {setting.type === "trx" ? "TRX (Tron)" : "Banka Havalesi"}
                    {!setting.active && <span className="ml-2 text-sm text-muted-foreground">(Pasif)</span>}
                  </CardTitle>
                  <CardDescription>{setting.type === "trx" ? "Kripto Para Ödemesi" : "IBAN ile Ödeme"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">{setting.type === "trx" ? "TRX Adresi:" : "IBAN:"}</span>
                      <p className="text-sm break-all">{setting.account}</p>
                    </div>
                    {setting.account_name && (
                      <div>
                        <span className="font-medium">Hesap Sahibi:</span>
                        <p className="text-sm">{setting.account_name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditSetting(setting)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDeleteSetting(setting.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {paymentSettings.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">Henüz ödeme yöntemi bulunmuyor</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ödeme Talebi İnceleme Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ödeme Talebi</DialogTitle>
            <DialogDescription>Ödeme talebini inceleyip onaylayabilir veya reddedebilirsiniz.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Kullanıcı</Label>
                  <p>
                    {selectedRequest.users.first_name ||
                      selectedRequest.users.username ||
                      `Kullanıcı #${selectedRequest.users.telegram_id}`}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Tutar</Label>
                  <p>₺{Number(selectedRequest.amount).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Ödeme Yöntemi</Label>
                <p>{selectedRequest.payment_method === "trx" ? "TRX (Tron)" : "Banka Havalesi"}</p>
              </div>

              <div>
                <Label className="font-medium">Ödeme Detayları</Label>
                <p className="whitespace-pre-wrap">{selectedRequest.payment_details}</p>
              </div>

              <div>
                <Label className="font-medium">Tarih</Label>
                <p>{new Date(selectedRequest.created_at).toLocaleString("tr-TR")}</p>
              </div>

              <div>
                <Label htmlFor="admin-notes">Admin Notları</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ödeme ile ilgili notlar ekleyin"
                  disabled={selectedRequest.status !== "pending"}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedRequest?.status === "pending" ? (
              <>
                <Button variant="outline" onClick={() => handleRejectRequest()}>
                  <X className="mr-2 h-4 w-4" />
                  Reddet
                </Button>
                <Button onClick={() => handleApproveRequest()}>
                  <Check className="mr-2 h-4 w-4" />
                  Onayla
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsViewDialogOpen(false)}>Kapat</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ödeme Ayarları Dialog */}
      <Dialog open={isSettingDialogOpen} onOpenChange={setIsSettingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditSetting ? "Ödeme Yöntemini Düzenle" : "Yeni Ödeme Yöntemi"}</DialogTitle>
            <DialogDescription>
              {isEditSetting ? "Ödeme yöntemi bilgilerini güncelleyin." : "Yeni bir ödeme yöntemi ekleyin."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="payment-type">Ödeme Tipi</Label>
              <select
                id="payment-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={settingForm.type}
                onChange={(e) => setSettingForm({ ...settingForm, type: e.target.value })}
              >
                <option value="trx">TRX (Tron)</option>
                <option value="iban">Banka Havalesi (IBAN)</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account">{settingForm.type === "trx" ? "TRX Adresi" : "IBAN"}</Label>
              <Input
                id="account"
                value={settingForm.account}
                onChange={(e) => setSettingForm({ ...settingForm, account: e.target.value })}
                placeholder={settingForm.type === "trx" ? "TRX cüzdan adresi" : "TR..."}
              />
            </div>

            {settingForm.type === "iban" && (
              <div className="grid gap-2">
                <Label htmlFor="account-name">Hesap Sahibi</Label>
                <Input
                  id="account-name"
                  value={settingForm.account_name}
                  onChange={(e) => setSettingForm({ ...settingForm, account_name: e.target.value })}
                  placeholder="Hesap sahibinin adı soyadı"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={settingForm.active}
                onCheckedChange={(checked) => setSettingForm({ ...settingForm, active: checked })}
              />
              <Label htmlFor="active">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveSetting}>{isEditSetting ? "Güncelle" : "Ekle"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
