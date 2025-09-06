// components/checkout-form.tsx - FIXED VERSION
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/lib/stores/cart-store";
import { DatePicker } from "@/components/date-picker";
import {
  sriLankaDistricts,
  deliveryTimes,
} from "@/lib/data/sri-lanka-districts";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { Loader } from "@/components/ui/loader";

// Backend DTO format that matches Spring Boot OrderDTO
interface OrderDTO {
  userId?: string; // Will be set by backend from JWT
  items: OrderItemDTO[];
  totalAmount: number;
  status?: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELED";
}

interface OrderItemDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export function CheckoutForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deliveryDate: null as Date | null,
    deliveryTime: "",
    deliveryLocation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { toast } = useToast();
  const router = useRouter();
  const authContext = useAuthContext();

  const totalPrice = getTotalPrice();
  const shipping = totalPrice > 100 ? 0 : 9.99;
  const tax = totalPrice * 0.08;
  const finalTotal = totalPrice + shipping + tax;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.deliveryDate) {
      newErrors.deliveryDate = "Please select a delivery date";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (formData.deliveryDate < today) {
        newErrors.deliveryDate = "Delivery date cannot be in the past";
      }
      if (formData.deliveryDate.getDay() === 0) {
        newErrors.deliveryDate = "Delivery is not available on Sundays";
      }
    }

    if (!formData.deliveryTime) {
      newErrors.deliveryTime = "Please select a delivery time";
    }

    if (!formData.deliveryLocation) {
      newErrors.deliveryLocation = "Please select a delivery location";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[CheckoutForm] Starting checkout process for cart order");
      console.log("[CheckoutForm] Auth state:", {
        isAuthenticated: authContext.state.isAuthenticated,
        username: authContext.state.username,
        authMode: authContext.state.authMode,
      });

      const authService = new AuthService(authContext);
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );

      // Create order data matching backend OrderDTO exactly
      const orderData: OrderDTO = {
        // Don't set userId - let backend extract from JWT
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price, // Use the exact price from cart
        })),
        totalAmount: finalTotal, // Include shipping and tax
        status: "PENDING" as const,
      };

      console.log(
        "[CheckoutForm] Creating order with exact DTO format:",
        orderData
      );

      // Create the order through the backend
      const response = await apiClient.post<any>("/api/orders", orderData);

      console.log("[CheckoutForm] Order created successfully:", response);

      // Clear frontend cart
      clearCart();

      // Clear backend cart if available
      try {
        await apiClient.delete("/api/cart/clear");
        console.log("[CheckoutForm] Backend cart cleared");
      } catch (error) {
        console.warn("[CheckoutForm] Failed to clear backend cart:", error);
        // Don't throw error for this
      }

      toast({
        title: "Order Placed Successfully!",
        description: `Your order has been confirmed and will be delivered to ${formData.deliveryLocation}.`,
      });

      // Navigate to orders page
      router.push(`/orders${response.id ? `?orderId=${response.id}` : ""}`);
    } catch (error) {
      console.error("Checkout error:", error);

      let errorMessage =
        "There was an error processing your order. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("403")) {
          errorMessage =
            "Authentication failed. Please sign in again and try again.";
          // Redirect to login if authentication failed
          router.push("/");
          return;
        } else if (error.message.includes("400")) {
          errorMessage =
            "Invalid order data. Please check your cart items and try again.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        }
      }

      toast({
        title: "Checkout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts interacting
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">
            Add some items to your cart before checkout.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/products")} className="w-full">
              Continue Shopping
            </Button>
            <Button
              onClick={() => router.push("/purchases")}
              variant="outline"
              className="w-full"
            >
              Or Create a Purchase Order
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cart Checkout - Delivery Information</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete your cart order by providing delivery details
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Delivery Date</Label>
          <DatePicker
            value={formData.deliveryDate}
            onChange={(date) => updateFormData("deliveryDate", date)}
            placeholder="Select delivery date"
            disabled={isSubmitting}
          />
          {errors.deliveryDate && (
            <p className="text-sm text-destructive">{errors.deliveryDate}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Note: Delivery is not available on Sundays
          </p>
        </div>

        <div className="space-y-2">
          <Label>Delivery Time</Label>
          <Select
            value={formData.deliveryTime}
            onValueChange={(value) => updateFormData("deliveryTime", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select delivery time" />
            </SelectTrigger>
            <SelectContent>
              {deliveryTimes.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.deliveryTime && (
            <p className="text-sm text-destructive">{errors.deliveryTime}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Delivery Location (District)</Label>
          <Select
            value={formData.deliveryLocation}
            onValueChange={(value) => updateFormData("deliveryLocation", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {sriLankaDistricts.map((district) => (
                <SelectItem key={district} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.deliveryLocation && (
            <p className="text-sm text-destructive">
              {errors.deliveryLocation}
            </p>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total:</span>
              <span>${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <Loader />
              <span className="ml-2">Processing Order...</span>
            </div>
          ) : (
            `Confirm Order - $${finalTotal.toFixed(2)}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
