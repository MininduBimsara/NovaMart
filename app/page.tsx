// app/page.tsx
"use client";

import { useDualAuth } from "@/lib/auth/dual-auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SimpleAuthForms } from "@/components/simple-auth-forms";
import { Loader } from "@/components/ui/loader";

export default function HomePage() {
  const { state } = useDualAuth();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
          <p className="text-gray-600">You are successfully authenticated.</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/products")}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </button>
            <button
              onClick={() => router.push("/orders")}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              View Orders
            </button>
            <button
              onClick={() => router.push("/purchases")}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Create Purchase Orders
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <SimpleAuthForms />;
}
