"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  picture?: string
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  username?: string
  displayName?: string
  email?: string
}

interface AuthContextType {
  state: AuthState
  signIn: (email?: string, password?: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
  user: User | null
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function DemoAuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize demo users if they don't exist
    const existingUsers = localStorage.getItem("demo-users")
    if (!existingUsers) {
      const demoUsers = [
        {
          id: "demo-1",
          email: "demo@example.com",
          password: "demo123",
          name: "Demo User",
        },
      ]
      localStorage.setItem("demo-users", JSON.stringify(demoUsers))
    }

    // Check for existing session
    const savedUser = localStorage.getItem("demo-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email?: string, password?: string) => {
    console.log("[v0] signIn called with:", { email, hasPassword: !!password })

    if (!email || !password) {
      // Asgardeo-style redirect - use demo account
      const userData = {
        id: "demo-1",
        email: "demo@example.com",
        name: "Demo User",
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=Demo User`,
      }
      console.log("[v0] Setting demo user:", userData)
      setUser(userData)
      localStorage.setItem("demo-user", JSON.stringify(userData))
      return
    }

    setIsLoading(true)
    console.log("[v0] Starting login process...")

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if user exists in demo users
    const demoUsers = JSON.parse(localStorage.getItem("demo-users") || "[]")
    const existingUser = demoUsers.find((u: any) => u.email === email && u.password === password)

    if (!existingUser) {
      console.log("[v0] Login failed - user not found")
      setIsLoading(false)
      throw new Error("Invalid email or password")
    }

    const userData = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${existingUser.name}`,
    }

    console.log("[v0] Login successful, setting user:", userData)
    setUser(userData)
    localStorage.setItem("demo-user", JSON.stringify(userData))
    setIsLoading(false)
  }

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Check if user already exists
    const demoUsers = JSON.parse(localStorage.getItem("demo-users") || "[]")
    const existingUser = demoUsers.find((u: any) => u.email === email)

    if (existingUser) {
      setIsLoading(false)
      throw new Error("User already exists with this email")
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      name,
    }

    demoUsers.push(newUser)
    localStorage.setItem("demo-users", JSON.stringify(demoUsers))

    const userData = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      picture: `https://api.dicebear.com/7.x/initials/svg?seed=${newUser.name}`,
    }

    setUser(userData)
    localStorage.setItem("demo-user", JSON.stringify(userData))
    setIsLoading(false)
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("demo-user")
  }

  const state: AuthState = {
    isAuthenticated: !!user,
    isLoading,
    username: user?.email,
    displayName: user?.name,
    email: user?.email,
  }

  const value: AuthContextType = {
    state,
    signIn,
    signUp,
    signOut,
    user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within a DemoAuthProvider")
  }
  return context
}

// Keep the original hook for backward compatibility
export function useDemoAuth() {
  return useAuthContext()
}
