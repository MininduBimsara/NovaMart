// hooks/use-cart-sync.ts - FIXED VERSION
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
    // Only sync if user is authenticated and not loading
    if (!authState.isAuthenticated || authState.isLoading) {
      console.log("[CartSync] Skipping sync - not authenticated or loading");
      return;
    }

    // Wait a bit for auth to fully stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      console.log("[CartSync] Starting cart sync...");
      const authService = new AuthService({ state: authState } as any);

      // Check if we can get a token first
      const token = await authService.getAccessToken();
      if (!token) {
        console.warn("[CartSync] No access token available, skipping sync");
        return;
      }

      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );
      const cartService = new CartService(apiClient);

      console.log("[CartSync] Token available, proceeding with sync");

      // Try to load cart from backend first
      try {
        const backendCartItems = await cartService.getCart();
        console.log(
          `[CartSync] Loaded ${backendCartItems.length} items from backend`
        );

        if (backendCartItems.length > 0) {
          // Backend has items, load them to frontend
          clearCart();
          backendCartItems.forEach((item) => {
            addItem(item);
          });
          console.log("[CartSync] Backend cart loaded to frontend");
        } else if (items.length > 0) {
          // Frontend has items, sync to backend
          console.log(
            `[CartSync] Syncing ${items.length} frontend items to backend`
          );
          await cartService.syncCart(items);
          console.log("[CartSync] Frontend cart synced to backend");
        }

        console.log("[CartSync] Cart sync completed successfully");
      } catch (syncError) {
        console.warn("[CartSync] Cart sync failed (non-critical):", syncError);
        // Don't throw - cart sync failure shouldn't break the app
      }
    } catch (error) {
      console.warn("[CartSync] Cart sync error:", error);
      // Don't throw error to avoid disrupting user experience
    }
  }, [authState, items, clearCart, addItem]);

  // Sync when authentication state becomes stable
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (authState.isAuthenticated && !authState.isLoading) {
      // Delay sync to allow auth to fully stabilize
      timeoutId = setTimeout(() => {
        syncWithBackend();
      }, 2000); // 2 second delay
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [authState.isAuthenticated, authState.isLoading, syncWithBackend]);

  return { syncWithBackend };
}
