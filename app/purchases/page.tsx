// app/purchases/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "@/components/ui/loader";
import { PurchaseForm } from "@/components/purchase-form";
import { PurchaseService } from "@/lib/services/purchase-service";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";
import type { Purchase } from "@/lib/services/purchase-service";
import {
  Package,
  MapPin,
  Clock,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state } = useAuthContext();

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">Please sign in to continue...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PurchaseCard({ purchase }: { purchase: Purchase }) {
  const statusConfig = {
    PENDING: {
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      label: "Pending",
    },
    CONFIRMED: {
      color: "text-blue-600",
      bg: "bg-blue-100",
      label: "Confirmed",
    },
    PROCESSING: {
      color: "text-purple-600",
      bg: "bg-purple-100",
      label: "Processing",
    },
    SHIPPED: {
      color: "text-orange-600",
      bg: "bg-orange-100",
      label: "Shipped",
    },
    DELIVERED: {
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Delivered",
    },
    CANCELLED: { color: "text-red-600", bg: "bg-red-100", label: "Cancelled" },
  };

  const statusInfo =
    statusConfig[purchase.status as keyof typeof statusConfig] ||
    statusConfig.PENDING;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Purchase {purchase.id}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Created on{" "}
              {format(
                new Date(purchase.createdAt || purchase.purchaseDate),
                "PPP"
              )}
            </p>
          </div>
          <Badge className={`${statusInfo.bg} ${statusInfo.color} border-0`}>
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {purchase.productName.replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <span className="font-medium">{purchase.quantity}</span>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {format(new Date(purchase.purchaseDate), "MMM dd, yyyy")}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {purchase.deliveryTime === "10:00"
                  ? "10:00 AM"
                  : purchase.deliveryTime === "11:00"
                  ? "11:00 AM"
                  : "12:00 PM"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{purchase.deliveryLocation}</span>
            </div>

            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{purchase.username}</span>
            </div>
          </div>
        </div>

        {purchase.message && (
          <div className="border-t pt-3">
            <div className="flex items-start space-x-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-sm font-medium">Message:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {purchase.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PurchasesContent() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-purchases");
  const { state: authState } = useAuthContext();
  const searchParams = useSearchParams();

  const loadPurchases = useCallback(async () => {
    if (!authState.isAuthenticated || authState.isLoading) {
      return;
    }

    setLoading(true);
    try {
      console.log("[PurchasesPage] Loading purchases...");
      const authService = new AuthService({ state: authState } as any);
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );
      const purchaseService = new PurchaseService(apiClient);

      const fetchedPurchases = await purchaseService.getPurchasesByUsername();
      setPurchases(fetchedPurchases);
      console.log(
        "[PurchasesPage] Purchases loaded successfully:",
        fetchedPurchases.length
      );

      // Check if there's a specific purchase ID in the URL
      const purchaseId = searchParams.get("purchaseId");
      if (purchaseId) {
        console.log("[PurchasesPage] Purchase created:", purchaseId);
      }
    } catch (error) {
      console.error("Failed to load purchases:", error);
    } finally {
      setLoading(false);
    }
  }, [authState, searchParams]);

  useEffect(() => {
    if (authState.isAuthenticated && !authState.isLoading) {
      loadPurchases();
    }
  }, [authState.isAuthenticated, authState.isLoading, loadPurchases]);

  const handlePurchaseSuccess = (purchaseId: string) => {
    console.log("[PurchasesPage] Purchase created successfully:", purchaseId);
    // Reload purchases to show the new one
    loadPurchases();
    // Switch to the purchases tab
    setActiveTab("my-purchases");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Purchases</h1>
        <p className="text-muted-foreground">
          Manage your purchase orders and create new ones
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create-purchase">Create Purchase</TabsTrigger>
          <TabsTrigger value="my-purchases">
            My Purchases ({purchases.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create-purchase" className="mt-6">
          <PurchaseForm onSuccess={handlePurchaseSuccess} />
        </TabsContent>

        <TabsContent value="my-purchases" className="mt-6">
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No purchases found
                </h3>
                <p className="text-muted-foreground mb-6">
                  You haven't made any purchases yet. Create your first purchase
                  order!
                </p>
                <Button onClick={() => setActiveTab("create-purchase")}>
                  Create Purchase Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {purchases
                .sort(
                  (a, b) =>
                    new Date(b.createdAt || b.purchaseDate).getTime() -
                    new Date(a.createdAt || a.purchaseDate).getTime()
                )
                .map((purchase) => (
                  <PurchaseCard key={purchase.id} purchase={purchase} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PurchasesPage() {
  return (
    <AuthGuard>
      <PurchasesContent />
    </AuthGuard>
  );
}
