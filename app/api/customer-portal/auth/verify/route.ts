import { NextRequest, NextResponse } from 'next/server'
import { PortalUserModel } from '@/lib/models/PortalUser'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify magic link token
    const portalUser = await PortalUserModel.verifyMagicLink(token)

    if (!portalUser) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Generate JWT token (24 hour expiry)
    const jwtToken = await new SignJWT({
      userId: portalUser._id!.toString(),
      email: portalUser.email,
      companyId: portalUser.companyId.toString(),
      role: portalUser.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      token: jwtToken,
      user: {
        id: portalUser._id!.toString(),
        name: portalUser.name,
        email: portalUser.email,
        companyId: portalUser.companyId.toString(),
        companyName: portalUser.companyName,
        role: portalUser.role,
        canCreateIncidents: portalUser.canCreateIncidents,
        canViewAllCompanyIncidents: portalUser.canViewAllCompanyIncidents
      }
    })

    // Set HTTP-only cookie with JWT token
    response.cookies.set('portal_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('Error verifying magic link:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
