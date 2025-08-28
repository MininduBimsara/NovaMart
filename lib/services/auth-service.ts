// lib/services/auth-service.ts
import type { AuthContextInterface } from "@asgardeo/auth-react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  username?: string;
  displayName?: string;
  email?: string;
}

export class AuthService {
  private authContext: AuthContextInterface | { state: AuthState };

  constructor(authContext: AuthContextInterface | { state: AuthState }) {
    this.authContext = authContext;
  }

  async login() {
    try {
      // Check if it's an Asgardeo context with signIn method
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
      // Check if it's an Asgardeo context with signOut method
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
      // Check if it's an Asgardeo context with getAccessToken method
      if ("getAccessToken" in this.authContext) {
        return await this.authContext.getAccessToken();
      }

      // For demo mode, return a mock token
      if (this.isAuthenticated()) {
        return "demo-token-" + Date.now();
      }

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
          name: state.displayName || state.user?.name || "",
          email: state.email || state.user?.email || "",
          // Additional claims can be extracted from ID token
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

  // Helper method to get user ID for API calls
  getUserId(): string {
    const profile = this.getUserProfile();
    return profile?.username || "current-user";
  }
}
