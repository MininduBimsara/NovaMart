// lib/services/auth-service.ts - FIXED FOR ASGARDEO
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

      console.log("=== AUTH SERVICE TOKEN RETRIEVAL ===");
      console.log("Auth mode:", state.authMode);
      console.log("Is authenticated:", state.isAuthenticated);
      console.log("Username:", state.username);

      // PRIORITY 1: For Asgardeo mode, get OAuth2 token from the auth context
      if (
        state.authMode === "asgardeo" &&
        "getAccessToken" in this.authContext
      ) {
        console.log("Getting Asgardeo token...");
        try {
          const token = await this.authContext.getAccessToken();
          if (token) {
            console.log("✅ Asgardeo token obtained successfully");
            console.log(
              "Token type:",
              token.startsWith("eyJ") ? "JWT" : "Other"
            );
            console.log("Token length:", token.length);
            return token;
          } else {
            console.warn("❌ Asgardeo getAccessToken returned null/undefined");
          }
        } catch (asgardeoError) {
          console.error("❌ Asgardeo getAccessToken failed:", asgardeoError);
        }
      }

      // PRIORITY 2: For demo mode, use stored token
      if (state.authMode === "demo") {
        console.log("Demo mode - checking for stored token...");

        if (state.accessToken) {
          console.log("✅ Demo token from auth state");
          return state.accessToken;
        }

        const storedToken = localStorage.getItem("demoToken");
        if (storedToken) {
          console.log("✅ Demo token from localStorage");
          return storedToken;
        }
      }

      // PRIORITY 3: If user is authenticated but no token found, this is a problem
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

        // For Asgardeo, this might be a timing issue - try one more time
        if (
          state.authMode === "asgardeo" &&
          "getAccessToken" in this.authContext
        ) {
          console.log("Retrying Asgardeo token retrieval...");
          try {
            // Wait a moment and try again
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
