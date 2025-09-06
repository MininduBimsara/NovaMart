// lib/services/purchase-service.ts
import type { ApiClient } from "./api-client";

// Backend DTO interfaces matching Spring Boot DTOs
export interface PurchaseDTO {
  id?: string;
  username: string;
  purchaseDate: string; // LocalDate as ISO string (YYYY-MM-DD)
  deliveryTime: string; // "10AM", "11AM", "12PM"
  deliveryLocation: string; // Sri Lankan district
  productName: string; // From predefined enum
  quantity: number;
  message?: string;
  status?: string;
}

export interface Purchase {
  id: string;
  username: string;
  purchaseDate: string;
  deliveryTime: string;
  deliveryLocation: string;
  productName: string;
  quantity: number;
  message?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export class PurchaseService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async createPurchase(purchaseData: {
    purchaseDate: Date;
    deliveryTime: string;
    deliveryLocation: string;
    productName: string;
    quantity: number;
    message?: string;
  }): Promise<Purchase> {
    try {
      console.log("[PurchaseService] Creating purchase:", purchaseData);

      // Convert delivery time to backend format
      let backendDeliveryTime = purchaseData.deliveryTime;
      if (purchaseData.deliveryTime === "10:00") backendDeliveryTime = "10AM";
      else if (purchaseData.deliveryTime === "11:00")
        backendDeliveryTime = "11AM";
      else if (purchaseData.deliveryTime === "12:00")
        backendDeliveryTime = "12PM";

      const purchaseDTO: PurchaseDTO = {
        username: "current-user", // This will be set by the backend from JWT
        purchaseDate: purchaseData.purchaseDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
        deliveryTime: backendDeliveryTime,
        deliveryLocation: purchaseData.deliveryLocation,
        productName: purchaseData.productName,
        quantity: purchaseData.quantity,
        message: purchaseData.message || undefined,
      };

      console.log("[PurchaseService] Sending purchase DTO:", purchaseDTO);

      const createdPurchase = await this.apiClient.post<PurchaseDTO>(
        "/api/purchases",
        purchaseDTO
      );

      console.log("[PurchaseService] Purchase created:", createdPurchase);
      return this.convertToPurchase(createdPurchase);
    } catch (error) {
      console.error("Failed to create purchase:", error);

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes("400")) {
          throw new Error(
            "Invalid purchase data. Please check your inputs and try again."
          );
        } else if (error.message.includes("401")) {
          throw new Error(
            "Authentication required. Please sign in and try again."
          );
        } else if (error.message.includes("403")) {
          throw new Error("You don't have permission to create purchases.");
        } else if (error.message.includes("500")) {
          throw new Error("Server error. Please try again later.");
        }
      }

      throw new Error("Failed to create purchase. Please try again.");
    }
  }

  async getPurchasesByUsername(username?: string): Promise<Purchase[]> {
    try {
      console.log("[PurchaseService] Fetching purchases for user:", username);
      const purchases = await this.apiClient.get<PurchaseDTO[]>(
        "/api/purchases"
      );
      console.log("[PurchaseService] Received purchases:", purchases.length);

      return purchases.map(this.convertToPurchase);
    } catch (error) {
      console.error("Failed to fetch purchases:", error);
      return [];
    }
  }

  async getPurchase(id: string): Promise<Purchase | null> {
    try {
      console.log("[PurchaseService] Fetching purchase:", id);
      const purchase = await this.apiClient.get<PurchaseDTO>(
        `/api/purchases/${id}`
      );
      return this.convertToPurchase(purchase);
    } catch (error) {
      console.error("Failed to fetch purchase:", error);
      return null;
    }
  }

  async getAllPurchases(): Promise<Purchase[]> {
    try {
      console.log("[PurchaseService] Fetching all purchases (admin)");
      const purchases = await this.apiClient.get<PurchaseDTO[]>(
        "/api/purchases/admin/all"
      );
      console.log(
        "[PurchaseService] Received all purchases:",
        purchases.length
      );

      return purchases.map(this.convertToPurchase);
    } catch (error) {
      console.error("Failed to fetch all purchases:", error);
      return [];
    }
  }

  // Get available delivery options from backend
  async getDeliveryLocations(): Promise<
    Array<{ value: string; label: string }>
  > {
    try {
      const locations = await this.apiClient.get<
        Array<{ value: string; label: string }>
      >("/api/purchases/options/delivery-locations");
      return locations;
    } catch (error) {
      console.error("Failed to fetch delivery locations from backend:", error);
      // Fallback to hardcoded list
      return this.getDefaultDeliveryLocations().map((location) => ({
        value: location,
        label: location,
      }));
    }
  }

  async getDeliveryTimes(): Promise<Array<{ value: string; label: string }>> {
    try {
      const times = await this.apiClient.get<
        Array<{ value: string; label: string }>
      >("/api/purchases/options/delivery-times");
      return times;
    } catch (error) {
      console.error("Failed to fetch delivery times from backend:", error);
      // Fallback to hardcoded list
      return [
        { value: "10:00", label: "10:00 AM" },
        { value: "11:00", label: "11:00 AM" },
        { value: "12:00", label: "12:00 PM" },
      ];
    }
  }

  async getAvailableProducts(): Promise<
    Array<{ value: string; label: string }>
  > {
    try {
      const products = await this.apiClient.get<
        Array<{ value: string; label: string }>
      >("/api/purchases/options/products");
      return products;
    } catch (error) {
      console.error("Failed to fetch products from backend:", error);
      // Fallback to hardcoded list
      return [
        { value: "SMARTPHONE_X100", label: "Smartphone X100" },
        { value: "WIRELESS_HEADPHONES", label: "Wireless Headphones" },
        { value: "LAPTOP_PRO", label: "Laptop Pro 15" },
        { value: "TABLET_AIR", label: "Tablet Air 11" },
        { value: "SMART_WATCH", label: "Smart Watch Series 5" },
        { value: "BLUETOOTH_SPEAKER", label: "Bluetooth Speaker" },
        { value: "GAMING_CONSOLE", label: "Gaming Console X" },
        { value: "DIGITAL_CAMERA", label: "Digital Camera 4K" },
        { value: "POWER_BANK", label: "Power Bank 20000mAh" },
        { value: "WIRELESS_CHARGER", label: "Wireless Charger Pad" },
      ];
    }
  }

  // Fallback methods for when backend is not available
  private getDefaultDeliveryLocations(): string[] {
    return [
      "Ampara",
      "Anuradhapura",
      "Badulla",
      "Batticaloa",
      "Colombo",
      "Galle",
      "Gampaha",
      "Hambantota",
      "Jaffna",
      "Kalutara",
      "Kandy",
      "Kegalle",
      "Kilinochchi",
      "Kurunegala",
      "Mannar",
      "Matale",
      "Matara",
      "Monaragala",
      "Mullaitivu",
      "Nuwara Eliya",
      "Polonnaruwa",
      "Puttalam",
      "Ratnapura",
      "Trincomalee",
      "Vavuniya",
    ];
  }

  private convertToPurchase(dto: PurchaseDTO): Purchase {
    // Convert backend delivery time to frontend format
    let frontendDeliveryTime = dto.deliveryTime;
    if (dto.deliveryTime === "10AM") frontendDeliveryTime = "10:00";
    else if (dto.deliveryTime === "11AM") frontendDeliveryTime = "11:00";
    else if (dto.deliveryTime === "12PM") frontendDeliveryTime = "12:00";

    return {
      id: dto.id || `PURCHASE-${Date.now()}`,
      username: dto.username,
      purchaseDate: dto.purchaseDate,
      deliveryTime: frontendDeliveryTime,
      deliveryLocation: dto.deliveryLocation,
      productName: dto.productName,
      quantity: dto.quantity,
      message: dto.message,
      status: dto.status || "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
