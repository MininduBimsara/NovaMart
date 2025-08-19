"use client"

import { useAuthContext } from "@/lib/auth/dual-auth-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader } from "@/components/ui/loader"

export default function LogoutPage() {
  const { signOut } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut()
        router.push("/login")
      } catch (error) {
        console.error("Logout failed:", error)
        router.push("/login")
      }
    }

    handleLogout()
  }, [signOut, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader />
        <p className="mt-4 text-muted-foreground">Signing you out...</p>
      </div>
    </div>
  )
}
