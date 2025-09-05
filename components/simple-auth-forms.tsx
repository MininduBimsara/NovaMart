"use client";

import { useState, useEffect } from "react";
import { useDualAuth } from "@/lib/auth/dual-auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";

export function SimpleAuthForms() {
  const { state, signIn, switchAuthMode } = useDualAuth();
  const { authMode, isLoading } = state;
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsSigningIn(true);
    try {
      await signIn(email, password);
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAsgardeoSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
      // Don't show success toast here as Asgardeo will redirect
    } catch (error) {
      setIsSigningIn(false);
      toast({
        title: "Error",
        description: "Failed to sign in with Asgardeo",
        variant: "destructive",
      });
    }
  };

  const useDemoAccount = () => {
    setEmail("demo@example.com");
    setPassword("demo123");
  };

  const isAsgardeoConfigured = !!(
    process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID &&
    process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL
  );

  // Show loading if we're in the middle of authentication
  if (isLoading || isSigningIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-muted-foreground">
            {authMode === "asgardeo" && isSigningIn
              ? "Redirecting to Asgardeo..."
              : "Signing in..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome to E-Commerce App
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Auth Mode Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={authMode === "demo" ? "default" : "outline"}
              className="w-full"
              onClick={() => switchAuthMode("demo")}
              disabled={isSigningIn}
            >
              Demo Mode
            </Button>
            <Button
              variant={authMode === "asgardeo" ? "default" : "outline"}
              className="w-full"
              onClick={() => switchAuthMode("asgardeo")}
              disabled={!isAsgardeoConfigured || isSigningIn}
            >
              Asgardeo OIDC {!isAsgardeoConfigured && "(Not Configured)"}
            </Button>
          </CardContent>
        </Card>

        {authMode === "demo" ? (
          <Card>
            <CardHeader>
              <CardTitle>Demo Authentication</CardTitle>
              <CardDescription>
                Use demo credentials to preview the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDemoSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSigningIn}
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
                    disabled={isSigningIn}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSigningIn}>
                  {isSigningIn ? (
                    <>
                      <Loader />
                      <span className="ml-2">Signing in...</span>
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={useDemoAccount}
                  disabled={isSigningIn}
                >
                  Use Demo Account
                </Button>
              </form>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Demo Accounts:</strong>
                  <br />
                  demo@example.com / demo123
                  <br />
                  admin@example.com / admin123
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Asgardeo OIDC</CardTitle>
              <CardDescription>
                Sign in with your Asgardeo account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleAsgardeoSignIn}
                className="w-full"
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <>
                    <Loader />
                    <span className="ml-2">Redirecting...</span>
                  </>
                ) : (
                  "Sign in with Asgardeo"
                )}
              </Button>

              {!isAsgardeoConfigured && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Configuration Required:</strong> Please set up your
                    environment variables:
                    <br />
                    • NEXT_PUBLIC_ASGARDEO_CLIENT_ID
                    <br />• NEXT_PUBLIC_ASGARDEO_BASE_URL
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
