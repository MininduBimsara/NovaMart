// app/products/page.tsx - WITH DEBUG PANEL
"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { AuthGuard } from "@/lib/auth/auth-guard";
import { ProductCard } from "@/components/product-card";
import { ProductFilters } from "@/components/product-filters";
import { Loader } from "@/components/ui/loader";
import { ProductsService } from "@/lib/services/products-service";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";
import { useToast } from "@/hooks/use-toast";
import { AsgardeoDebug } from "@/components/asgardeo-debug";
import type {
  Product,
  ProductFilters as ProductFiltersType,
} from "@/lib/types/product";

export default function ProductsPage() {
  return (
    <AuthGuard>
      <ProductsContent />
    </AuthGuard>
  );
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFiltersType>({});
  const authContext = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    const loadProducts = async () => {
      if (!authContext.state.isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const authService = new AuthService(authContext);
        const apiClient = new ApiClient(
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
          authService
        );
        const productsService = new ProductsService(apiClient);

        console.log("[ProductsPage] Loading products with filters:", filters);
        const fetchedProducts = await productsService.getProducts(filters);
        console.log("[ProductsPage] Loaded products:", fetchedProducts.length);

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to load products:", error);
        setError("Failed to load products. Please try again.");

        toast({
          title: "Error Loading Products",
          description:
            "Could not connect to the backend. Please ensure the backend server is running on port 8080.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filters, authContext, toast]);

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    console.log("[ProductsPage] Filters changed:", newFilters);
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="mb-4">
            <svg
              className="h-16 w-16 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.888-.833-2.598 0L4.196 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Unable to Load Products
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground mb-6">
            Please ensure the backend server is running on{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">
              http://localhost:8080
            </code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Products</h1>
        <p className="text-muted-foreground">
          Discover our collection of products from the backend
        </p>
      </div>

      {/* Debug Panel for Asgardeo users */}
      {authContext.state.authMode === "asgardeo" && (
        <div className="mb-6">
          <AsgardeoDebug />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <ProductFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <svg
                  className="h-16 w-16 mx-auto text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
                {Object.keys(filters).length > 0
                  ? "Try adjusting your filters or search terms."
                  : "No products are available in the database yet."}
              </p>
              <p className="text-sm text-muted-foreground">
                Products need to be added through the backend API or admin
                interface.
              </p>
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
  );
}
