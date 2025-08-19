"use client"

import { useState, useEffect } from "react"
import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import { AuthGuard } from "@/lib/auth/auth-guard"
import { ProductCard } from "@/components/product-card"
import { ProductFilters } from "@/components/product-filters"
import { Loader } from "@/components/ui/loader"
import { ProductsService } from "@/lib/services/products-service"
import { ApiClient } from "@/lib/services/api-client"
import { AuthService } from "@/lib/services/auth-service"
import type { Product, ProductFilters as ProductFiltersType } from "@/lib/types/product"

export default function ProductsPage() {
  return (
    <AuthGuard>
      <ProductsContent />
    </AuthGuard>
  )
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ProductFiltersType>({})
  const authContext = useAuthContext()

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true)
      try {
        const authService = new AuthService(authContext)
        const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || "", authService)
        const productsService = new ProductsService(apiClient)

        const fetchedProducts = await productsService.getProducts(filters)
        setProducts(fetchedProducts)
      } catch (error) {
        console.error("Failed to load products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [filters, authContext])

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Products</h1>
        <p className="text-muted-foreground">Discover our amazing collection of products</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProductFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </div>

        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
