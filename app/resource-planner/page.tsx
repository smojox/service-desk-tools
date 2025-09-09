"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, User, LogOut, Shield, CalendarDays } from "lucide-react"
import { signOut } from "next-auth/react"
import ResourcePlannerWidget from "@/components/resource-planner-widget"

export default function ResourcePlannerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const hasAdminAccess = session.user.permissions.admin

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-400">
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
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-6 w-6 text-green-500" />
                <span className="text-gray-300 text-xl font-semibold">Resource Planner</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-300" />
                <span className="text-gray-300">{session.user.name}</span>
                <Badge variant="outline" className="text-white border-white">
                  {session.user.role}
                </Badge>
              </div>
              {hasAdminAccess && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-white/20"
                  onClick={() => router.push('/admin')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/20"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 text-2xl">
                <CalendarDays className="h-6 w-6 text-green-600" />
                Resource Planning Dashboard
              </CardTitle>
              <p className="text-gray-600">
                Schedule and manage resource assignments with calendar view. Link tasks to Priority and CSI items for comprehensive project management.
              </p>
            </CardHeader>
            <CardContent>
              <ResourcePlannerWidget />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}