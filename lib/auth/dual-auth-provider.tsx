"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { AuthProvider as AsgardeoAuthProvider } from "@asgardeo/auth-react"
import { useAuthContext as useAsgardeoAuth } from "@asgardeo/auth-react"

type AuthMode = "asgardeo" | "demo"

interface DemoUser {
  id: string
  email: string
  name: string
  displayName: string
}

interface DualAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: DemoUser | null
  username?: string
  displayName?: string
  email?: string
  authMode: AuthMode
}

interface DualAuthContextType {
  state: DualAuthState
  signIn: (email?: string, password?: string) => Promise<void>
  signOut: () => Promise<void>
  switchAuthMode: (mode: AuthMode) => void
  getAccessToken: () => Promise<string | null>
}

const DualAuthContext = createContext<DualAuthContextType | null>(null)

// Demo users for testing
const DEMO_USERS = [
  { id: "1", email: "demo@example.com", password: "demo123", name: "Demo User", displayName: "Demo User" },
  { id: "2", email: "admin@example.com", password: "admin123", name: "Admin User", displayName: "Admin User" },
]

function AsgardeoAuthWrapper({ children }: { children: React.ReactNode }) {
  const asgardeoAuth = useAsgardeoAuth()
  const [authMode, setAuthMode] = useState<AuthMode>("demo")
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null)
  const [demoLoading, setDemoLoading] = useState(false)

  // Check for stored demo user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("demoUser")
    if (storedUser) {
      setDemoUser(JSON.parse(storedUser))
    }
  }, [])

  const demoSignIn = useCallback(async (email: string, password: string) => {
    setDemoLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = DEMO_USERS.find((u) => u.email === email && u.password === password)
    if (!user) {
      setDemoLoading(false)
      throw new Error("Invalid credentials")
    }

    const demoUser = { id: user.id, email: user.email, name: user.name, displayName: user.displayName }
    setDemoUser(demoUser)
    localStorage.setItem("demoUser", JSON.stringify(demoUser))
    setDemoLoading(false)
  }, [])

  const demoSignOut = useCallback(async () => {
    setDemoUser(null)
    localStorage.removeItem("demoUser")
  }, [])

  const signIn = useCallback(
    async (email?: string, password?: string) => {
      if (authMode === "demo" && email && password) {
        await demoSignIn(email, password)
      } else if (authMode === "asgardeo") {
        await asgardeoAuth.signIn()
      }
    },
    [authMode, demoSignIn, asgardeoAuth],
  )

  const signOut = useCallback(async () => {
    if (authMode === "demo") {
      await demoSignOut()
    } else if (authMode === "asgardeo") {
      await asgardeoAuth.signOut()
    }
  }, [authMode, demoSignOut, asgardeoAuth])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (authMode === "asgardeo") {
      try {
        return await asgardeoAuth.getAccessToken()
      } catch {
        return null
      }
    }
    return null // Demo mode doesn't use real tokens
  }, [authMode, asgardeoAuth])

  const switchAuthMode = useCallback(
    (mode: AuthMode) => {
      setAuthMode(mode)
      // Clear current auth state when switching
      if (mode === "asgardeo") {
        demoSignOut()
      } else {
        asgardeoAuth.signOut()
      }
    },
    [demoSignOut, asgardeoAuth],
  )

  const state = useMemo(
    (): DualAuthState => ({
      authMode,
      isAuthenticated: authMode === "demo" ? !!demoUser : !!asgardeoAuth.state?.isAuthenticated,
      isLoading: authMode === "demo" ? demoLoading : !!asgardeoAuth.state?.isLoading,
      user: authMode === "demo" ? demoUser : null,
      username: authMode === "asgardeo" ? asgardeoAuth.state?.username : demoUser?.email,
      displayName: authMode === "asgardeo" ? asgardeoAuth.state?.displayName : demoUser?.displayName,
      email: authMode === "asgardeo" ? asgardeoAuth.state?.email : demoUser?.email,
    }),
    [authMode, demoUser, demoLoading, asgardeoAuth.state],
  )

  const contextValue = useMemo(
    (): DualAuthContextType => ({
      state,
      signIn,
      signOut,
      switchAuthMode,
      getAccessToken,
    }),
    [state, signIn, signOut, switchAuthMode, getAccessToken],
  )

  return <DualAuthContext.Provider value={contextValue}>{children}</DualAuthContext.Provider>
}

export function DualAuthProvider({ children }: { children: React.ReactNode }) {
  const asgardeoConfig = {
    signInRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL || "http://localhost:3000",
    signOutRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL || "http://localhost:3000",
    clientID: process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID || "",
    baseUrl: process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "",
    scope: ["openid", "profile", "email"],
  }

  // If Asgardeo config is available, wrap with AsgardeoAuthProvider
  if (asgardeoConfig.clientID && asgardeoConfig.baseUrl) {
    return (
      <AsgardeoAuthProvider config={asgardeoConfig}>
        <AsgardeoAuthWrapper>{children}</AsgardeoAuthWrapper>
      </AsgardeoAuthProvider>
    )
  }

  // Fallback to demo-only mode if Asgardeo not configured
  return <AsgardeoAuthWrapper>{children}</AsgardeoAuthWrapper>
}

export function useDualAuth() {
  const context = useContext(DualAuthContext)
  if (!context) {
    throw new Error("useDualAuth must be used within a DualAuthProvider")
  }
  return context
}

// Compatibility hook for existing components
export function useAuthContext() {
  return useDualAuth()
}
