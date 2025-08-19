"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Menu, ShoppingCart, User, Package, LogOut } from "lucide-react"
import { useCartStore } from "@/lib/stores/cart-store"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { state, signOut } = useAuthContext()
  const { items } = useCartStore()

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)

  const handleLogout = async () => {
    try {
      await signOut()
      setOpen(false)
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (!state.isAuthenticated) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex flex-col space-y-4 mt-8">
          <Link
            href="/products"
            className="flex items-center space-x-2 text-lg font-medium"
            onClick={() => setOpen(false)}
          >
            <span>Products</span>
          </Link>

          <Link href="/cart" className="flex items-center space-x-2 text-lg font-medium" onClick={() => setOpen(false)}>
            <ShoppingCart className="h-5 w-5" />
            <span>Cart</span>
            {cartItemCount > 0 && <Badge variant="secondary">{cartItemCount}</Badge>}
          </Link>

          <Link
            href="/orders"
            className="flex items-center space-x-2 text-lg font-medium"
            onClick={() => setOpen(false)}
          >
            <Package className="h-5 w-5" />
            <span>Orders</span>
          </Link>

          <Link
            href="/profile"
            className="flex items-center space-x-2 text-lg font-medium"
            onClick={() => setOpen(false)}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center space-x-2 justify-start p-0 h-auto text-lg font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
