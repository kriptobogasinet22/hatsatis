import { StatsCard } from "@/components/dashboard/stats-card"

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Toplam Kullanıcı" value="0" description="Aktif kullanıcı sayısı" trend="stable" />
        <StatsCard title="Toplam Sipariş" value="0" description="Tüm zamanlar" trend="up" />
        <StatsCard title="Toplam Gelir" value="₺0" description="Tüm zamanlar" trend="up" />
        <StatsCard title="Stok Durumu" value="0" description="Toplam ürün sayısı" trend="down" />
      </div>
    </div>
  )
}
