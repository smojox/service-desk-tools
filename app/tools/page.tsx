"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ToolsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to incident management dashboard instead of showing welcome screen
    if (session) {
      router.replace('/incident-management')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  )
}
