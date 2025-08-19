"use client"

import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import type { ReactNode } from "react"
import { Loader } from "@/components/ui/loader"

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { state } = useAuthContext()
  const { isAuthenticated, isLoading } = state

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to continue...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
