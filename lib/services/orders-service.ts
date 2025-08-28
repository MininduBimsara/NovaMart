// lib/services/orders-service.ts
import type { Order } from "@/lib/types/order";
import type { ApiClient } from "./api-client";

// Backend DTO interfaces matching Spring Boot DTOs
export interface OrderDTO {
  id?: string;
  userId: string;
  items: OrderItemDTO[];
  totalAmount: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
}

export interface OrderItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Map backend status to frontend status
const statusMapping: Record<string, Order["status"]> = {
  PENDING: "pending",
  COMPLETED: "delivered",
  CANCELLED: "cancelled",
};

export class OrdersService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async getOrders(): Promise<Order[]> {
    try {
      console.log("[OrdersService] Fetching orders from backend");
      const backendOrders = await this.apiClient.get<OrderDTO[]>("/api/orders");
      console.log("[OrdersService] Received orders:", backendOrders.length);

      // Convert backend orders to frontend format
      const orders: Order[] = [];

      for (const orderDTO of backendOrders) {
        try {
          const order = await this.convertToOrder(orderDTO);
          orders.push(order);
        } catch (error) {
          console.error(`Failed to convert order ${orderDTO.id}:`, error);
        }
      }

      return orders;
    } catch (error) {
      console.error("Failed to fetch orders from backend:", error);
      console.log("[OrdersService] Falling back to mock data");
      return this.getMockOrders();
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      console.log("[OrdersService] Fetching order:", orderId);
      const orderDTO = await this.apiClient.get<OrderDTO>(
        `/api/orders/${orderId}`
      );
      return await this.convertToOrder(orderDTO);
    } catch (error) {
      console.error("Failed to fetch order from backend:", error);

      // Fallback to mock data
      const mockOrders = this.getMockOrders();
      return mockOrders.find((order) => order.id === orderId) || null;
    }
  }

  async createOrder(orderData: {
    items: Array<{ id: string; name: string; price: number; quantity: number }>;
    totalAmount: number;
    deliveryDate: string;
    deliveryTime: string;
    deliveryLocation: string;
  }): Promise<Order> {
    try {
      console.log("[OrdersService] Creating order:", orderData);

      const orderDTO: OrderDTO = {
        userId: "current-user", // This should come from auth context
        items: orderData.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
        totalAmount: orderData.totalAmount,
        status: "PENDING",
      };

      const createdOrder = await this.apiClient.post<OrderDTO>(
        "/api/orders",
        orderDTO
      );
      console.log("[OrdersService] Order created:", createdOrder);

      return await this.convertToOrder(createdOrder, {
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        deliveryLocation: orderData.deliveryLocation,
      });
    } catch (error) {
      console.error("Failed to create order:", error);
      throw error;
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: Order["status"]
  ): Promise<Order> {
    try {
      console.log("[OrdersService] Updating order status:", orderId, status);

      // Map frontend status to backend status
      const backendStatus =
        Object.keys(statusMapping).find(
          (key) => statusMapping[key] === status
        ) || "PENDING";

      const updateData = { status: backendStatus };
      const updatedOrder = await this.apiClient.put<OrderDTO>(
        `/api/orders/${orderId}`,
        updateData
      );

      return await this.convertToOrder(updatedOrder);
    } catch (error) {
      console.error("Failed to update order status:", error);
      throw error;
    }
  }

  async cancelOrder(
    orderId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("[OrdersService] Cancelling order:", orderId);

      // Update order status to cancelled
      await this.updateOrderStatus(orderId, "cancelled");

      return {
        success: true,
        message: "Order cancelled successfully",
      };
    } catch (error) {
      console.error("Failed to cancel order:", error);
      return {
        success: false,
        message: "Failed to cancel order. Please try again.",
      };
    }
  }

  private async convertToOrder(
    orderDTO: OrderDTO,
    additionalData?: {
      deliveryDate?: string;
      deliveryTime?: string;
      deliveryLocation?: string;
    }
  ): Promise<Order> {
    const items = [];

    // Fetch product details for each order item
    for (const item of orderDTO.items) {
      try {
        const product = await this.apiClient.get(
          `/api/products/${item.productId}`
        );
        items.push({
          id: item.productId,
          name: product.name,
          price: item.unitPrice,
          quantity: item.quantity,
          image: this.getProductImage(product.name),
        });
      } catch (error) {
        console.error(`Failed to fetch product ${item.productId}:`, error);
        // Add item with minimal info if product fetch fails
        items.push({
          id: item.productId,
          name: `Product ${item.productId}`,
          price: item.unitPrice,
          quantity: item.quantity,
          image: "/placeholder.svg?height=48&width=48&query=product",
        });
      }
    }

    // Generate mock delivery data if not provided
    const now = new Date();
    const deliveryDate =
      additionalData?.deliveryDate ||
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const deliveryTime = additionalData?.deliveryTime || "10:00";
    const deliveryLocation = additionalData?.deliveryLocation || "Colombo";

    return {
      id: orderDTO.id || `ORDER-${Date.now()}`,
      userId: orderDTO.userId,
      items,
      totalAmount: orderDTO.totalAmount,
      status: statusMapping[orderDTO.status] || "pending",
      deliveryDate,
      deliveryTime,
      deliveryLocation,
      orderDate: new Date().toISOString(),
      trackingNumber: `TRK${
        orderDTO.id?.slice(-6) || Math.random().toString().slice(-6)
      }`,
    };
  }

  private getProductImage(productName: string): string {
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
      return `/placeholder.svg?height=48&width=48&text=${encodeURIComponent(
        productName
      )}`;
    }
  }

  private getMockOrders(): Order[] {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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
        orderDate: new Date(
          lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
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
        orderDate: new Date(
          yesterday.getTime() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
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
        deliveryDate: new Date(
          now.getTime() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        deliveryTime: "10:00",
        deliveryLocation: "Matara",
        orderDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}
