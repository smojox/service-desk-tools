"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import IncidentManagementWidget from "@/components/incident-management-widget"
import { AuthWrapper } from "@/components/auth-wrapper"

export default function IncidentManagementPage() {
  const router = useRouter()

  return (
    <AuthWrapper>
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
                <span className="text-gray-300">Incident Management</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <IncidentManagementWidget />
          </div>
        </div>
      </div>
    </AuthWrapper>
  )
}
