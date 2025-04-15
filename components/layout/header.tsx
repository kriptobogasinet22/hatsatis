"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const [adminEmail, setAdminEmail] = useState("")

  useEffect(() => {
    // Admin bilgilerini localStorage'dan al
    const adminData = localStorage.getItem("admin")
    if (adminData) {
      const admin = JSON.parse(adminData)
      setAdminEmail(admin.email)
    }
  }, [])

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 justify-between">
        <div className="font-semibold">Hat Satış Yönetim Paneli</div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bildirimler</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Yeni ödeme talebi</DropdownMenuItem>
              <DropdownMenuItem>Yeni sipariş</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="text-sm font-medium">{adminEmail}</div>
        </div>
      </div>
    </header>
  )
}
