"use client"

import { useEffect, useState, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface User {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  balance: number
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setUsers(data || [])
    } catch (error) {
      console.error("Kullanıcılar yüklenirken hata oluştu:", error)
      alert("Kullanıcılar yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Kullanıcılar</h1>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Telegram ID</th>
                <th className="px-6 py-3 text-left">Kullanıcı Adı</th>
                <th className="px-6 py-3 text-left">Ad</th>
                <th className="px-6 py-3 text-left">Soyad</th>
                <th className="px-6 py-3 text-left">Bakiye</th>
                <th className="px-6 py-3 text-left">Kayıt Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Yükleniyor...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    Henüz kullanıcı bulunmuyor.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{user.telegram_id}</td>
                    <td className="px-6 py-4">{user.username || "-"}</td>
                    <td className="px-6 py-4">{user.first_name || "-"}</td>
                    <td className="px-6 py-4">{user.last_name || "-"}</td>
                    <td className="px-6 py-4">₺{user.balance.toFixed(2)}</td>
                    <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString("tr-TR")}</td>
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
