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
}

interface DualAuthContextType {
  state: DualAuthState;
  signIn: (email?: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchAuthMode: (mode: AuthMode) => void;
  getAccessToken: () => Promise<string | null>;
}

const DualAuthContext = createContext<DualAuthContextType | null>(null);

// Demo users for testing
const DEMO_USERS = [
  {
    id: "1",
    email: "demo@example.com",
    password: "demo123",
    name: "Demo User",
    displayName: "Demo User",
  },
  {
    id: "2",
    email: "admin@example.com",
    password: "admin123",
    name: "Admin User",
    displayName: "Admin User",
  },
];

function AsgardeoAuthWrapper({ children }: { children: React.ReactNode }) {
  const asgardeoAuth = useAsgardeoAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("demo"); // Default to demo
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Check for stored demo user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("demoUser");
    const storedAuthMode = localStorage.getItem("authMode") as AuthMode;

    if (storedAuthMode) {
      setAuthMode(storedAuthMode);
    }

    if (storedUser && (storedAuthMode === "demo" || authMode === "demo")) {
      setDemoUser(JSON.parse(storedUser));
    }
  }, [authMode]);

  // Handle Asgardeo authentication state changes and redirect
  useEffect(() => {
    if (
      authMode === "asgardeo" &&
      asgardeoAuth?.state?.isAuthenticated &&
      !asgardeoAuth?.state?.isLoading &&
      !hasRedirected
    ) {
      console.log(
        "[DualAuth] Asgardeo authentication successful, redirecting to products"
      );
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

  // Reset redirect flag when auth state changes
  useEffect(() => {
    if (!asgardeoAuth?.state?.isAuthenticated) {
      setHasRedirected(false);
    }
  }, [asgardeoAuth?.state?.isAuthenticated]);

  const demoSignIn = useCallback(
    async (email: string, password: string) => {
      setDemoLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const user = DEMO_USERS.find(
        (u) => u.email === email && u.password === password
      );
      if (!user) {
        setDemoLoading(false);
        throw new Error("Invalid credentials");
      }

      const demoUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        displayName: user.displayName,
      };
      setDemoUser(demoUser);
      localStorage.setItem("demoUser", JSON.stringify(demoUser));
      setDemoLoading(false);

      // Redirect after demo login
      router.push("/products");
    },
    [router]
  );

  const demoSignOut = useCallback(async () => {
    setDemoUser(null);
    localStorage.removeItem("demoUser");
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
      // Still redirect to home even if signOut fails
      router.push("/");
    }
  }, [authMode, demoSignOut, asgardeoAuth, isAsgardeoAvailable, router]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (
      authMode === "asgardeo" &&
      isAsgardeoAvailable &&
      asgardeoAuth?.state?.isAuthenticated
    ) {
      try {
        return await asgardeoAuth.getAccessToken();
      } catch (error) {
        console.error("Failed to get Asgardeo access token:", error);
        return null;
      }
    }

    // For demo mode, return a mock token if authenticated
    if (authMode === "demo" && demoUser) {
      return `demo-token-${demoUser.id}-${Date.now()}`;
    }

    return null;
  }, [authMode, asgardeoAuth, isAsgardeoAvailable, demoUser]);

  const switchAuthMode = useCallback(
    async (mode: AuthMode) => {
      console.log("[DualAuth] Switching auth mode to:", mode);

      // Clear current auth state when switching
      if (authMode === "demo") {
        setDemoUser(null);
        localStorage.removeItem("demoUser");
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
          ? !!demoUser
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
    }),
    [authMode, demoUser, demoLoading, asgardeoAuth, isAsgardeoAvailable]
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

// Compatibility hook for existing components
export function useAuthContext() {
  return useDualAuth();
}
