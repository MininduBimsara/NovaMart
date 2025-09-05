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
  const [authMode, setAuthMode] = useState<AuthMode>("demo"); // Default to demo
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  // Check for stored demo user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("demoUser");
    if (storedUser && authMode === "demo") {
      setDemoUser(JSON.parse(storedUser));
    }
  }, [authMode]);

  const demoSignIn = useCallback(async (email: string, password: string) => {
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
  }, []);

  const demoSignOut = useCallback(async () => {
    setDemoUser(null);
    localStorage.removeItem("demoUser");
  }, []);

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
        await asgardeoAuth.signIn();
      } else if (authMode === "asgardeo" && !isAsgardeoAvailable) {
        throw new Error(
          "Asgardeo is not configured. Please check your environment variables."
        );
      }
    },
    [authMode, demoSignIn, asgardeoAuth, isAsgardeoAvailable]
  );

  const signOut = useCallback(async () => {
    if (authMode === "demo") {
      await demoSignOut();
    } else if (authMode === "asgardeo" && isAsgardeoAvailable && asgardeoAuth) {
      await asgardeoAuth.signOut();
    }
  }, [authMode, demoSignOut, asgardeoAuth, isAsgardeoAvailable]);

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
    (mode: AuthMode) => {
      // Clear current auth state when switching
      if (authMode === "demo") {
        demoSignOut();
      } else if (isAsgardeoAvailable && asgardeoAuth?.state?.isAuthenticated) {
        asgardeoAuth.signOut();
      }
      setAuthMode(mode);
    },
    [authMode, demoSignOut, asgardeoAuth, isAsgardeoAvailable]
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
    signInRedirectURL: "http://localhost:3000",
    signOutRedirectURL: "http://localhost:3000",
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
