"use client"

import type React from "react"

import { useState } from "react"
import { useDualAuth } from "@/lib/auth/dual-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { AuthModeSelector } from "./auth-mode-selector"


export function DualAuthForms() {
  const { state, signIn } = useDualAuth()
  const { authMode, isLoading } = state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      toast({
        title: "Success",
        description: "Signed in successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      })
    }
  }

  const handleAsgardeoSignIn = async () => {
    try {
      await signIn()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Asgardeo",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome to E-Commerce App</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to access your account</p>
        </div>

        <AuthModeSelector />

        {authMode === "demo" ? (
          <Card>
            <CardHeader>
              <CardTitle>Demo Authentication</CardTitle>
              <CardDescription>Use demo credentials to preview the application</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="demo">Demo Account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleDemoSignIn} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="demo" className="space-y-4">
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>
                      <strong>Demo Account:</strong>
                    </p>
                    <p>Email: demo@example.com</p>
                    <p>Password: demo123</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEmail("demo@example.com")
                      setPassword("demo123")
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Use Demo Credentials
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Asgardeo OIDC</CardTitle>
              <CardDescription>Sign in with your Asgardeo account</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleAsgardeoSignIn} className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in with Asgardeo"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
