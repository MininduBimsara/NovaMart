// components/purchase-form.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/date-picker";
import { Loader } from "@/components/ui/loader";
import { PurchaseService } from "@/lib/services/purchase-service";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import {
  sriLankaDistricts,
  deliveryTimes,
} from "@/lib/data/sri-lanka-districts";

const productOptions = [
  { value: "SMARTPHONE_X100", label: "Smartphone X100" },
  { value: "WIRELESS_HEADPHONES", label: "Wireless Headphones" },
  { value: "LAPTOP_PRO", label: "Laptop Pro 15" },
  { value: "TABLET_AIR", label: "Tablet Air 11" },
  { value: "SMART_WATCH", label: "Smart Watch Series 5" },
  { value: "BLUETOOTH_SPEAKER", label: "Bluetooth Speaker" },
  { value: "GAMING_CONSOLE", label: "Gaming Console X" },
  { value: "DIGITAL_CAMERA", label: "Digital Camera 4K" },
  { value: "POWER_BANK", label: "Power Bank 20000mAh" },
  { value: "WIRELESS_CHARGER", label: "Wireless Charger Pad" },
];

interface PurchaseFormProps {
  onSuccess?: (purchaseId: string) => void;
}

export function PurchaseForm({ onSuccess }: PurchaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    purchaseDate: null as Date | null,
    deliveryTime: "",
    deliveryLocation: "",
    productName: "",
    quantity: 1,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();
  const authContext = useAuthContext();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = "Please select a purchase date";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (formData.purchaseDate < today) {
        newErrors.purchaseDate = "Purchase date cannot be in the past";
      }
      if (formData.purchaseDate.getDay() === 0) {
        newErrors.purchaseDate = "Delivery is not available on Sundays";
      }
    }

    if (!formData.deliveryTime) {
      newErrors.deliveryTime = "Please select a delivery time";
    }

    if (!formData.deliveryLocation) {
      newErrors.deliveryLocation = "Please select a delivery location";
    }

    if (!formData.productName) {
      newErrors.productName = "Please select a product";
    }

    if (formData.quantity < 1 || formData.quantity > 100) {
      newErrors.quantity = "Quantity must be between 1 and 100";
    }

    if (formData.message && formData.message.length > 500) {
      newErrors.message = "Message cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[PurchaseForm] Starting purchase process");

      const authService = new AuthService(authContext);
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );
      const purchaseService = new PurchaseService(apiClient);

      // Create purchase data
      const purchaseData = {
        purchaseDate: formData.purchaseDate!,
        deliveryTime: formData.deliveryTime,
        deliveryLocation: formData.deliveryLocation,
        productName: formData.productName,
        quantity: formData.quantity,
        message: formData.message || undefined,
      };

      console.log("[PurchaseForm] Creating purchase with data:", purchaseData);

      // Create the purchase through the backend
      const createdPurchase = await purchaseService.createPurchase(
        purchaseData
      );

      console.log(
        "[PurchaseForm] Purchase created successfully:",
        createdPurchase.id
      );

      toast({
        title: "Purchase Order Placed Successfully!",
        description: `Your purchase order ${createdPurchase.id} has been confirmed.`,
      });

      // Call success callback or navigate to purchases page
      if (onSuccess) {
        onSuccess(createdPurchase.id);
      } else {
        router.push(`/purchases?purchaseId=${createdPurchase.id}`);
      }

      // Reset form
      setFormData({
        purchaseDate: null,
        deliveryTime: "",
        deliveryLocation: "",
        productName: "",
        quantity: 1,
        message: "",
      });
    } catch (error) {
      console.error("Purchase error:", error);

      toast({
        title: "Purchase Failed",
        description:
          error instanceof Error
            ? error.message
            : "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Purchase Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="productName">Product</Label>
          <Select
            value={formData.productName}
            onValueChange={(value) => updateFormData("productName", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {productOptions.map((product) => (
                <SelectItem key={product.value} value={product.value}>
                  {product.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.productName && (
            <p className="text-sm text-destructive">{errors.productName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={formData.quantity}
            onChange={(e) =>
              updateFormData("quantity", parseInt(e.target.value) || 1)
            }
            disabled={isSubmitting}
            placeholder="Enter quantity"
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Purchase Date</Label>
          <DatePicker
            value={formData.purchaseDate}
            onChange={(date) => updateFormData("purchaseDate", date)}
            placeholder="Select purchase date"
            disabled={isSubmitting}
          />
          {errors.purchaseDate && (
            <p className="text-sm text-destructive">{errors.purchaseDate}</p>
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

        <div className="space-y-2">
          <Label htmlFor="message">Message (Optional)</Label>
          <textarea
            id="message"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter any special instructions or notes..."
            value={formData.message}
            onChange={(e) => updateFormData("message", e.target.value)}
            disabled={isSubmitting}
            maxLength={500}
          />
          {errors.message && (
            <p className="text-sm text-destructive">{errors.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.message.length}/500 characters
          </p>
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
              <span className="ml-2">Processing Purchase...</span>
            </div>
          ) : (
            "Create Purchase Order"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
