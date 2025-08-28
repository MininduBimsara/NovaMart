// lib/services/cart-service.ts
import type { CartItem } from "@/lib/stores/cart-store";
import type { ApiClient } from "./api-client";

// Backend DTO interfaces matching Spring Boot DTOs
export interface CartDTO {
  userId: string;
  items: CartItemDTO[];
}

export interface CartItemDTO {
  productId: string;
  quantity: number;
}

export interface CheckoutData {
  items: CartItem[];
  deliveryDate: string;
  deliveryTime: string;
  deliveryLocation: string;
  totalAmount: number;
}

export interface CheckoutResponse {
  orderId: string;
  status: string;
  message: string;
}

export class CartService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async getCart(): Promise<CartItem[]> {
    try {
      console.log("[CartService] Fetching cart from backend");
      const cartDTO = await this.apiClient.get<CartDTO>("/api/cart");
      console.log("[CartService] Received cart:", cartDTO);

      // Convert backend cart to frontend format
      const cartItems: CartItem[] = [];

      for (const item of cartDTO.items) {
        try {
          // Fetch product details for each cart item
          const product = await this.apiClient.get(
            `/api/products/${item.productId}`
          );
          cartItems.push({
            id: item.productId,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            image: this.getProductImage(product.name),
          });
        } catch (error) {
          console.error(`Failed to fetch product ${item.productId}:`, error);
          // Skip items that can't be loaded instead of creating placeholder
        }
      }

      return cartItems;
    } catch (error) {
      console.error("Failed to fetch cart from backend:", error);
      return [];
    }
  }

  async addToCart(
    item: Omit<CartItem, "quantity"> & { quantity?: number }
  ): Promise<void> {
    try {
      console.log("[CartService] Adding item to cart:", item);

      const cartItemDTO: CartItemDTO = {
        productId: item.id,
        quantity: item.quantity || 1,
      };

      await this.apiClient.post("/api/cart/items", cartItemDTO);
      console.log("[CartService] Item added to cart successfully");
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      throw error;
    }
  }

  async updateCartItem(itemId: string, quantity: number): Promise<void> {
    try {
      console.log("[CartService] Updating cart item:", itemId, quantity);

      if (quantity <= 0) {
        await this.removeFromCart(itemId);
        return;
      }

      const cartItemDTO: CartItemDTO = {
        productId: itemId,
        quantity: quantity,
      };

      await this.apiClient.post("/api/cart/items", cartItemDTO);
      console.log("[CartService] Cart item updated successfully");
    } catch (error) {
      console.error("Failed to update cart item:", error);
      throw error;
    }
  }

  async removeFromCart(itemId: string): Promise<void> {
    try {
      console.log("[CartService] Removing item from cart:", itemId);
      await this.apiClient.delete(`/api/cart/items/${itemId}`);
      console.log("[CartService] Item removed from cart successfully");
    } catch (error) {
      console.error("Failed to remove item from cart:", error);
      throw error;
    }
  }

  async clearCart(): Promise<void> {
    try {
      console.log("[CartService] Clearing cart");
      await this.apiClient.delete("/api/cart/clear");
      console.log("[CartService] Cart cleared successfully");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  }

  async syncCart(items: CartItem[]): Promise<void> {
    try {
      console.log(
        "[CartService] Syncing cart with backend:",
        items.length,
        "items"
      );

      // Clear cart first
      await this.clearCart();

      // Add all items
      for (const item of items) {
        await this.addToCart(item);
      }

      console.log("[CartService] Cart synced successfully");
    } catch (error) {
      console.error("Failed to sync cart:", error);
      // Don't throw error for sync failures to avoid disrupting user experience
    }
  }

  async checkout(checkoutData: CheckoutData): Promise<CheckoutResponse> {
    try {
      console.log("[CartService] Processing checkout:", checkoutData);

      // Create order through the orders endpoint
      const orderDTO = {
        userId: "current-user", // This should come from auth context
        items: checkoutData.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        totalAmount: checkoutData.totalAmount,
        status: "PENDING",
      };

      const order = await this.apiClient.post("/api/orders", orderDTO);
      console.log("[CartService] Order created:", order);

      // Clear cart after successful order
      await this.clearCart();

      return {
        orderId: order.id,
        status: "success",
        message: "Order placed successfully!",
      };
    } catch (error) {
      console.error("Checkout failed:", error);
      throw new Error("Failed to process checkout. Please try again.");
    }
  }

  private getProductImage(productName: string): string {
    // Generate placeholder images based on product name
    const name = productName.toLowerCase();

    if (name.includes("headphone") || name.includes("audio")) {
      return "/wireless-headphones.png";
    } else if (name.includes("watch") || name.includes("smart")) {
      return "/smartwatch-lifestyle.png";
    } else if (name.includes("coffee") || name.includes("maker")) {
      return "/modern-coffee-maker.png";
    } else if (name.includes("shoe") || name.includes("running")) {
      return "/running-shoes-on-track.png";
    } else if (name.includes("backpack") || name.includes("bag")) {
      return "/laptop-backpack.png";
    } else if (name.includes("speaker") || name.includes("bluetooth")) {
      return "/bluetooth-speaker.png";
    } else {
      return `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(
        productName
      )}`;
    }
  }
}
