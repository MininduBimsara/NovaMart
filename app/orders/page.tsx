// app/orders/page.tsx - FIXED VERSION WITH BETTER REDIRECT HANDLING
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { AuthGuard } from "@/lib/auth/auth-guard";
import { OrderCard } from "@/components/order-card";
import { OrderFilters } from "@/components/order-filters";
import { Loader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { OrdersService } from "@/lib/services/orders-service";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";
import type { Order, OrderStatus } from "@/lib/types/order";
import { Package, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OrdersPage() {
  return (
    <AuthGuard>
      <OrdersContent />
    </AuthGuard>
  );
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    "all"
  );
  const { state: authState } = useAuthContext();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    console.log("=== ORDERS PAGE DEBUG ===");
    console.log("Loading orders...");
    console.log("Auth state:", {
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      username: authState.username,
    });

    if (!authState.isAuthenticated || authState.isLoading) {
      console.log("Skipping order load - not authenticated or still loading");
      return;
    }

    setLoading(true);
    try {
      const authService = new AuthService({ state: authState } as any);
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );
      const ordersService = new OrdersService(apiClient);

      console.log("Fetching orders from backend...");
      const fetchedOrders = await ordersService.getOrders();
      console.log(`Orders loaded successfully: ${fetchedOrders.length} orders`);

      setOrders(fetchedOrders);

      // Check for order creation success message
      const orderId = searchParams.get("orderId");
      if (orderId) {
        console.log("Order creation detected:", orderId);

        // Show success toast for new order
        toast({
          title: "🎉 Order Created Successfully!",
          description: `Your order #${orderId} has been placed and will be processed shortly.`,
        });

        // Optional: Scroll to the new order if it's in the list
        setTimeout(() => {
          const orderElement = document.querySelector(
            `[data-order-id="${orderId}"]`
          );
          if (orderElement) {
            orderElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast({
        title: "Error Loading Orders",
        description:
          "Could not load your orders. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [authState, searchParams, toast]);

  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      // Add small delay to ensure auth state is fully stable
      const timeoutId = setTimeout(() => {
        loadOrders();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [authState.isAuthenticated, authState.isLoading, loadOrders]);

  const handleOrderCancelled = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: "cancelled" as OrderStatus }
          : order
      )
    );

    toast({
      title: "Order Cancelled",
      description: "Your order has been cancelled successfully.",
    });
  };

  const filteredOrders = orders.filter(
    (order) => selectedStatus === "all" || order.status === selectedStatus
  );

  const orderCounts = orders.reduce(
    (counts, order) => {
      counts.all += 1;
      counts[order.status] += 1;
      return counts;
    },
    {
      all: 0,
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    } as Record<OrderStatus | "all", number>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Check if we just came from a successful checkout
  const orderId = searchParams.get("orderId");
  const isNewOrder = orderId && orders.some((order) => order.id === orderId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">My Orders</h1>
          {isNewOrder && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">New Order Created!</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          Track and manage your orders
          {orders.length > 0 && ` • ${orders.length} total orders`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <OrderFilters
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            orderCounts={orderCounts}
          />
        </div>

        <div className="lg:col-span-3">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {selectedStatus === "all"
                    ? "No orders found"
                    : `No ${selectedStatus} orders`}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {selectedStatus === "all"
                    ? "You haven't placed any orders yet. Start shopping to see your orders here!"
                    : `You don't have any ${selectedStatus} orders at the moment.`}
                </p>
                {selectedStatus === "all" && (
                  <div className="space-y-2">
                    <button
                      onClick={() => (window.location.href = "/products")}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredOrders
                .sort(
                  (a, b) =>
                    new Date(b.orderDate).getTime() -
                    new Date(a.orderDate).getTime()
                )
                .map((order) => (
                  <div
                    key={order.id}
                    data-order-id={order.id}
                    className={
                      isNewOrder && order.id === orderId
                        ? "ring-2 ring-green-500 ring-opacity-50 rounded-lg"
                        : ""
                    }
                  >
                    <OrderCard
                      order={order}
                      onOrderCancelled={handleOrderCancelled}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Success overlay for new orders */}
      {isNewOrder && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Order successfully created!</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
