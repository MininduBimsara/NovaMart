// components/asgardeo-debug.tsx - NEW DEBUG COMPONENT
"use client";

import { useState } from "react";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { AuthService } from "@/lib/services/auth-service";
import { ApiClient } from "@/lib/services/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AsgardeoDebug() {
  const authContext = useAuthContext();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runDebugTests = async () => {
    setTesting(true);
    const results: any = {
      timestamp: new Date().toISOString(),
      authState: authContext.state,
      tests: {},
    };

    try {
      // Test 1: Check auth service token
      const authService = new AuthService(authContext);
      console.log("=== DEBUG TEST 1: Auth Service Token ===");
      results.tests.authServiceToken = await authService.getAccessToken();

      // Test 2: Test API client headers
      console.log("=== DEBUG TEST 2: API Client Headers ===");
      const apiClient = new ApiClient(
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
        authService
      );

      // Try a simple GET request to see headers in network tab
      try {
        await apiClient.get("/api/products");
        results.tests.apiCall = "SUCCESS";
      } catch (error) {
        results.tests.apiCall = `FAILED: ${error}`;
      }

      // Test 3: Direct Asgardeo context check
      console.log("=== DEBUG TEST 3: Direct Asgardeo Check ===");
      if (
        "getAccessToken" in authContext &&
        authContext.state.authMode === "asgardeo"
      ) {
        try {
          const directToken = await (authContext as any).getAccessToken();
          results.tests.directAsgardeoToken = directToken
            ? "Token obtained"
            : "No token";
        } catch (error) {
          results.tests.directAsgardeoToken = `Error: ${error}`;
        }
      }

      setDebugInfo(results);
    } catch (error) {
      results.error = error;
      setDebugInfo(results);
    } finally {
      setTesting(false);
    }
  };

  if (authContext.state.authMode !== "asgardeo") {
    return null; // Only show for Asgardeo mode
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          🔍 Asgardeo Debug Panel
          <Badge variant="outline" className="text-xs">
            {authContext.state.isAuthenticated
              ? "Authenticated"
              : "Not Authenticated"}
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

        <Button
          onClick={runDebugTests}
          disabled={testing || !authContext.state.isAuthenticated}
          className="w-full"
          variant="outline"
        >
          {testing ? "Running Tests..." : "🔍 Run Debug Tests"}
        </Button>

        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-96">
            <strong>Debug Results:</strong>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}

        <div className="text-xs text-orange-700">
          <strong>Instructions:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Click "Run Debug Tests" after Asgardeo login</li>
            <li>Check browser console for detailed logs</li>
            <li>Check Network tab to see if Authorization header is sent</li>
            <li>Look for token validation errors in the results</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
