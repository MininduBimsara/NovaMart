"use client"

import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader } from "@/components/ui/loader"

export default function LoginPage() {
  const { state, signIn } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (state.isAuthenticated) {
      router.push("/products")
    }
  }, [state.isAuthenticated, router])

  const handleLogin = async () => {
    try {
      await signIn()
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue shopping</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} className="w-full" size="lg">
            Sign In with Asgardeo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
