"use client"

import IncidentManagementWidget from "@/components/incident-management-widget"
import { AuthWrapper } from "@/components/auth-wrapper"
import AppSidebar from "@/components/app-sidebar"

export default function IncidentManagementPage() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-gradient-to-br from-taranto-turquoise/10 to-taranto-turquoise/5 flex">
        {/* Sidebar */}
        <AppSidebar selectedItem="incident-dashboard" />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <IncidentManagementWidget />
          </div>
        </div>
      </div>
    </AuthWrapper>
  )
}
