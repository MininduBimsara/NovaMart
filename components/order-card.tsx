"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import type { Order } from "@/lib/types/order"
import { Package, MapPin, Clock, Truck, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface OrderCardProps {
  order: Order
  onOrderCancelled?: (orderId: string) => void
}

const statusConfig = {
  pending: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-100", label: "Pending" },
  confirmed: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-100", label: "Confirmed" },
  processing: { icon: Package, color: "text-purple-600", bg: "bg-purple-100", label: "Processing" },
  shipped: { icon: Truck, color: "text-orange-600", bg: "bg-orange-100", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Cancelled" },
}

export function OrderCard({ order, onOrderCancelled }: OrderCardProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()

  const statusInfo = statusConfig[order.status]
  const StatusIcon = statusInfo.icon

  const canCancel = order.status === "pending" || order.status === "confirmed"

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Order Cancelled",
        description: `Order ${order.id} has been cancelled successfully.`,
      })

      onOrderCancelled?.(order.id)
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel the order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Order {order.id}</h3>
            <p className="text-sm text-muted-foreground">Placed on {format(new Date(order.orderDate), "PPP")}</p>
          </div>
          <Badge variant="secondary" className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                <Image
                  src={item.image || "/placeholder.svg?height=48&width=48&query=product"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{order.deliveryLocation}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(order.deliveryDate), "MMM dd")} at{" "}
              {order.deliveryTime === "10:00" ? "10:00 AM" : order.deliveryTime === "11:00" ? "11:00 AM" : "12:00 PM"}
            </span>
          </div>
          {order.trackingNumber && (
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">{order.trackingNumber}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-lg font-semibold">Total: ${order.totalAmount.toFixed(2)}</span>
        </div>
      </CardContent>

      {canCancel && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="w-full bg-transparent"
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
