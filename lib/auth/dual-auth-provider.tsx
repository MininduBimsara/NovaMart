// lib/auth/dual-auth-provider.tsx - ENHANCED WITH BETTER ERROR HANDLING
"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { AuthProvider as AsgardeoAuthProvider } from "@asgardeo/auth-react";
import { useAuthContext as useAsgardeoAuth } from "@asgardeo/auth-react";
import { useRouter } from "next/navigation";

type AuthMode = "asgardeo" | "demo";

interface DemoUser {
  id: string;
  email: string;
  name: string;
  displayName: string;
}

interface DualAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: DemoUser | null;
  username?: string;
  displayName?: string;
  email?: string;
  authMode: AuthMode;
  accessToken?: string;
}

interface DualAuthContextType {
  state: DualAuthState;
  signIn: (email?: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchAuthMode: (mode: AuthMode) => void;
  getAccessToken: () => Promise<string | null>;
}

const DualAuthContext = createContext<DualAuthContextType | null>(null);

function AsgardeoAuthWrapper({ children }: { children: React.ReactNode }) {
  const asgardeoAuth = useAsgardeoAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("demo");
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  // Check for stored data on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("demoUser");
    const storedAuthMode = localStorage.getItem("authMode") as AuthMode;
    const storedDemoToken = localStorage.getItem("demoToken");

    console.log("=== INITIALIZING AUTH STATE ===");
    console.log("Stored auth mode:", storedAuthMode);
    console.log("Stored user:", !!storedUser);
    console.log("Stored token:", !!storedDemoToken);

    if (storedAuthMode) {
      setAuthMode(storedAuthMode);
    }

    if (storedUser && (storedAuthMode === "demo" || authMode === "demo")) {
      try {
        const user = JSON.parse(storedUser);
        setDemoUser(user);
        console.log("Restored demo user:", user.email);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("demoUser");
      }
    }

    if (storedDemoToken) {
      setDemoToken(storedDemoToken);
      console.log("Restored demo token");
    }
  }, [authMode]);

  // Handle Asgardeo authentication state changes
  useEffect(() => {
    if (
      authMode === "asgardeo" &&
      asgardeoAuth?.state?.isAuthenticated &&
      !asgardeoAuth?.state?.isLoading &&
      !hasRedirected
    ) {
      console.log("[DualAuth] Asgardeo authentication successful");
      setHasRedirected(true);
      router.push("/products");
    }
  }, [
    asgardeoAuth?.state?.isAuthenticated,
    asgardeoAuth?.state?.isLoading,
    authMode,
    hasRedirected,
    router,
  ]);

  const demoSignIn = useCallback(
    async (email: string, password: string) => {
      setDemoLoading(true);
      console.log("=== DEMO SIGN IN ===");
      console.log("Attempting login for:", email);

      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
        console.log("API URL:", apiUrl);

        const response = await fetch(`${apiUrl}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: email,
            password: password,
          }),
        });

        console.log("Login response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Login failed:", errorText);
          throw new Error(`Login failed: ${response.status}`);
        }

        const loginData = await response.json();
        console.log("Login successful:", {
          username: loginData.username,
          hasToken: !!loginData.token,
          tokenType: loginData.tokenType,
        });

        // Store demo user and token
        const demoUser = {
          id: loginData.username || email,
          email: loginData.email || email,
          name: loginData.name || "Demo User",
          displayName: loginData.name || "Demo User",
        };

        setDemoUser(demoUser);
        setDemoToken(loginData.token);

        // Persist to localStorage
        localStorage.setItem("demoUser", JSON.stringify(demoUser));
        localStorage.setItem("demoToken", loginData.token);
        localStorage.setItem("authMode", "demo");

        console.log("Demo login completed successfully");

        setDemoLoading(false);
        router.push("/products");
      } catch (error) {
        setDemoLoading(false);
        console.error("[DualAuth] Demo login failed:", error);
        throw new Error("Invalid credentials or server error");
      }
    },
    [router]
  );

  const demoSignOut = useCallback(async () => {
    console.log("=== DEMO SIGN OUT ===");
    setDemoUser(null);
    setDemoToken(null);
    localStorage.removeItem("demoUser");
    localStorage.removeItem("demoToken");
    localStorage.removeItem("authMode");
    router.push("/");
  }, [router]);

  const isAsgardeoAvailable =
    !!process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID &&
    !!process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL;

  const signIn = useCallback(
    async (email?: string, password?: string) => {
      if (authMode === "demo" && email && password) {
        await demoSignIn(email, password);
      } else if (
        authMode === "asgardeo" &&
        isAsgardeoAvailable &&
        asgardeoAuth
      ) {
        try {
          console.log("[DualAuth] Initiating Asgardeo sign in");
          await asgardeoAuth.signIn();
        } catch (error) {
          console.error("[DualAuth] Asgardeo sign in failed:", error);
          throw error;
        }
      } else if (authMode === "asgardeo" && !isAsgardeoAvailable) {
        throw new Error(
          "Asgardeo is not configured. Please check your environment variables."
        );
      }
    },
    [authMode, demoSignIn, asgardeoAuth, isAsgardeoAvailable]
  );

  const signOut = useCallback(async () => {
    try {
      if (authMode === "demo") {
        await demoSignOut();
      } else if (
        authMode === "asgardeo" &&
        isAsgardeoAvailable &&
        asgardeoAuth
      ) {
        console.log("[DualAuth] Initiating Asgardeo sign out");
        setHasRedirected(false);
        await asgardeoAuth.signOut();
      }
    } catch (error) {
      console.error("[DualAuth] Sign out failed:", error);
      router.push("/");
    }
  }, [authMode, demoSignOut, asgardeoAuth, isAsgardeoAvailable, router]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    console.log("[DualAuth] Getting access token for mode:", authMode);

    if (
      authMode === "asgardeo" &&
      isAsgardeoAvailable &&
      asgardeoAuth?.state?.isAuthenticated
    ) {
      try {
        const token = await asgardeoAuth.getAccessToken();
        console.log("[DualAuth] Asgardeo token obtained:", !!token);
        return token;
      } catch (error) {
        console.error("[DualAuth] Failed to get Asgardeo access token:", error);
        return null;
      }
    }

    // For demo mode, return stored token
    if (authMode === "demo" && demoUser) {
      if (demoToken) {
        console.log("[DualAuth] Demo token from state:", !!demoToken);
        return demoToken;
      }

      const storedToken = localStorage.getItem("demoToken");
      if (storedToken) {
        console.log("[DualAuth] Demo token from storage:", !!storedToken);
        setDemoToken(storedToken); // Update state
        return storedToken;
      }
    }

    console.log("[DualAuth] No token available");
    return null;
  }, [authMode, asgardeoAuth, isAsgardeoAvailable, demoUser, demoToken]);

  const switchAuthMode = useCallback(
    async (mode: AuthMode) => {
      console.log("[DualAuth] Switching auth mode to:", mode);

      // Clear current auth state when switching
      if (authMode === "demo") {
        setDemoUser(null);
        setDemoToken(null);
        localStorage.removeItem("demoUser");
        localStorage.removeItem("demoToken");
      } else if (isAsgardeoAvailable && asgardeoAuth?.state?.isAuthenticated) {
        try {
          await asgardeoAuth.signOut();
        } catch (error) {
          console.error("Failed to sign out from Asgardeo:", error);
        }
      }

      setHasRedirected(false);
      setAuthMode(mode);
      localStorage.setItem("authMode", mode);
    },
    [authMode, asgardeoAuth, isAsgardeoAvailable]
  );

  const state = useMemo(
    (): DualAuthState => ({
      authMode,
      isAuthenticated:
        authMode === "demo"
          ? !!demoUser && !!demoToken
          : !!(isAsgardeoAvailable && asgardeoAuth?.state?.isAuthenticated),
      isLoading:
        authMode === "demo"
          ? demoLoading
          : !!(isAsgardeoAvailable && asgardeoAuth?.state?.isLoading),
      user: authMode === "demo" ? demoUser : null,
      username:
        authMode === "asgardeo" && isAsgardeoAvailable
          ? asgardeoAuth?.state?.username
          : demoUser?.email,
      displayName:
        authMode === "asgardeo" && isAsgardeoAvailable
          ? asgardeoAuth?.state?.displayName
          : demoUser?.displayName,
      email:
        authMode === "asgardeo" && isAsgardeoAvailable
          ? asgardeoAuth?.state?.email
          : demoUser?.email,
      accessToken: authMode === "demo" ? demoToken || undefined : undefined,
    }),
    [
      authMode,
      demoUser,
      demoLoading,
      asgardeoAuth,
      isAsgardeoAvailable,
      demoToken,
    ]
  );

  const contextValue = useMemo(
    (): DualAuthContextType => ({
      state,
      signIn,
      signOut,
      switchAuthMode,
      getAccessToken,
    }),
    [state, signIn, signOut, switchAuthMode, getAccessToken]
  );

  return (
    <DualAuthContext.Provider value={contextValue}>
      {children}
    </DualAuthContext.Provider>
  );
}

export function DualAuthProvider({ children }: { children: React.ReactNode }) {
  const asgardeoConfig = {
    signInRedirectURL:
      process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL ||
      "http://localhost:3000",
    signOutRedirectURL:
      process.env.NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL ||
      "http://localhost:3000",
    clientID: process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID || "",
    baseUrl: process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "",
    scope: ["openid", "profile", "email"],
    resourceServerURLs: [
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080",
    ],
    enablePKCE: true,
    storage: "sessionStorage",
  };

  return (
    <AsgardeoAuthProvider config={asgardeoConfig}>
      <AsgardeoAuthWrapper>{children}</AsgardeoAuthWrapper>
    </AsgardeoAuthProvider>
  );
}

export function useDualAuth() {
  const context = useContext(DualAuthContext);
  if (!context) {
    throw new Error("useDualAuth must be used within a DualAuthProvider");
  }
  return context;
}

export function useAuthContext() {
  return useDualAuth();
}
