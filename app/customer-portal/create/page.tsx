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

export default function CreateIncidentPage() {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'critical' | 'high' | 'medium' | 'low',
    category: 'General',
    subCategory: ''
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await fetch('/api/customer-portal/auth/me')
        if (!userResponse.ok) {
          router.push('/customer-portal')
          return
        }
        const userData = await userResponse.json()

        if (!userData.user.canCreateIncidents) {
          router.push('/customer-portal/dashboard')
          return
        }

        setUser(userData.user)
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/customer-portal')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      console.log('Submitting incident with formData:', formData)

      const response = await fetch('/api/customer-portal/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)

        if (!data || !data.incident) {
          console.error('Invalid response structure:', data)
          alert('Error: Invalid response from server')
          return
        }

        if (!data.incident.ref) {
          console.error('Missing incident ref:', data.incident)
          alert('Error: Incident created but missing reference number')
          return
        }

        console.log('Redirecting to incident:', data.incident.ref)
        router.push(`/customer-portal/incident/${data.incident.ref}`)
      } else {
        const error = await response.json()
        console.error('Server error response:', error)
        alert(error.error || 'Failed to create incident')
      }
    } catch (error) {
      console.error('Error creating incident:', error)
      alert('An error occurred while creating the incident: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/customer-portal/auth/logout', { method: 'POST' })
    router.push('/customer-portal')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              <Link
                href="/customer-portal/dashboard"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Dashboard
              </Link>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Incident</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief summary of the issue"
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the issue, including steps to reproduce if applicable"
                disabled={submitting}
              />
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="low">Low - Minor issue, no immediate impact</option>
                <option value="medium">Medium - Normal issue</option>
                <option value="high">High - Significant impact on operations</option>
                <option value="critical">Critical - System down or severe impact</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={submitting}
              >
                <option value="General">General</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Security">Security</option>
                <option value="Access">Access</option>
                <option value="Performance">Performance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Sub-Category */}
            <div>
              <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
                Sub-Category (Optional)
              </label>
              <input
                type="text"
                id="subCategory"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Login Issues, Printer Problems, etc."
                disabled={submitting}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/customer-portal/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Incident'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
