// components/checkout-form.tsx
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
import { OrdersService } from "@/lib/services/orders-service";
import { CartService } from "@/lib/services/cart-service";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { Loader } from "@/components/ui/loader";

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

      const authService = new AuthService(authContext);
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );
      const ordersService = new OrdersService(apiClient);

      // Create order data for cart items
      const orderData = {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: finalTotal,
        deliveryDate: formData.deliveryDate!.toISOString(),
        deliveryTime: formData.deliveryTime,
        deliveryLocation: formData.deliveryLocation,
      };

      console.log("[CheckoutForm] Creating order with data:", orderData);

      // Create the order through the backend
      const createdOrder = await ordersService.createOrder(orderData);

      console.log(
        "[CheckoutForm] Order created successfully:",
        createdOrder.id
      );

      // Clear frontend cart
      clearCart();

      // Clear backend cart
      try {
        const cartService = new CartService(apiClient);
        await cartService.clearCart();
        console.log("[CheckoutForm] Backend cart cleared");
      } catch (error) {
        console.warn("[CheckoutForm] Failed to clear backend cart:", error);
      }

      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${createdOrder.id} has been confirmed.`,
      });

      router.push(`/orders?orderId=${createdOrder.id}`);
    } catch (error) {
      console.error("Checkout error:", error);

      toast({
        title: "Checkout Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error processing your order. Please try again.",
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
