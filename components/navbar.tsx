// components/navbar.tsx
"use client";

import Link from "next/link";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, User, Package, LogOut, FileText } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart-store";

export function Navbar() {
  const { state, signOut } = useAuthContext();
  const { user, isAuthenticated } = state;
  const { items } = useCartStore();

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = async () => {
    try {
      signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/products" className="text-xl font-bold">
              E-Shop
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/products"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Products
              </Link>
              <Link
                href="/cart"
                className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
              <Link
                href="/orders"
                className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
              >
                <Package className="h-4 w-4" />
                <span>Orders</span>
              </Link>
              <Link
                href="/purchases"
                className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
              >
                <FileText className="h-4 w-4" />
                <span>Purchases</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/profile"
              className="flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {user?.name || user?.email}
              </span>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
