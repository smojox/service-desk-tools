'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

export default function CustomerPortalLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/customer-portal/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Login successful! Redirecting...'
        })

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/customer-portal/dashboard')
        }, 500)
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Invalid email or password'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-taranto-turquoise/10 to-taranto-turquoise/5 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="taranto-heading text-4xl text-taranto-turquoise mb-2">
            Customer Portal
          </h1>
          <p className="taranto-body text-gray-600">
            Sign in to view and manage your support incidents
          </p>
        </div>

        {/* Login Card */}
        <div className="taranto-card-base bg-white shadow-taranto-elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="taranto-input-base border-2 border-gray-300 rounded-taranto focus:border-taranto-turquoise bg-white"
                placeholder="your.email@company.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="taranto-input-base border-2 border-gray-300 rounded-taranto focus:border-taranto-turquoise bg-white pr-12"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-taranto-grey hover:text-taranto-turquoise transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`taranto-card-base ${
                  message.type === 'success'
                    ? 'bg-taranto-green/10 text-taranto-green border-2 border-taranto-green'
                    : 'bg-taranto-red/10 text-taranto-red border-2 border-taranto-red'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="taranto-btn-base w-full bg-taranto-turquoise hover:bg-taranto-turquoise/90 text-white py-3 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="taranto-body text-sm text-center">
              Sign in with your email and password to access your support portal.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="taranto-body text-sm">Need help? Contact your system administrator.</p>
        </div>
      </div>
    </div>
  )
}
