"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  username: string
  name: string
  email: string
  contactNumber?: string
  country?: string
}

interface AuthStore {
  isAuthenticated: boolean
  loading: boolean
  user: User | null
  setAuth: (isAuthenticated: boolean, user?: User) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      loading: true,
      user: null,

      setAuth: (isAuthenticated, user) => {
        set({ isAuthenticated, user: user || null, loading: false })
      },

      setLoading: (loading) => {
        set({ loading })
      },

      clearAuth: () => {
        set({ isAuthenticated: false, user: null, loading: false })
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
