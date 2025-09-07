// lib/services/auth-service.ts - ENHANCED FOR DUAL AUTH
import type { AuthContextInterface } from "@asgardeo/auth-react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  username?: string;
  displayName?: string;
  email?: string;
  authMode?: string;
  accessToken?: string;
}

export class AuthService {
  private authContext: AuthContextInterface | { state: AuthState };

  constructor(authContext: AuthContextInterface | { state: AuthState }) {
    this.authContext = authContext;
  }

  async getAccessToken(): Promise<string | null> {
    try {
      const state = this.authContext.state;

      console.log("=== AUTH SERVICE TOKEN RETRIEVAL ===");
      console.log("Auth mode:", state.authMode);
      console.log("Is authenticated:", state.isAuthenticated);
      console.log("Username:", state.username);

      // PRIORITY 1: For Asgardeo mode, get OAuth2 access token
      if (
        state.authMode === "asgardeo" &&
        "getAccessToken" in this.authContext
      ) {
        console.log("🔄 Getting Asgardeo access token...");
        try {
          const token = await this.authContext.getAccessToken();
          if (token) {
            console.log("✅ Asgardeo access token obtained");
            console.log(
              "Token type:",
              token.startsWith("eyJ") ? "JWT" : "Other"
            );
            console.log("Token length:", token.length);

            // Validate token structure
            const parts = token.split(".");
            if (parts.length === 3) {
              try {
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));

                console.log("✅ Token validation:");
                console.log("- Algorithm:", header.alg);
                console.log("- Issuer:", payload.iss);
                console.log("- Subject:", payload.sub);
                console.log("- Audience:", payload.aud);
                console.log(
                  "- Expires:",
                  new Date(payload.exp * 1000).toISOString()
                );
                console.log("- Scopes:", payload.scope);
                console.log("- Groups/Roles:", payload.groups || payload.roles);

                // Check if token is expired
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp && payload.exp < now) {
                  console.warn("⚠️ Token is expired!");
                  return null;
                }

                return token;
              } catch (parseError) {
                console.warn(
                  "⚠️ Could not parse token for validation:",
                  parseError
                );
                return token; // Return anyway, let backend validate
              }
            }

            return token;
          } else {
            console.warn("❌ Asgardeo getAccessToken returned null");
          }
        } catch (asgardeoError) {
          console.error("❌ Asgardeo getAccessToken failed:", asgardeoError);

          // FALLBACK: Try to get token from session storage
          try {
            const sessionData = sessionStorage.getItem("auth_context");
            if (sessionData) {
              const authData = JSON.parse(sessionData);
              if (authData.access_token) {
                console.log("🔄 Using fallback token from session storage");
                return authData.access_token;
              }
            }
          } catch (fallbackError) {
            console.warn("❌ Fallback token retrieval failed:", fallbackError);
          }
        }
      }

      // PRIORITY 2: For demo mode, use stored token
      if (state.authMode === "demo") {
        console.log("🔄 Demo mode - checking for stored token...");

        // Try auth state first
        if (state.accessToken) {
          console.log("✅ Demo token from auth state");
          return state.accessToken;
        }

        // Try localStorage
        const storedToken = localStorage.getItem("demoToken");
        if (storedToken) {
          console.log("✅ Demo token from localStorage");
          return storedToken;
        }
      }

      // PRIORITY 3: If authenticated but no token, this is an error
      if (state.isAuthenticated) {
        console.error(
          "❌ User is authenticated but no access token available!"
        );
        console.log("Auth context details:", {
          hasGetAccessToken: "getAccessToken" in this.authContext,
          authMode: state.authMode,
          hasUsername: !!state.username,
          hasEmail: !!state.email,
        });

        // For Asgardeo, retry once after a delay
        if (
          state.authMode === "asgardeo" &&
          "getAccessToken" in this.authContext
        ) {
          console.log("🔄 Retrying Asgardeo token retrieval...");
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const retryToken = await this.authContext.getAccessToken();
            if (retryToken) {
              console.log("✅ Asgardeo token obtained on retry");
              return retryToken;
            }
          } catch (retryError) {
            console.error("❌ Retry also failed:", retryError);
          }
        }
      }

      console.log("❌ No access token available");
      return null;
    } catch (error) {
      console.error("❌ Failed to get access token:", error);
      return null;
    }
  }

  async login() {
    try {
      if ("signIn" in this.authContext) {
        await this.authContext.signIn();
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async logout() {
    try {
      if ("signOut" in this.authContext) {
        await this.authContext.signOut();
      }
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  getUserProfile() {
    const state = this.authContext.state;
    return state.username || state.email
      ? {
          username: state.username || state.email,
          name: state.displayName || state.user?.name || state.username || "",
          email: state.email || state.user?.email || state.username || "",
        }
      : null;
  }

  getUsername(): string | undefined {
    const state = this.authContext.state;
    return state.username || state.email || state.user?.email;
  }

  isAuthenticated(): boolean {
    return this.authContext.state.isAuthenticated;
  }

  isLoading(): boolean {
    return this.authContext.state.isLoading;
  }

  getUserId(): string {
    const profile = this.getUserProfile();
    return profile?.username || "current-user";
  }

  getAuthMode(): string {
    return this.authContext.state.authMode || "demo";
  }
}
