import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { PortalUserModel } from '@/lib/models/PortalUser'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('portal_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Get fresh user data from database
    const portalUser = await PortalUserModel.getItemById(payload.userId as string)

    if (!portalUser || !portalUser.active) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: portalUser._id!.toString(),
        name: portalUser.name,
        email: portalUser.email,
        phone: portalUser.phone,
        jobTitle: portalUser.jobTitle,
        companyId: portalUser.companyId.toString(),
        companyName: portalUser.companyName,
        role: portalUser.role,
        canCreateIncidents: portalUser.canCreateIncidents,
        canViewAllCompanyIncidents: portalUser.canViewAllCompanyIncidents,
        canAddComments: portalUser.canAddComments,
        emailNotifications: portalUser.emailNotifications,
        language: portalUser.language,
        timezone: portalUser.timezone
      }
    })
  } catch (error: any) {
    console.error('Error getting portal user:', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
