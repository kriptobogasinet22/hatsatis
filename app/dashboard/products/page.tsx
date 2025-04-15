"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [active, setActive] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const supabase = createClientComponentClient<Database>()

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setProducts(data || [])
    } catch (error) {
      console.error("Ürünler yüklenirken hata oluştu:", error)
      alert("Ürünler yüklenirken hata oluştu.")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const productData = {
        name,
        description,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        active,
      }

      let error

      if (editingId) {
        // Güncelleme
        const { error: updateError } = await supabase.from("products").update(productData).eq("id", editingId)
        error = updateError
      } else {
        // Yeni ürün ekleme
        const { error: insertError } = await supabase.from("products").insert([productData])
        error = insertError
      }

      if (error) {
        throw error
      }

      // Formu sıfırla
      setName("")
      setDescription("")
      setPrice("")
      setStock("")
      setActive(true)
      setEditingId(null)

      // Ürünleri yeniden yükle
      fetchProducts()
    } catch (error) {
      console.error("Ürün kaydedilirken hata oluştu:", error)
      alert("Ürün kaydedilirken hata oluştu.")
    }
  }

  function handleEdit(product: any) {
    setEditingId(product.id)
    setName(product.name)
    setDescription(product.description || "")
    setPrice(product.price.toString())
    setStock(product.stock.toString())
    setActive(product.active)
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Ürünleri yeniden yükle
      fetchProducts()
    } catch (error) {
      console.error("Ürün silinirken hata oluştu:", error)
      alert("Ürün silinirken hata oluştu.")
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Ürünler</h1>

      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">{editingId ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Ürün Adı
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Açıklama
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="price" className="mb-1 block text-sm font-medium">
                Fiyat (₺)
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="stock" className="mb-1 block text-sm font-medium">
                Stok
              </label>
              <input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-gray-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="active" className="ml-2 block text-sm font-medium">
              Aktif
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none"
            >
              {editingId ? "Güncelle" : "Ekle"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setName("")
                  setDescription("")
                  setPrice("")
                  setStock("")
                  setActive(true)
                }}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 focus:outline-none"
              >
                İptal
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="border-b bg-gray-50 text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Ürün Adı</th>
                <th className="px-6 py-3 text-left">Fiyat</th>
                <th className="px-6 py-3 text-left">Stok</th>
                <th className="px-6 py-3 text-left">Durum</th>
                <th className="px-6 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Yükleniyor...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Henüz ürün bulunmuyor.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4">₺{product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(product)} className="mr-2 text-blue-600 hover:text-blue-800">
                        Düzenle
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                        Sil
                      </button>
                    </td>
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
