import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { PortalUserModel, UpdatePortalUserData } from '@/lib/models/PortalUser'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyPortalAuth(request)

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portalUser = await PortalUserModel.getItemById(auth.userId)

    if (!portalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: portalUser._id!.toString(),
        name: portalUser.name,
        email: portalUser.email,
        phone: portalUser.phone,
        jobTitle: portalUser.jobTitle,
        companyName: portalUser.companyName,
        emailNotifications: portalUser.emailNotifications,
        language: portalUser.language,
        timezone: portalUser.timezone
      }
    })
  } catch (error: any) {
    console.error('Error fetching portal profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyPortalAuth(request)

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const updateData: UpdatePortalUserData = {
      phone: body.phone,
      jobTitle: body.jobTitle,
      emailNotifications: body.emailNotifications,
      language: body.language,
      timezone: body.timezone
    }

    const updatedUser = await PortalUserModel.updateItem(auth.userId, updateData)

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: updatedUser._id!.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        jobTitle: updatedUser.jobTitle,
        companyName: updatedUser.companyName,
        emailNotifications: updatedUser.emailNotifications,
        language: updatedUser.language,
        timezone: updatedUser.timezone
      }
    })
  } catch (error: any) {
    console.error('Error updating portal profile:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
