"use client"

import type React from "react"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useCartStore, type CartItem } from "@/lib/stores/cart-store"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface CartItemProps {
  item: CartItem
}

export function CartItemComponent({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore()
  const { toast } = useToast()
  const [quantity, setQuantity] = useState(item.quantity)

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem()
      return
    }

    setQuantity(newQuantity)
    updateQuantity(item.id, newQuantity)
  }

  const handleRemoveItem = () => {
    removeItem(item.id)
    toast({
      title: "Item Removed",
      description: `${item.name} has been removed from your cart.`,
    })
  }

  const handleQuantityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value) || 1
    handleQuantityChange(value)
  }

  const subtotal = item.price * item.quantity

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
            <Image
              src={item.image || "/placeholder.svg?height=64&width=64&query=product"}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">{item.name}</h3>
            <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>

            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityInputChange}
              className="w-16 h-8 text-center"
            />

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">${subtotal.toFixed(2)}</p>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleRemoveItem}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
