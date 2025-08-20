"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to tools page immediately
    router.replace('/tools')
  }, [router])

  // Return null since we're redirecting
  return null
}