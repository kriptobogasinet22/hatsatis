"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, Users, CreditCard, Truck, Settings, LogOut, ShoppingCart } from 'lucide-react'

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Ürünler",
    href: "/dashboard/products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Siparişler",
    href: "/dashboard/orders",
    icon: <ShoppingCart className="h-5 w-5"  />,
  },
  {
    title: "Ödemeler",
    href: "/dashboard/payments",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: "Kargo Takibi",
    href: "/dashboard/shipping",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    title: "Kullanıcılar",
    href: "/dashboard/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Ayarlar",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Hat Satış</h2>
        <p className="text-sm text-muted-foreground">Yönetim Paneli</p>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {sidebarItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
              )}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Link
          href="/logout"
          className="flex w-full items-center gap-3 rounded-lg bg-primary px-3 py-2 text-primary-foreground"
        >
          <LogOut className="h-5 w-5" />
          Çıkış Yap
        </Link>
      </div>
    </div>
  )
}
