// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth/dual-auth-provider";
import { AuthGuard } from "@/lib/auth/auth-guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader } from "@/components/ui/loader";
import { ApiClient } from "@/lib/services/api-client";
import { AuthService } from "@/lib/services/auth-service";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

interface UserProfile {
  username: string;
  name?: string;
  email?: string;
  contactNumber?: string;
  country?: string;
  roles?: string[];
  emailVerified?: boolean;
  isAdmin?: boolean;
}

function ProfileContent() {
  const { state } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!state.isAuthenticated || state.authMode === "demo") {
        // For demo mode, use local state
        setProfile({
          username: state.username || "N/A",
          name: state.displayName || "N/A",
          email: state.email || "N/A",
          roles: ["USER"],
          emailVerified: true,
          isAdmin: false,
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const authService = new AuthService({ state } as any);
        const apiClient = new ApiClient(
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
          authService
        );

        console.log("[ProfilePage] Fetching user profile from backend...");
        const userProfile = await apiClient.get<UserProfile>(
          "/api/users/profile"
        );
        setProfile(userProfile);
        console.log("[ProfilePage] Profile loaded:", userProfile);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setError("Failed to load profile information");

        // Fallback to auth state
        setProfile({
          username: state.username || "N/A",
          name: state.displayName || "N/A",
          email: state.email || "N/A",
          roles: ["USER"],
          emailVerified: true,
          isAdmin: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [state]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader />
              <p className="mt-4 text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">User Profile</CardTitle>
            <CardDescription>
              Your account information
              {state.authMode === "demo" && (
                <Badge variant="outline" className="ml-2">
                  Demo Mode
                </Badge>
              )}
              {error && (
                <Badge variant="destructive" className="ml-2">
                  Backend Unavailable
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Username
                </label>
                <p className="text-lg">
                  {profile?.username || state.username || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Display Name
                </label>
                <p className="text-lg">
                  {profile?.name || state.displayName || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-lg">
                  {profile?.email || state.email || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Contact Number
                </label>
                <p className="text-lg">{profile?.contactNumber || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Country
                </label>
                <p className="text-lg">{profile?.country || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1 space-x-2">
                  <Badge variant="secondary">
                    {state.isAuthenticated
                      ? "Authenticated"
                      : "Not Authenticated"}
                  </Badge>
                  {profile?.emailVerified && (
                    <Badge variant="outline">Email Verified</Badge>
                  )}
                  {profile?.isAdmin && <Badge variant="default">Admin</Badge>}
                </div>
              </div>
            </div>

            {profile?.roles && profile.roles.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Roles
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <Badge key={role} variant="outline">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Authentication Method</h4>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    state.authMode === "asgardeo" ? "default" : "secondary"
                  }
                >
                  {state.authMode === "asgardeo"
                    ? "Asgardeo OIDC"
                    : "Demo Mode"}
                </Badge>
                {state.authMode === "asgardeo" && (
                  <span className="text-sm text-muted-foreground">
                    Connected to production identity provider
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
