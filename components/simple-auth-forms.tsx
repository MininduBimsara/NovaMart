// components/simple-auth-forms.tsx - ENHANCED VERSION
"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

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

  const useAdminAccount = () => {
    setEmail("admin@ecommerce.com");
    setPassword("admin123");
  };

  const isAsgardeoConfigured = !!(
    process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID &&
    process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL
  );

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
            Choose your authentication method and sign in
          </p>
        </div>

        {/* Authentication Mode Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Authentication Method</CardTitle>
            <CardDescription className="text-center">
              Select how you want to authenticate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant={authMode === "demo" ? "default" : "outline"}
              className="w-full"
              onClick={() => switchAuthMode("demo")}
              disabled={isSigningIn}
            >
              <div className="flex items-center justify-between w-full">
                <span>Local Authentication</span>
                <Badge variant="secondary" className="text-xs">
                  Username/Password
                </Badge>
              </div>
            </Button>
            <Button
              variant={authMode === "asgardeo" ? "default" : "outline"}
              className="w-full"
              onClick={() => switchAuthMode("asgardeo")}
              disabled={!isAsgardeoConfigured || isSigningIn}
            >
              <div className="flex items-center justify-between w-full">
                <span>Asgardeo SSO</span>
                <Badge
                  variant={isAsgardeoConfigured ? "default" : "destructive"}
                  className="text-xs"
                >
                  {isAsgardeoConfigured ? "OAuth2" : "Not Configured"}
                </Badge>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Authentication Forms */}
        {authMode === "demo" ? (
          <Card>
            <CardHeader>
              <CardTitle>Local Authentication</CardTitle>
              <CardDescription>
                Sign in with your email and password or use demo accounts
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
                    placeholder="Enter your email"
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
                    placeholder="Enter your password"
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
              </form>

              <div className="mt-4 space-y-2">
                <div className="text-sm text-center text-gray-600">
                  Or use demo accounts:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={useDemoAccount}
                    disabled={isSigningIn}
                  >
                    Demo User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={useAdminAccount}
                    disabled={isSigningIn}
                  >
                    Admin User
                  </Button>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Demo Accounts:</strong>
                  <br />
                  <strong>User:</strong> demo@example.com / demo123
                  <br />
                  <strong>Admin:</strong> admin@ecommerce.com / admin123
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Asgardeo SSO Authentication</CardTitle>
              <CardDescription>
                Sign in with your Asgardeo account using OAuth2
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAsgardeoConfigured ? (
                <Button
                  onClick={handleAsgardeoSignIn}
                  className="w-full"
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <Loader />
                      <span className="ml-2">Redirecting to Asgardeo...</span>
                    </>
                  ) : (
                    "Sign in with Asgardeo"
                  )}
                </Button>
              ) : (
                <div className="text-center">
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Asgardeo Not Configured</strong>
                    </p>
                    <p className="text-xs text-yellow-700 mt-2">
                      Please set up your environment variables:
                      <br />
                      • NEXT_PUBLIC_ASGARDEO_CLIENT_ID
                      <br />• NEXT_PUBLIC_ASGARDEO_BASE_URL
                    </p>
                  </div>
                  <Button
                    onClick={() => switchAuthMode("demo")}
                    variant="outline"
                    className="w-full"
                  >
                    Use Local Authentication Instead
                  </Button>
                </div>
              )}

              {isAsgardeoConfigured && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Asgardeo Configuration:</strong> Ready
                    <br />
                    You will be redirected to Asgardeo for secure
                    authentication.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Debug Information */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>
              Auth Mode: <Badge variant="outline">{authMode}</Badge>
            </div>
            <div>
              Asgardeo:{" "}
              <Badge variant={isAsgardeoConfigured ? "default" : "destructive"}>
                {isAsgardeoConfigured ? "Configured" : "Not Configured"}
              </Badge>
            </div>
            <div>
              Backend API:{" "}
              <code className="bg-gray-100 px-1 rounded">
                {process.env.NEXT_PUBLIC_API_BASE_URL ||
                  "http://localhost:8080"}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
