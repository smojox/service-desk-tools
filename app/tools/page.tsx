"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, BarChart3, Settings, Shield, LogOut, User, Loader2, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ToolsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState("")

  useEffect(() => {
    const errorParam = searchParams?.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'unauthorized':
          setError('You do not have permission to access the admin panel.')
          break
        case 'no-analytics-access':
          setError('You do not have permission to access the Analytics Dashboard.')
          break
        case 'no-appeal-codes-access':
          setError('You do not have permission to access Appeal Codes.')
          break
        default:
          setError('Access denied.')
      }
    }
  }, [searchParams])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

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

  const hasAnalyticsAccess = session.user.permissions.analytics
  const hasAppealCodesAccess = session.user.permissions.appealCodes
  const hasAdminAccess = session.user.permissions.admin

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="/logo.png" 
                alt="Taranto Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = document.createElement('h1')
                  fallback.textContent = 'Taranto'
                  fallback.className = 'text-2xl font-bold text-white'
                  e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget)
                }}
              />
              <span className="text-gray-300 text-xl font-semibold">Service Desk Tools Hub</span>
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
        <div className="max-w-6xl mx-auto">
          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900 text-3xl">Welcome, {session.user.name}!</CardTitle>
              <p className="text-gray-600 text-lg">Your comprehensive toolkit for service desk management and analytics</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Service Desk Analytics Widget */}
                <Card className={`p-6 transition-shadow cursor-pointer border-2 ${
                  hasAnalyticsAccess 
                    ? 'hover:shadow-lg border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50' 
                    : 'border-gray-300 bg-gray-50 opacity-50'
                }`}>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${
                        hasAnalyticsAccess ? 'bg-blue-100' : 'bg-gray-200'
                      }`}>
                        <BarChart3 className={`h-8 w-8 ${
                          hasAnalyticsAccess ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Desk Analytics</h3>
                    <p className={`text-sm mb-4 ${
                      hasAnalyticsAccess ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      Comprehensive analytics dashboard with real-time metrics, charts, and SLA compliance tracking
                    </p>
                    <Button 
                      className={`w-full ${
                        hasAnalyticsAccess 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      }`}
                      onClick={() => hasAnalyticsAccess && router.push('/analytics')}
                      disabled={!hasAnalyticsAccess}
                    >
                      {hasAnalyticsAccess ? 'Open Analytics Dashboard' : 'Access Restricted'}
                    </Button>
                    {!hasAnalyticsAccess && (
                      <p className="text-xs text-gray-500 mt-2">Contact your administrator for access</p>
                    )}
                  </div>
                </Card>

                {/* Appeal Codes Widget */}
                <Card className={`p-6 transition-shadow cursor-pointer border-2 ${
                  hasAppealCodesAccess 
                    ? 'hover:shadow-lg border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50' 
                    : 'border-gray-300 bg-gray-50 opacity-50'
                }`}>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`p-3 rounded-full ${
                        hasAppealCodesAccess ? 'bg-teal-100' : 'bg-gray-200'
                      }`}>
                        <FileText className={`h-8 w-8 ${
                          hasAppealCodesAccess ? 'text-teal-600' : 'text-gray-400'
                        }`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Appeal Codes</h3>
                    <p className={`text-sm mb-4 ${
                      hasAppealCodesAccess ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      Validate existing codes or generate appeal codes for different notice types and date ranges
                    </p>
                    <Button 
                      className={`w-full ${
                        hasAppealCodesAccess 
                          ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                          : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      }`}
                      onClick={() => hasAppealCodesAccess && router.push('/appeal-codes')}
                      disabled={!hasAppealCodesAccess}
                    >
                      {hasAppealCodesAccess ? 'Open Appeal Codes' : 'Access Restricted'}
                    </Button>
                    {!hasAppealCodesAccess && (
                      <p className="text-xs text-gray-500 mt-2">Contact your administrator for access</p>
                    )}
                  </div>
                </Card>
                
                {/* Placeholder for future tools */}
                <Card className="p-6 text-center border-dashed border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-gray-500">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gray-200 rounded-full">
                        <Settings className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">More Tools Coming Soon</h3>
                    <p className="text-sm">Additional service desk utilities and management tools will be available here</p>
                  </div>
                </Card>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}