"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  BarChart3,
  Shield,
  LogOut,
  User,
  Bug,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  Code,
  Ticket,
  Search,
  FileBarChart,
  Users,
  Settings,
  ChevronDown,
  ChevronRight
} from "lucide-react"

interface AppSidebarProps {
  selectedItem?: string
}

export default function AppSidebar({ selectedItem: initialSelectedItem }: AppSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [expandedMenu, setExpandedMenu] = useState<string | null>("incident-management")
  const [selectedItem, setSelectedItem] = useState<string>(initialSelectedItem || "incident-dashboard")
  const [widgetConfig, setWidgetConfig] = useState<Record<string, boolean>>({})
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    if (initialSelectedItem) {
      setSelectedItem(initialSelectedItem)
    }
  }, [initialSelectedItem])

  useEffect(() => {
    const fetchWidgetConfig = async () => {
      try {
        const response = await fetch('/api/app-settings')
        if (response.ok) {
          const data = await response.json()
          const config: Record<string, boolean> = {}
          data.widgets.forEach((widget: any) => {
            config[widget.id] = widget.enabled
          })
          setWidgetConfig(config)
        }
      } catch (error) {
        console.error('Error fetching widget config:', error)
      } finally {
        setConfigLoaded(true)
      }
    }

    if (session) {
      fetchWidgetConfig()
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const toggleMenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId)
  }

  const handleNavigation = (itemId: string, path: string) => {
    setSelectedItem(itemId)
    router.push(path)
  }

  if (!session) return null

  const hasAnalyticsAccess = session.user.permissions.analytics
  const hasAppealCodesAccess = session.user.permissions.appealCodes
  const hasAdminAccess = session.user.permissions.admin

  const isWidgetVisible = (widgetId: string) => {
    // Incident management is always visible
    if (widgetId === 'incident-management') return true

    // Hide all other widgets until config is loaded
    if (!configLoaded) return false

    // Check if widget is explicitly disabled in config (false means disabled)
    // If widget is not in config, default to hidden (undefined or missing = hidden)
    if (widgetConfig[widgetId] !== true) return false

    return true
  }

  const allMenuItems = [
    {
      id: "incident-management",
      label: "Incident Management",
      icon: Ticket,
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverBg: "hover:bg-red-100",
      subItems: [
        { id: "incident-dashboard", label: "Ticket Dashboard", icon: BarChart3, path: "/incident-management" },
        { id: "incident-search", label: "Ticket Search", icon: Search, path: "/incident-management?tab=search" },
        { id: "incident-reporting", label: "Reporting", icon: FileBarChart, path: "/incident-management?tab=reporting" },
        { id: "customer-contacts", label: "Customer Contacts", icon: Users, path: "/incident-management?tab=companies" },
        { id: "incident-admin", label: "Admin Panel", icon: Settings, path: "/incident-management?tab=admin" }
      ]
    },
    {
      id: "analytics",
      label: "Service Desk Analytics",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      path: "/analytics",
      disabled: !hasAnalyticsAccess
    },
    {
      id: "appeal-codes",
      label: "Appeal Codes",
      icon: FileText,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      hoverBg: "hover:bg-teal-100",
      path: "/appeal-codes",
      disabled: !hasAppealCodesAccess
    },
    {
      id: "jira",
      label: "JIRA Support Assists",
      icon: Bug,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      hoverBg: "hover:bg-purple-100",
      path: "/jira"
    },
    {
      id: "support-dev",
      label: "Support Dev Items",
      icon: Code,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      hoverBg: "hover:bg-indigo-100",
      path: "/support-dev-items"
    },
    {
      id: "priority-tracker",
      label: "Priority Tracker",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverBg: "hover:bg-orange-100",
      path: "/priority-tracker"
    },
    {
      id: "csi-tracker",
      label: "CSI Tracker",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      path: "/csi-tracker"
    },
    {
      id: "resource-planner",
      label: "Resource Planner",
      icon: CalendarDays,
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverBg: "hover:bg-green-100",
      path: "/resource-planner"
    }
  ]

  const menuItems = allMenuItems.filter(item => {
    // Check widget visibility (config-based)
    if (!isWidgetVisible(item.id)) return false

    // Check permission-based disabled state
    if (item.disabled) return false

    return true
  })

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push('/incident-management')}>
          <img
            src="/logo.png"
            alt="Taranto Logo"
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
          <span className="font-semibold text-white">Service Desk</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {menuItems.map((item) => (
          <div key={item.id} className="mb-1">
            {item.subItems ? (
              <div>
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    expandedMenu === item.id ? item.bgColor : 'hover:bg-gray-100'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={item.disabled}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </div>
                  {expandedMenu === item.id ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {expandedMenu === item.id && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleNavigation(subItem.id, subItem.path)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedItem === subItem.id
                            ? `${item.bgColor} ${item.color} font-medium`
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <subItem.icon className="h-4 w-4" />
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => item.path && handleNavigation(item.id, item.path)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  selectedItem === item.id ? `${item.bgColor} font-medium` : item.hoverBg
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={item.disabled}
              >
                <item.icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm text-gray-700">{item.label}</span>
                {item.disabled && (
                  <Shield className="h-3 w-3 text-gray-400 ml-auto" />
                )}
              </button>
            )}
          </div>
        ))}
      </nav>

      {/* User Info at Bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
            <Badge variant="outline" className="text-xs">{session.user.role}</Badge>
          </div>
        </div>

        <div className="space-y-1">
          {hasAdminAccess && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => router.push('/admin')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
