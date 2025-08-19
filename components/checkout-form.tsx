"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCartStore } from "@/lib/stores/cart-store"
import { DatePicker } from "@/components/date-picker"
import { sriLankaDistricts, deliveryTimes } from "@/lib/data/sri-lanka-districts"
import { CartService } from "@/lib/services/cart-service"
import { ApiClient } from "@/lib/services/api-client"
import { AuthService } from "@/lib/services/auth-service"
import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import { Loader } from "@/components/ui/loader"

const checkoutSchema = z.object({
  deliveryDate: z.date({
    required_error: "Please select a delivery date",
  }),
  deliveryTime: z.string({
    required_error: "Please select a delivery time",
  }),
  deliveryLocation: z.string({
    required_error: "Please select a delivery location",
  }),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { items, clearCart, getTotalPrice } = useCartStore()
  const { toast } = useToast()
  const router = useRouter()
  const authContext = useAuthContext()

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  const totalPrice = getTotalPrice()
  const shipping = totalPrice > 100 ? 0 : 9.99
  const tax = totalPrice * 0.08
  const finalTotal = totalPrice + shipping + tax

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const authService = new AuthService(authContext)
      const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || "", authService)
      const cartService = new CartService(apiClient)

      const checkoutData = {
        items,
        deliveryDate: data.deliveryDate.toISOString(),
        deliveryTime: data.deliveryTime,
        deliveryLocation: data.deliveryLocation,
        totalAmount: finalTotal,
      }

      const response = await cartService.checkout(checkoutData)

      if (response.status === "success") {
        clearCart()
        toast({
          title: "Order Placed Successfully!",
          description: `Your order ${response.orderId} has been confirmed.`,
        })
        router.push(`/orders?orderId=${response.orderId}`)
      } else {
        throw new Error(response.message || "Checkout failed")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground mb-4">Add some items to your cart before checkout.</p>
          <Button onClick={() => router.push("/products")}>Continue Shopping</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="deliveryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select delivery date"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Note: Delivery is not available on Sundays</p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Time</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {deliveryTimes.map((time) => (
                        <SelectItem key={time.value} value={time.value}>
                          {time.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Location (District)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sriLankaDistricts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader />
                  <span className="ml-2">Processing Order...</span>
                </>
              ) : (
                `Confirm Order - $${finalTotal.toFixed(2)}`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
