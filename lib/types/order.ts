export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  deliveryDate: string
  deliveryTime: string
  deliveryLocation: string
  orderDate: string
  trackingNumber?: string
  estimatedDelivery?: string
}

export type OrderStatus = Order["status"]
