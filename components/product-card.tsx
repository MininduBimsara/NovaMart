// components/product-card.tsx
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/lib/stores/cart-store";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { CartService } from "@/lib/services/cart-service";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";
import type { Product } from "@/lib/types/product";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { toast } = useToast();
  const { state: authState } = useAuthContext();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      // Add to frontend store immediately for better UX
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      };

      addItem(cartItem);

      // Sync with backend if authenticated
      if (authState.isAuthenticated) {
        try {
          const authService = new AuthService({ state: authState } as any);
          const apiClient = new ApiClient(
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
            authService
          );
          const cartService = new CartService(apiClient);

          await cartService.addToCart(cartItem);
          console.log("[ProductCard] Item added to backend cart");
        } catch (error) {
          console.warn(
            "[ProductCard] Failed to sync with backend cart:",
            error
          );
          // Don't show error to user as frontend cart was updated
        }
      }

      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Failed to add item to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <Image
            src={
              product.image ||
              "/placeholder.svg?height=300&width=300&query=product"
            }
            alt={product.name}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              ${product.price.toFixed(2)}
            </span>
            <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </Badge>
          </div>

          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAdding}
          className="w-full"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isAdding
            ? "Adding..."
            : product.stock === 0
            ? "Out of Stock"
            : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}
