'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyContent() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. Please request a new magic link.')
      return
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/customer-portal/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Successfully authenticated! Redirecting to dashboard...')

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/customer-portal/dashboard')
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed. The link may have expired.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred during verification. Please try again.')
      }
    }

    verifyToken()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying your link...
            </h1>
            <p className="text-gray-600">
              Please wait while we authenticate you.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-4">
                <svg
                  className="h-16 w-16 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Success!
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-4">
                <svg
                  className="h-16 w-16 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/customer-portal')}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Request New Link
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
