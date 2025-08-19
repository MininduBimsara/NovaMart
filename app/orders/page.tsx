"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import { AuthGuard } from "@/lib/auth/auth-guard"
import { OrderCard } from "@/components/order-card"
import { OrderFilters } from "@/components/order-filters"
import { Loader } from "@/components/ui/loader"
import { Card, CardContent } from "@/components/ui/card"
import { OrdersService } from "@/lib/services/orders-service"
import { ApiClient } from "@/lib/services/api-client"
import { AuthService } from "@/lib/services/auth-service"
import type { Order, OrderStatus } from "@/lib/types/order"
import { Package } from "lucide-react"

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  )
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">("all")
  const { state: authState } = useAuthContext()
  const searchParams = useSearchParams()

  const loadOrders = useCallback(async () => {
    if (loading) return // Prevent multiple simultaneous calls

    setLoading(true)
    try {
      console.log("[v0] Loading orders...")
      const authService = new AuthService({ state: authState } as any)
      const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || "", authService)
      const ordersService = new OrdersService(apiClient)

      const fetchedOrders = await ordersService.getOrders()
      setOrders(fetchedOrders)
      console.log("[v0] Orders loaded successfully:", fetchedOrders.length)

      // Check if there's a specific order ID in the URL (from checkout redirect)
      const orderId = searchParams.get("orderId")
      if (orderId) {
        console.log("[v0] Order placed:", orderId)
      }
    } catch (error) {
      console.error("Failed to load orders:", error)
    } finally {
      setLoading(false)
    }
  }, [authState, searchParams, loading])

  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      loadOrders()
    }
  }, [authState.isAuthenticated, authState.isLoading, loadOrders])

  const handleOrderCancelled = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, status: "cancelled" as OrderStatus } : order)),
    )
  }

  const filteredOrders = orders.filter((order) => selectedStatus === "all" || order.status === selectedStatus)

  const orderCounts = orders.reduce(
    (counts, order) => {
      counts.all += 1
      counts[order.status] += 1
      return counts
    },
    {
      all: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    } as Record<OrderStatus | "all", number>,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">Track and manage your orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <OrderFilters selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} orderCounts={orderCounts} />
        </div>

        <div className="lg:col-span-3">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedStatus === "all" ? "No orders found" : `No ${selectedStatus} orders`}
                </h3>
                <p className="text-muted-foreground">
                  {selectedStatus === "all"
                    ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                    : `You don't have any ${selectedStatus} orders at the moment.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredOrders
                .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                .map((order) => (
                  <OrderCard key={order.id} order={order} onOrderCancelled={handleOrderCancelled} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
