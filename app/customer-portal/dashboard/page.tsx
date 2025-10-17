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
      open: 'bg-taranto-turquoise/10 text-taranto-turquoise border border-taranto-turquoise',
      in_progress: 'bg-taranto-orange/10 text-taranto-orange border border-taranto-orange',
      waiting_customer: 'bg-taranto-orange/10 text-taranto-orange border border-taranto-orange',
      waiting_vendor: 'bg-taranto-orange/10 text-taranto-orange border border-taranto-orange',
      resolved: 'bg-taranto-green/10 text-taranto-green border border-taranto-green',
      closed: 'bg-taranto-grey/10 text-taranto-grey border border-taranto-grey'
    }
    return colors[status as keyof typeof colors] || 'bg-taranto-grey/10 text-taranto-grey border border-taranto-grey'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'text-taranto-red',
      high: 'text-taranto-orange',
      medium: 'text-taranto-orange',
      low: 'text-taranto-green'
    }
    return colors[priority as keyof typeof colors] || 'text-taranto-grey'
  }

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true
    if (filter === 'open') return ['open', 'in_progress', 'waiting_customer', 'waiting_vendor'].includes(incident.status)
    if (filter === 'closed') return ['resolved', 'closed'].includes(incident.status)
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-taranto-turquoise/10 to-taranto-turquoise/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-taranto-turquoise mx-auto mb-4"></div>
          <p className="taranto-body">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-taranto-turquoise/10 to-taranto-turquoise/5">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="taranto-heading text-2xl text-taranto-turquoise">Customer Portal</h1>
              <p className="taranto-body text-sm">{user?.companyName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="taranto-body text-sm">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="taranto-btn-base text-sm text-taranto-red hover:text-taranto-red/80"
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
              className={`taranto-btn-base px-4 py-2 ${
                filter === 'all'
                  ? 'bg-taranto-turquoise text-white'
                  : 'bg-white text-taranto-grey hover:bg-gray-50'
              }`}
            >
              All Incidents
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`taranto-btn-base px-4 py-2 ${
                filter === 'open'
                  ? 'bg-taranto-turquoise text-white'
                  : 'bg-white text-taranto-grey hover:bg-gray-50'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`taranto-btn-base px-4 py-2 ${
                filter === 'closed'
                  ? 'bg-taranto-turquoise text-white'
                  : 'bg-white text-taranto-grey hover:bg-gray-50'
              }`}
            >
              Closed
            </button>
          </div>

          {user?.canCreateIncidents && (
            <Link
              href="/customer-portal/create"
              className="taranto-btn-base bg-taranto-turquoise text-white px-4 py-2 hover:bg-taranto-turquoise/90"
            >
              Create New Incident
            </Link>
          )}
        </div>

        {/* Incidents List */}
        <div className="taranto-card-base bg-white shadow-md">
          {filteredIncidents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="taranto-body">No incidents found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredIncidents.map((incident) => (
                <Link
                  key={incident._id}
                  href={`/customer-portal/incident/${incident.ref}`}
                  className="block p-6 hover:bg-taranto-turquoise/5 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm font-semibold text-taranto-turquoise">
                          {incident.ref}
                        </span>
                        <span className={`px-2 py-1 rounded-taranto text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(incident.priority)}`}>
                          {incident.priority.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="taranto-heading text-lg mb-1">
                        {incident.subject}
                      </h3>
                      <p className="taranto-body text-sm line-clamp-2 mb-2">
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
                        className="h-5 w-5 text-taranto-grey"
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
