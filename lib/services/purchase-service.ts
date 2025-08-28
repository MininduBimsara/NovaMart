// lib/services/purchase-service.ts
import type { ApiClient } from "./api-client";

// Backend DTO interfaces matching Spring Boot DTOs
export interface PurchaseDTO {
  id?: string;
  username: string;
  purchaseDate: string; // LocalDate as ISO string
  deliveryTime: string; // "10AM", "11AM", "12PM"
  deliveryLocation: string; // Sri Lankan district
  productName: string; // From predefined list
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
        username: "current-user", // This should come from auth service
        purchaseDate: purchaseData.purchaseDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
        deliveryTime: backendDeliveryTime,
        deliveryLocation: purchaseData.deliveryLocation,
        productName: purchaseData.productName,
        quantity: purchaseData.quantity,
        message: purchaseData.message,
      };

      const createdPurchase = await this.apiClient.post<PurchaseDTO>(
        "/api/purchases",
        purchaseDTO
      );
      console.log("[PurchaseService] Purchase created:", createdPurchase);

      return this.convertToPurchase(createdPurchase);
    } catch (error) {
      console.error("Failed to create purchase:", error);
      throw error;
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
        "/api/purchases/admin"
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

  // Get available delivery options
  getDeliveryTimes(): Array<{ value: string; label: string }> {
    return [
      { value: "10:00", label: "10:00 AM" },
      { value: "11:00", label: "11:00 AM" },
      { value: "12:00", label: "12:00 PM" },
    ];
  }

  getDeliveryLocations(): string[] {
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

  getAvailableProducts(): string[] {
    return [
      "Smartphone X100",
      "Wireless Headphones",
      "Laptop Pro 15",
      "Tablet Air 11",
      "Smart Watch Series 5",
      "Bluetooth Speaker",
      "Gaming Console X",
      "Digital Camera 4K",
      "Power Bank 20000mAh",
      "Wireless Charger Pad",
    ];
  }

  private convertToPurchase(dto: PurchaseDTO): Purchase {
    // Convert backend delivery time to frontend format
    let frontendDeliveryTime = dto.deliveryTime;
    if (dto.deliveryTime === "10AM") frontendDeliveryTime = "10:00";
    else if (dto.deliveryTime === "11AM") frontendDeliveryTime = "11:00";
    else if (dto.deliveryTime === "12PM") frontendDeliveryTime = "12:00";

    return {
      id: dto.id || "",
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
