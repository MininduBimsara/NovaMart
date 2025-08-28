// lib/hooks/use-cart-sync.ts
"use client";

import { useEffect, useCallback } from "react";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { useCartStore } from "@/lib/stores/cart-store";
import { CartService } from "@/lib/services/cart-service";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";

export function useCartSync() {
  const { state: authState } = useAuthContext();
  const { items, clearCart, addItem } = useCartStore();

  const syncWithBackend = useCallback(async () => {
    if (!authState.isAuthenticated || authState.isLoading) {
      return;
    }

    try {
      const authService = new AuthService({ state: authState } as any);
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );
      const cartService = new CartService(apiClient);

      console.log("[CartSync] Syncing cart with backend...");

      // Load cart from backend
      const backendCartItems = await cartService.getCart();

      if (backendCartItems.length > 0) {
        console.log(
          "[CartSync] Loading cart from backend:",
          backendCartItems.length,
          "items"
        );

        // Clear frontend cart and load backend items
        clearCart();
        backendCartItems.forEach((item) => {
          addItem(item);
        });
      } else if (items.length > 0) {
        console.log(
          "[CartSync] Syncing frontend cart to backend:",
          items.length,
          "items"
        );

        // Sync frontend cart to backend
        await cartService.syncCart(items);
      }

      console.log("[CartSync] Cart sync completed");
    } catch (error) {
      console.warn("[CartSync] Failed to sync cart:", error);
      // Don't throw error to avoid disrupting user experience
    }
  }, [authState, items, clearCart, addItem]);

  // Sync on authentication state change
  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      syncWithBackend();
    }
  }, [authState.isAuthenticated, authState.isLoading, syncWithBackend]);

  return { syncWithBackend };
}
