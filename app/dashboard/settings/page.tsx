"use client"
import { toast } from "sonner"

// Kullanılmayan arayüzü yorum satırına alabilirsiniz
/* 
interface PaymentSetting {
  id: string
  type: string
  account: string
  account_name: string | null
  active: boolean
}
*/

export default function SettingsPage() {
  // Kullanılmayan state'leri kaldırın
  // const [paymentSettings, setPaymentSettings] = useState<PaymentSetting[]>([])
  // const [loading, setLoading] = useState(true)
  // const [type, setType] = useState("")
  // const [account, setAccount] = useState("")
  // const [accountName, setAccountName] = useState("")
  // const [active, setActive] = useState(true)
  // const [editingId, setEditingId] = useState<string | null>(null)

  // const supabase = createClientComponentClient()

  // Örnek bir fonksiyon
  const handleSave = async () => {
    try {
      // İşlem başarılı olduğunda
      toast.success("Ayarlar başarıyla kaydedildi")
    } catch (error) {
      // Hata durumunda
      toast.error("Bir hata oluştu")
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Ayarlar</h1>

      {/* Ayarlar formu ve içeriği burada olacak */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Ödeme Ayarları</h2>
        {/* Form içeriği */}
        <button onClick={handleSave} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Kaydet
        </button>
      </div>
    </div>
  )
}
