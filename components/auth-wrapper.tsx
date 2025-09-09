'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
  requiredPermissions?: {
    admin?: boolean
    analytics?: boolean
    appealCodes?: boolean
  }
}

export function AuthWrapper({ children, requiredPermissions }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && requiredPermissions) {
      const userPermissions = (session?.user as any)?.permissions || {}
      
      if (requiredPermissions.admin && !userPermissions.admin) {
        router.push('/tools?error=unauthorized')
        return
      }
      
      if (requiredPermissions.analytics && !userPermissions.analytics) {
        router.push('/tools?error=no-analytics-access')
        return
      }
      
      if (requiredPermissions.appealCodes && !userPermissions.appealCodes) {
        router.push('/tools?error=no-appeal-codes-access')
        return
      }
    }
  }, [session, status, router, requiredPermissions])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect to login
  }

  if (requiredPermissions) {
    const userPermissions = (session?.user as any)?.permissions || {}
    
    if (requiredPermissions.admin && !userPermissions.admin) {
      return null // Will redirect
    }
    
    if (requiredPermissions.analytics && !userPermissions.analytics) {
      return null // Will redirect
    }
    
    if (requiredPermissions.appealCodes && !userPermissions.appealCodes) {
      return null // Will redirect
    }
  }

  return <>{children}</>
}