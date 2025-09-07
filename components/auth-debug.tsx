// components/auth-debug.tsx - DEBUG COMPONENT FOR TROUBLESHOOTING
"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { AuthService } from "@/lib/services/auth-service";
import { ApiClient } from "@/lib/services/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AuthDebugPanel() {
  const authContext = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runAuthTests = async () => {
    setTesting(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      authState: authContext.state,
      tests: {},
    };

    try {
      console.log("=== RUNNING AUTH DEBUG TESTS ===");

      // Test 1: Check auth service token
      const authService = new AuthService(authContext);
      console.log("Test 1: Auth Service Token");
      const token = await authService.getAccessToken();
      results.tests.authServiceToken = {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenStart: token?.substring(0, 20) || "No token",
      };

      // Test 2: Validate token structure
      if (token) {
        console.log("Test 2: Token Structure");
        try {
          const parts = token.split(".");
          if (parts.length === 3) {
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));

            results.tests.tokenStructure = {
              valid: true,
              algorithm: header.alg,
              type: header.typ,
              issuer: payload.iss,
              audience: payload.aud,
              subject: payload.sub,
              expires: new Date(payload.exp * 1000).toISOString(),
              scopes: payload.scope,
              groups: payload.groups,
              roles: payload.roles,
              isExpired: payload.exp < Date.now() / 1000,
            };
          } else {
            results.tests.tokenStructure = {
              valid: false,
              error: "Invalid JWT structure",
            };
          }
        } catch (error) {
          results.tests.tokenStructure = { valid: false, error: error.message };
        }
      }

      // Test 3: Test API call
      console.log("Test 3: API Call");
      try {
        const apiClient = new ApiClient(
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
          authService
        );

        // Try to fetch user profile
        const profile = await apiClient.get("/api/users/profile");
        results.tests.apiCall = { success: true, profile };
      } catch (apiError) {
        results.tests.apiCall = {
          success: false,
          error: apiError.message,
          status: apiError.status,
        };
      }

      // Test 4: Test protected endpoint
      console.log("Test 4: Protected Endpoint");
      try {
        const apiClient = new ApiClient(
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
          authService
        );

        const orders = await apiClient.get("/api/orders");
        results.tests.protectedEndpoint = {
          success: true,
          orderCount: orders.length,
        };
      } catch (protectedError) {
        results.tests.protectedEndpoint = {
          success: false,
          error: protectedError.message,
          status: protectedError.status,
        };
      }

      setDebugInfo(results);
    } catch (error) {
      results.error = error.message;
      setDebugInfo(results);
    } finally {
      setTesting(false);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo(null);
  };

  if (!authContext.state.isAuthenticated) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <p className="text-yellow-800">
            🔒 Please sign in to use the debug panel
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          🔍 Authentication Debug Panel
          <Badge variant="outline" className="text-xs">
            {authContext.state.authMode.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Auth Mode:</strong> {authContext.state.authMode}
          </div>
          <div>
            <strong>Loading:</strong>{" "}
            {authContext.state.isLoading ? "Yes" : "No"}
          </div>
          <div>
            <strong>Username:</strong> {authContext.state.username || "None"}
          </div>
          <div>
            <strong>Email:</strong> {authContext.state.email || "None"}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={runAuthTests}
            disabled={testing}
            className="flex-1"
            variant="outline"
          >
            {testing ? "Running Tests..." : "🧪 Run Auth Tests"}
          </Button>
          {debugInfo && (
            <Button onClick={clearDebugInfo} variant="ghost" size="sm">
              Clear
            </Button>
          )}
        </div>

        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
            <div className="flex justify-between items-center mb-2">
              <strong>Debug Results:</strong>
              <Badge
                variant={
                  debugInfo.tests?.protectedEndpoint?.success
                    ? "default"
                    : "destructive"
                }
                className="text-xs"
              >
                {debugInfo.tests?.protectedEndpoint?.success
                  ? "✅ API Working"
                  : "❌ API Failed"}
              </Badge>
            </div>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-blue-700 space-y-1">
          <strong>Quick Troubleshooting:</strong>
          <ul className="list-disc list-inside space-y-1">
            <li>Check if token is obtained successfully</li>
            <li>Verify token structure (JWT with 3 parts)</li>
            <li>Check if token is expired</li>
            <li>Test API calls to see specific error codes</li>
            <li>Look for CORS or authentication issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
