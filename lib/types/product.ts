export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image?: string
  category?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
}

export type ProductFiltersType = ProductFilters
