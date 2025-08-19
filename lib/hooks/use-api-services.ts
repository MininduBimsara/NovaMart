"use client"

import { useMemo } from "react"
import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import { AuthService } from "@/lib/services/auth-service"
import { ApiClient } from "@/lib/services/api-client"
import { ProductsService } from "@/lib/services/products-service"
import { CartService } from "@/lib/services/cart-service"
import { OrdersService } from "@/lib/services/orders-service"

export function useApiServices() {
  const { state: authState } = useAuthContext()

  const services = useMemo(() => {
    console.log("[v0] Creating API services with auth state:", authState.isAuthenticated)
    const authService = new AuthService({ state: authState } as any)
    const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api", authService)

    return {
      authService,
      apiClient,
      productsService: new ProductsService(apiClient),
      cartService: new CartService(apiClient),
      ordersService: new OrdersService(apiClient),
    }
  }, [authState]) // Use entire authState instead of specific stable properties
}
