"use client"

import { AuthProvider as AsgardeoAuthProvider } from "@asgardeo/auth-react"
import type { ReactNode } from "react"

const authConfig = {
  signInRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL || "http://localhost:3000",
  signOutRedirectURL: process.env.NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL || "http://localhost:3000",
  clientID: process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID || "",
  baseUrl: process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL || "",
  scope: ["openid", "profile", "email"],
  resourceServerURLs: [process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"],
  enablePKCE: true,
  storage: "sessionStorage",
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return <AsgardeoAuthProvider config={authConfig}>{children}</AsgardeoAuthProvider>
}
