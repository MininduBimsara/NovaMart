"use client";

import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { Loader } from "@/components/ui/loader";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading, authMode } = state;
  const router = useRouter();

  useEffect(() => {
    // Redirect to home if not authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      console.log("[AuthGuard] User not authenticated, redirecting to home");
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-muted-foreground">
            {authMode === "asgardeo"
              ? "Verifying authentication..."
              : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Authentication Required
          </h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to continue...
          </p>
          <div className="text-center">
            <Loader />
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
