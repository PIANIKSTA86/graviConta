"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("auth-token")

    if (token) {
      // If authenticated, redirect to dashboard
      router.push("/dashboard")
    } else {
      // If not authenticated, redirect to login
      router.push("/login")
    }
  }, [router])

  // Show loading while redirecting
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <div className="relative w-24 h-24 md:w-32 md:h-32">
        <img
          src="/logo.svg"
          alt="Z.ai Logo"
          className="w-full h-full object-contain animate-pulse"
        />
      </div>
      <p className="text-muted-foreground">Cargando graviConta...</p>
    </div>
  )
}