import { NextRequest, NextResponse } from 'next/server'
import { PortalUserModel } from '@/lib/models/PortalUser'
import { CompanyModel } from '@/lib/models/Company'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate user credentials
    const portalUser = await PortalUserModel.validatePassword(email, password)

    if (!portalUser) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check if user is active
    if (!portalUser.active) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    }

    // Check if company has portal enabled
    const company = await CompanyModel.getItemById(portalUser.companyId.toString())
    if (!company || !company.portalEnabled) {
      return NextResponse.json({ error: 'Portal access is not enabled for your company' }, { status: 403 })
    }

    // Generate JWT token
    const token = await new SignJWT({
      userId: portalUser._id!.toString(),
      email: portalUser.email,
      companyId: portalUser.companyId.toString(),
      role: portalUser.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: portalUser._id!.toString(),
        name: portalUser.name,
        email: portalUser.email,
        role: portalUser.role,
        companyName: portalUser.companyName
      }
    })

    response.cookies.set('portal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Error in portal login:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
