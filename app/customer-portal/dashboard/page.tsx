'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PortalUser {
  id: string
  name: string
  email: string
  companyName: string
  canCreateIncidents: boolean
}

interface Incident {
  _id: string
  ref: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  assignedToName?: string
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const router = useRouter()

  useEffect(() => {
    const fetchUserAndIncidents = async () => {
      try {
        // Fetch user info
        const userResponse = await fetch('/api/customer-portal/auth/me')
        if (!userResponse.ok) {
          router.push('/customer-portal')
          return
        }
        const userData = await userResponse.json()
        setUser(userData.user)

        // Fetch incidents
        const incidentsResponse = await fetch('/api/customer-portal/incidents')
        if (incidentsResponse.ok) {
          const incidentsData = await incidentsResponse.json()
          setIncidents(incidentsData.incidents)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/customer-portal')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndIncidents()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/customer-portal/auth/logout', { method: 'POST' })
    router.push('/customer-portal')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_customer: 'bg-orange-100 text-orange-800',
      waiting_vendor: 'bg-purple-100 text-purple-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    }
    return colors[priority as keyof typeof colors] || 'text-gray-600'
  }

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true
    if (filter === 'open') return ['open', 'in_progress', 'waiting_customer', 'waiting_vendor'].includes(incident.status)
    if (filter === 'closed') return ['resolved', 'closed'].includes(incident.status)
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
              <p className="text-sm text-gray-600">{user?.companyName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Incidents
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'closed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Closed
            </button>
          </div>

          {user?.canCreateIncidents && (
            <Link
              href="/customer-portal/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Create New Incident
            </Link>
          )}
        </div>

        {/* Incidents List */}
        <div className="bg-white rounded-lg shadow">
          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No incidents found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredIncidents.map((incident) => (
                <Link
                  key={incident._id}
                  href={`/customer-portal/incident/${incident.ref}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {incident.ref}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(incident.priority)}`}>
                          {incident.priority.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {incident.subject}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {incident.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {new Date(incident.createdAt).toLocaleDateString()}</span>
                        {incident.assignedToName && (
                          <span>Assigned to: {incident.assignedToName}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
