"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { PaymentRequestTable } from "./components/payment-request-table"
import { PaymentSettingsForm } from "./components/payment-settings-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function PaymentsPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequestWithCustomer[]>([])
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPaymentRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payment-requests")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: PaymentRequestWithCustomer[] = await response.json()
      setPaymentRequests(data)
    } catch (error) {
      console.error("Failed to fetch payment requests:", error)
      toast.error("Failed to fetch payment requests.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPaymentSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payment-settings")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: PaymentSettings = await response.json()
      setPaymentSettings(data)
    } catch (error) {
      console.error("Failed to fetch payment settings:", error)
      toast.error("Failed to fetch payment settings.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPaymentRequests()
    fetchPaymentSettings()
  }, [fetchPaymentRequests, fetchPaymentSettings]) // Eksik bağımlılıkları ekleyin

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>Manage your payment settings here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-[200px]" />
          ) : (
            <PaymentSettingsForm
              initialData={paymentSettings || undefined}
              onSuccess={() => {
                fetchPaymentSettings()
              }}
            />
          )}
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
          <CardDescription>View and manage payment requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[200px]" />
            </div>
          ) : (
            <PaymentRequestTable data={paymentRequests} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
