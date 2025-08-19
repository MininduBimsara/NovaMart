"use client"

import { useDualAuth } from "@/lib/auth/dual-auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthModeSelector() {
  const { state, switchAuthMode } = useDualAuth()
  const { authMode } = state

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader className="text-center">
        <CardTitle>Choose Authentication Method</CardTitle>
        <CardDescription>Select how you want to sign in to the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant={authMode === "demo" ? "default" : "outline"}
          className="w-full"
          onClick={() => switchAuthMode("demo")}
        >
          Demo Authentication
          <span className="text-xs ml-2">(Quick Preview)</span>
        </Button>
        <Button
          variant={authMode === "asgardeo" ? "default" : "outline"}
          className="w-full"
          onClick={() => switchAuthMode("asgardeo")}
        >
          Asgardeo OIDC
          <span className="text-xs ml-2">(Production)</span>
        </Button>
      </CardContent>
    </Card>
  )
}
