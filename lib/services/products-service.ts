// lib/services/products-service.ts
import type { Product, ProductFilters } from "@/lib/types/product";
import type { ApiClient } from "./api-client";

// Backend DTO interfaces matching Spring Boot DTOs
export interface ProductDTO {
  id?: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  category: string;
}

export class ProductsService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      console.log("[ProductsService] Fetching products with filters:", filters);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters?.category && filters.category !== "All categories") {
        queryParams.append("category", filters.category);
      }
      if (filters?.minPrice)
        queryParams.append("minPrice", filters.minPrice.toString());
      if (filters?.maxPrice)
        queryParams.append("maxPrice", filters.maxPrice.toString());
      if (filters?.search) queryParams.append("search", filters.search);

      const endpoint = `/api/products${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const backendProducts = await this.apiClient.get<ProductDTO[]>(endpoint);
      console.log(
        "[ProductsService] Received products from backend:",
        backendProducts.length
      );

      // Convert backend DTOs to frontend Product interface
      return backendProducts.map(this.convertToProduct);
    } catch (error) {
      console.error("Failed to fetch products from backend:", error);
      console.log("[ProductsService] Falling back to mock data");

      // Return filtered mock data as fallback
      let mockProducts = this.getMockProducts();

      if (filters) {
        mockProducts = this.filterMockProducts(mockProducts, filters);
      }

      return mockProducts;
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const backendProduct = await this.apiClient.get<ProductDTO>(
        `/api/products/${id}`
      );
      return this.convertToProduct(backendProduct);
    } catch (error) {
      console.error("Failed to fetch product from backend:", error);

      // Fallback to mock data
      const mockProducts = this.getMockProducts();
      return mockProducts.find((p) => p.id === id) || null;
    }
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    try {
      const productDTO: ProductDTO = {
        name: product.name,
        description: product.description,
        price: product.price,
        availableQuantity: product.stock,
        category: product.category || "General",
      };

      const createdProduct = await this.apiClient.post<ProductDTO>(
        "/api/products",
        productDTO
      );
      return this.convertToProduct(createdProduct);
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      const productDTO: Partial<ProductDTO> = {};
      if (product.name) productDTO.name = product.name;
      if (product.description) productDTO.description = product.description;
      if (product.price) productDTO.price = product.price;
      if (product.stock !== undefined)
        productDTO.availableQuantity = product.stock;
      if (product.category) productDTO.category = product.category;

      const updatedProduct = await this.apiClient.put<ProductDTO>(
        `/api/products/${id}`,
        productDTO
      );
      return this.convertToProduct(updatedProduct);
    } catch (error) {
      console.error("Failed to update product:", error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.apiClient.delete(`/api/products/${id}`);
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  }

  private convertToProduct(dto: ProductDTO): Product {
    return {
      id: dto.id || "",
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.availableQuantity,
      category: dto.category,
      image: this.getProductImage(dto.name), // Generate placeholder image based on name
    };
  }

  private getProductImage(productName: string): string {
    // Generate placeholder images based on product name/category
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
      return `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(
        productName
      )}`;
    }
  }

  private filterMockProducts(
    products: Product[],
    filters: ProductFilters
  ): Product[] {
    return products.filter((product) => {
      if (
        filters.category &&
        filters.category !== "All categories" &&
        product.category !== filters.category
      ) {
        return false;
      }

      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }

      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }

      if (
        filters.search &&
        !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !product.description
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
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
    ];
  }
}
