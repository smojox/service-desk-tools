import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { PortalUserModel } from '@/lib/models/PortalUser'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export interface PortalAuthPayload {
  userId: string
  email: string
  companyId: string
  role: string
}

export async function verifyPortalAuth(request: NextRequest): Promise<PortalAuthPayload | null> {
  try {
    // Get token from cookie
    const token = request.cookies.get('portal_token')?.value

    if (!token) {
      return null
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Verify user still exists and is active
    const portalUser = await PortalUserModel.getItemById(payload.userId as string)

    if (!portalUser || !portalUser.active) {
      return null
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      companyId: payload.companyId as string,
      role: payload.role as string
    }
  } catch (error) {
    console.error('Error verifying portal auth:', error)
    return null
  }
}
