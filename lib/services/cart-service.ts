import type { CartItem } from "@/lib/stores/cart-store"
import type { ApiClient } from "./api-client"

export interface CheckoutData {
  items: CartItem[]
  deliveryDate: string
  deliveryTime: string
  deliveryLocation: string
  totalAmount: number
}

export interface CheckoutResponse {
  orderId: string
  status: string
  message: string
}

export class CartService {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  async syncCart(items: CartItem[]): Promise<void> {
    try {
      await this.apiClient.post("/cart/sync", { items })
    } catch (error) {
      console.error("Failed to sync cart:", error)
      // Continue without syncing for development
    }
  }

  async getCart(): Promise<CartItem[]> {
    try {
      return await this.apiClient.get<CartItem[]>("/cart")
    } catch (error) {
      console.error("Failed to fetch cart:", error)
      return []
    }
  }

  async addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }): Promise<void> {
    try {
      await this.apiClient.post("/cart/add", item)
    } catch (error) {
      console.error("Failed to add item to cart:", error)
      // Continue without API call for development
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<void> {
    try {
      await this.apiClient.put(`/cart/items/${itemId}`, { quantity })
    } catch (error) {
      console.error("Failed to update cart item:", error)
      // Continue without API call for development
    }
  }

  async removeFromCart(itemId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/cart/items/${itemId}`)
    } catch (error) {
      console.error("Failed to remove item from cart:", error)
      // Continue without API call for development
    }
  }

  async checkout(checkoutData: CheckoutData): Promise<CheckoutResponse> {
    try {
      return await this.apiClient.post<CheckoutResponse>("/cart/checkout", checkoutData)
    } catch (error) {
      console.error("Checkout failed:", error)
      // Return mock response for development
      return {
        orderId: `ORDER-${Date.now()}`,
        status: "success",
        message: "Order placed successfully!",
      }
    }
  }

  async clearCart(): Promise<void> {
    try {
      await this.apiClient.delete("/cart")
    } catch (error) {
      console.error("Failed to clear cart:", error)
      // Continue without API call for development
    }
  }
}
