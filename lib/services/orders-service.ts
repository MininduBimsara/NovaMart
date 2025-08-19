import type { Order } from "@/lib/types/order"
import type { ApiClient } from "./api-client"

export class OrdersService {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  async getOrders(): Promise<Order[]> {
    try {
      return await this.apiClient.get<Order[]>("/orders")
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      // Return mock data for development
      return this.getMockOrders()
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      return await this.apiClient.get<Order>(`/orders/${orderId}`)
    } catch (error) {
      console.error("Failed to fetch order:", error)
      return null
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await this.apiClient.post<{ success: boolean; message: string }>(`/orders/${orderId}/cancel`, {})
    } catch (error) {
      console.error("Failed to cancel order:", error)
      return {
        success: false,
        message: "Failed to cancel order. Please try again.",
      }
    }
  }

  private getMockOrders(): Order[] {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return [
      {
        id: "ORDER-1703123456789",
        userId: "user123",
        items: [
          {
            id: "1",
            name: "Wireless Headphones",
            price: 199.99,
            quantity: 1,
            image: "/wireless-headphones.png",
          },
          {
            id: "2",
            name: "Smart Watch",
            price: 299.99,
            quantity: 1,
            image: "/smartwatch-lifestyle.png",
          },
        ],
        totalAmount: 539.98,
        status: "delivered",
        deliveryDate: lastWeek.toISOString(),
        deliveryTime: "10:00",
        deliveryLocation: "Colombo",
        orderDate: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        trackingNumber: "TRK123456789",
      },
      {
        id: "ORDER-1703123456790",
        userId: "user123",
        items: [
          {
            id: "3",
            name: "Coffee Maker",
            price: 149.99,
            quantity: 1,
            image: "/modern-coffee-maker.png",
          },
        ],
        totalAmount: 161.99,
        status: "shipped",
        deliveryDate: yesterday.toISOString(),
        deliveryTime: "11:00",
        deliveryLocation: "Kandy",
        orderDate: new Date(yesterday.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        trackingNumber: "TRK123456790",
        estimatedDelivery: yesterday.toISOString(),
      },
      {
        id: "ORDER-1703123456791",
        userId: "user123",
        items: [
          {
            id: "4",
            name: "Running Shoes",
            price: 89.99,
            quantity: 2,
            image: "/running-shoes-on-track.png",
          },
        ],
        totalAmount: 193.38,
        status: "confirmed",
        deliveryDate: nextWeek.toISOString(),
        deliveryTime: "12:00",
        deliveryLocation: "Galle",
        orderDate: now.toISOString(),
      },
      {
        id: "ORDER-1703123456792",
        userId: "user123",
        items: [
          {
            id: "6",
            name: "Bluetooth Speaker",
            price: 79.99,
            quantity: 1,
            image: "/bluetooth-speaker.png",
          },
        ],
        totalAmount: 86.39,
        status: "cancelled",
        deliveryDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        deliveryTime: "10:00",
        deliveryLocation: "Matara",
        orderDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
  }
}
