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
      // Return empty array instead of mock data
      return [];
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
      return null;
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
      image: this.getProductImage(dto.name),
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
}
