'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PortalUser {
  id: string
  name: string
  email: string
  companyName: string
  canAddComments: boolean
}

interface Incident {
  _id: string
  ref: string
  subject: string
  description: string
  status: string
  priority: string
  category: string
  subcategory?: string
  createdAt: string
  updatedAt: string
  assignedToName?: string
  customerUpdates?: Array<{
    content: string
    createdAt: string
    authorName: string
    authorType: string
    visibleToCustomer: boolean
  }>
}

export default function IncidentDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const resolvedParams = use(params)
  const [user, setUser] = useState<PortalUser | null>(null)
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user info
        const userResponse = await fetch('/api/customer-portal/auth/me')
        if (!userResponse.ok) {
          router.push('/customer-portal')
          return
        }
        const userData = await userResponse.json()
        setUser(userData.user)

        // Fetch incident
        const incidentResponse = await fetch(`/api/customer-portal/incidents/${resolvedParams.ref}`)
        if (incidentResponse.ok) {
          const incidentData = await incidentResponse.json()
          setIncident(incidentData.incident)
        } else {
          // Redirect if incident not found
          router.push('/customer-portal/dashboard')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/customer-portal')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.ref, router])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || !user?.canAddComments) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/customer-portal/incidents/${resolvedParams.ref}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: comment, isPrivate: false }),
      })

      if (response.ok) {
        const data = await response.json()
        setIncident(data.incident)
        setComment('')
      } else {
        alert('Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('An error occurred while adding your comment')
    } finally {
      setSubmitting(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-taranto-turquoise/10 to-taranto-turquoise/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-taranto-turquoise mx-auto mb-4"></div>
          <p className="taranto-body">Loading incident...</p>
        </div>
      </div>
    )
  }

  if (!incident) {
    return null
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
              <Link
                href="/customer-portal/dashboard"
                className="taranto-btn-base text-sm text-taranto-turquoise hover:text-taranto-turquoise/80"
              >
                Back to Dashboard
              </Link>
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
        <div className="taranto-card-base bg-white shadow-lg overflow-hidden">
          {/* Incident Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className="font-mono text-lg font-bold text-taranto-turquoise">
                    {incident.ref}
                  </span>
                  <span className={`px-3 py-1 rounded-taranto text-sm font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                  <span className={`text-sm font-bold ${getPriorityColor(incident.priority)}`}>
                    {incident.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                <h2 className="taranto-heading text-2xl mb-2">
                  {incident.subject}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Category: {incident.category}</span>
                  {incident.subcategory && <span>• {incident.subcategory}</span>}
                  {incident.assignedToName && <span>• Assigned to: {incident.assignedToName}</span>}
                </div>
              </div>
            </div>

            <div className="bg-taranto-turquoise/5 p-4 rounded-taranto">
              <h3 className="taranto-heading text-sm mb-2">Description</h3>
              <p className="taranto-body whitespace-pre-wrap">{incident.description}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6">
            <h3 className="taranto-heading text-lg mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {incident.customerUpdates && incident.customerUpdates.length > 0 ? (
                incident.customerUpdates
                  .filter(item => item.visibleToCustomer)
                  .map((item, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-taranto-turquoise/20 flex items-center justify-center">
                          <svg className="h-5 w-5 text-taranto-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 bg-taranto-turquoise/5 rounded-taranto p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="taranto-heading text-sm">{item.authorName}</span>
                          <span className="taranto-body text-sm text-gray-500">
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="taranto-body text-sm whitespace-pre-wrap">{item.content}</p>
                        <span className="inline-block mt-2 text-xs font-medium text-taranto-grey uppercase">
                          {item.authorType}
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="taranto-body text-center py-4">No activity yet</p>
              )}
            </div>
          </div>

          {/* Add Comment */}
          {user?.canAddComments && ['open', 'in_progress', 'waiting_customer'].includes(incident.status) && (
            <div className="p-6 border-t border-gray-200 bg-taranto-turquoise/5">
              <h3 className="taranto-heading text-lg mb-4">Add Comment</h3>
              <form onSubmit={handleSubmitComment}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="taranto-input-base border-2 border-gray-300 rounded-taranto focus:border-taranto-turquoise bg-white"
                  placeholder="Type your comment here..."
                  disabled={submitting}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !comment.trim()}
                    className="taranto-btn-base bg-taranto-turquoise text-white px-6 py-2 hover:bg-taranto-turquoise/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Add Comment'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
