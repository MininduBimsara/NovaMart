import type { Product, ProductFilters } from "@/lib/types/product"
import type { ApiClient } from "./api-client"

export class ProductsService {
  private apiClient: ApiClient

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams()

      if (filters?.category) queryParams.append("category", filters.category)
      if (filters?.minPrice) queryParams.append("minPrice", filters.minPrice.toString())
      if (filters?.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString())
      if (filters?.search) queryParams.append("search", filters.search)

      const endpoint = `/products${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
      return await this.apiClient.get<Product[]>(endpoint)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      // Return mock data for development
      return this.getMockProducts()
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      return await this.apiClient.get<Product>(`/products/${id}`)
    } catch (error) {
      console.error("Failed to fetch product:", error)
      return null
    }
  }

  private getMockProducts(): Product[] {
    return [
      {
        id: "1",
        name: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 199.99,
        stock: 15,
        category: "Electronics",
        image: "/wireless-headphones.png",
      },
      {
        id: "2",
        name: "Smart Watch",
        description: "Feature-rich smartwatch with health tracking",
        price: 299.99,
        stock: 8,
        category: "Electronics",
        image: "/smartwatch-lifestyle.png",
      },
      {
        id: "3",
        name: "Coffee Maker",
        description: "Premium coffee maker for the perfect brew",
        price: 149.99,
        stock: 12,
        category: "Home & Kitchen",
        image: "/modern-coffee-maker.png",
      },
      {
        id: "4",
        name: "Running Shoes",
        description: "Comfortable running shoes for all terrains",
        price: 89.99,
        stock: 25,
        category: "Sports",
        image: "/running-shoes-on-track.png",
      },
      {
        id: "5",
        name: "Laptop Backpack",
        description: "Durable laptop backpack with multiple compartments",
        price: 59.99,
        stock: 0,
        category: "Accessories",
        image: "/laptop-backpack.png",
      },
      {
        id: "6",
        name: "Bluetooth Speaker",
        description: "Portable Bluetooth speaker with excellent sound quality",
        price: 79.99,
        stock: 18,
        category: "Electronics",
        image: "/bluetooth-speaker.png",
      },
    ]
  }
}
