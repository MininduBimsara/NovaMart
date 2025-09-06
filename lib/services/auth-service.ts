// lib/services/auth-service.ts - FIXED VERSION
import type { AuthContextInterface } from "@asgardeo/auth-react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  username?: string;
  displayName?: string;
  email?: string;
  authMode?: string;
}

export class AuthService {
  private authContext: AuthContextInterface | { state: AuthState };

  constructor(authContext: AuthContextInterface | { state: AuthState }) {
    this.authContext = authContext;
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

  async getAccessToken(): Promise<string | null> {
    try {
      const state = this.authContext.state;

      // Debug logging
      console.log("[AuthService] Getting access token...");
      console.log("[AuthService] Auth state:", {
        isAuthenticated: state.isAuthenticated,
        authMode: state.authMode,
        username: state.username,
      });

      // For Asgardeo mode
      if (
        "getAccessToken" in this.authContext &&
        state.authMode === "asgardeo"
      ) {
        console.log("[AuthService] Using Asgardeo getAccessToken");
        const token = await this.authContext.getAccessToken();
        console.log(
          "[AuthService] Asgardeo token obtained:",
          token ? "Yes" : "No"
        );
        return token;
      }

      // For demo mode or when Asgardeo token is not available
      if (this.isAuthenticated()) {
        console.log("[AuthService] Using demo/local token");

        // Create a simple JWT-like token for demo mode
        const userData = this.getUserProfile();
        if (userData && userData.username) {
          // Create a base64 encoded token with user info
          const payload = {
            sub: userData.username,
            username: userData.username,
            email: userData.email || userData.username,
            name: userData.name || userData.username,
            roles: ["USER"], // Default role
            authorities: ["ROLE_USER"],
            groups: ["USER"],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
            type: "DEMO_TOKEN",
          };

          // Simple token format (not secure, only for demo)
          const token = btoa(
            JSON.stringify({
              header: { alg: "HS256", typ: "JWT" },
              payload: payload,
              signature: "demo-signature",
            })
          );

          console.log("[AuthService] Demo token created");
          return `demo.${token}.signature`;
        }
      }

      console.log("[AuthService] No token available");
      return null;
    } catch (error) {
      console.error("Failed to get access token:", error);
      return null;
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
