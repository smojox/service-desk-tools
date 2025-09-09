"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (status === 'authenticated') {
      // Redirect authenticated users to tools
      router.replace('/tools')
    } else {
      // Redirect unauthenticated users to login
      router.replace('/login')
    }
  }, [router, status])

  // Show loading spinner while determining auth state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Return null since we're redirecting
  return null
}