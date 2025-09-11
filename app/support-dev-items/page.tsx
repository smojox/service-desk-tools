"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, Code } from "lucide-react"
import SupportDevItemsWidget from "@/components/support-dev-items-widget"

export default function SupportDevItemsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login')
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/20"
                onClick={() => router.push('/tools')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Button>
              <div className="flex items-center space-x-3">
                <Code className="h-6 w-6 text-white" />
                <span className="text-white text-xl font-semibold">Support Dev Items</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-300" />
              <span className="text-gray-300">{session.user.name}</span>
              <Badge variant="outline" className="text-white border-white">
                {session.user.role}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Card className="border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 text-2xl flex items-center gap-2">
                  <Code className="h-6 w-6" />
                  Support Dev Items Dashboard
                </CardTitle>
                <p className="text-gray-600">
                  Monitor Freshdesk tickets marked "With Development" and their associated JIRA references, 
                  including current status and fix versions.
                </p>
              </CardHeader>
            </Card>
          </div>
          
          {/* Widget Container */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6">
            <SupportDevItemsWidget />
          </div>
        </div>
      </div>
    </div>
  )
}