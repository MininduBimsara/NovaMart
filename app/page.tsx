"use client";

import { useDualAuth } from "@/lib/auth/dual-auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SimpleAuthForms } from "@/components/simple-auth-forms";
import { Loader } from "@/components/ui/loader";

export default function HomePage() {
  const { state } = useDualAuth();
  const { isAuthenticated, isLoading, authMode } = state;
  const router = useRouter();

  // Handle redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("[HomePage] User is authenticated, redirecting to products");
      router.push("/products");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-muted-foreground">
            {authMode === "asgardeo"
              ? "Checking authentication..."
              : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Show authenticated state briefly before redirect
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="text-center">
            <Loader />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">Welcome!</h1>
            <p className="mt-2 text-gray-600">Redirecting you to products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show auth forms if not authenticated
  return <SimpleAuthForms />;
}
