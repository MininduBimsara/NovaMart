// components/cart-sync-provider.tsx
"use client";

import { useCartSync } from "@/hooks/use-cart-sync";
import type { ReactNode } from "react";

interface CartSyncProviderProps {
  children: ReactNode;
}

export function CartSyncProvider({ children }: CartSyncProviderProps) {
  // This will automatically sync cart when user authenticates
  useCartSync();

  return <>{children}</>;
}
