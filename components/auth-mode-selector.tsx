// components/auth-mode-selector.tsx
"use client";

import { useDualAuth } from "@/lib/auth/dual-auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AuthModeSelector() {
  const { state, switchAuthMode } = useDualAuth();
  const { authMode } = state;

  const isAsgardeoConfigured = !!(
    process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID &&
    process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL
  );

  return (
    <Card className="w-full max-w-md mx-auto mb-6">
      <CardHeader className="text-center">
        <CardTitle>Choose Authentication Method</CardTitle>
        <CardDescription>
          Select how you want to sign in to the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant={authMode === "asgardeo" ? "default" : "outline"}
          className="w-full"
          onClick={() => switchAuthMode("asgardeo")}
          disabled={!isAsgardeoConfigured}
        >
          <div className="flex items-center justify-between w-full">
            <span>Asgardeo OIDC</span>
            <div className="flex items-center gap-2">
              {isAsgardeoConfigured ? (
                <Badge variant="secondary" className="text-xs">
                  Production
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Not Configured
                </Badge>
              )}
            </div>
          </div>
        </Button>

        <Button
          variant={authMode === "demo" ? "default" : "outline"}
          className="w-full"
          onClick={() => switchAuthMode("demo")}
        >
          <div className="flex items-center justify-between w-full">
            <span>Demo Authentication</span>
            <Badge variant="outline" className="text-xs">
              Development
            </Badge>
          </div>
        </Button>

        {!isAsgardeoConfigured && (
          <div className="text-xs text-muted-foreground p-2 bg-yellow-50 rounded border border-yellow-200">
            <strong>Note:</strong> Asgardeo is not configured. Please set up
            your environment variables:
            <ul className="mt-1 ml-4 list-disc">
              <li>NEXT_PUBLIC_ASGARDEO_CLIENT_ID</li>
              <li>NEXT_PUBLIC_ASGARDEO_BASE_URL</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
