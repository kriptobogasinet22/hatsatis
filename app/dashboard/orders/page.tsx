"use client"

import { useEffect, useCallback } from "react"

interface Order {
  id: string
  customer: string
  date: string
  amount: number
  status: string
}

export default function OrdersPage() {
  \
  const [orders, useState<Order[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      // Replace with your actual API endpoint
      const response = await fetch("/api/orders")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setOrders(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders]) // fetchOrders'ı dependency array'e ekleyin

  if (loading) {
    return <div>Loading orders...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h1>Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            {order.customer} - {order.date} - {order.amount} - {order.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
