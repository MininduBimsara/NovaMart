"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { OrderStatus } from "@/lib/types/order"

interface OrderFiltersProps {
  selectedStatus: OrderStatus | "all"
  onStatusChange: (status: OrderStatus | "all") => void
  orderCounts: Record<OrderStatus | "all", number>
}

const statusOptions: Array<{ value: OrderStatus | "all"; label: string }> = [
  { value: "all", label: "All Orders" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

export function OrderFilters({ selectedStatus, onStatusChange, orderCounts }: OrderFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filter Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedStatus === option.value ? "default" : "ghost"}
              className="w-full justify-between"
              onClick={() => onStatusChange(option.value)}
            >
              <span>{option.label}</span>
              <Badge variant="secondary">{orderCounts[option.value] || 0}</Badge>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
