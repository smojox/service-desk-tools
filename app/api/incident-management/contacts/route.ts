import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { ContactModel, CreateContactData } from '@/lib/models/Contact'
import { PortalUserModel } from '@/lib/models/PortalUser'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const companyId = searchParams.get('companyId')
    const search = searchParams.get('search')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    const query: any = {}

    if (active !== null) {
      query.active = active === 'true'
    }

    if (companyId) {
      query.companyId = companyId
    }

    if (search) {
      query.search = search
    }

    if (page) {
      query.page = parseInt(page)
    }

    if (limit) {
      query.limit = parseInt(limit)
    }

    const result = await ContactModel.getAllItems(query)

    return NextResponse.json({
      contacts: result.items,
      total: result.total,
      page: query.page || 1,
      limit: query.limit || 50
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const createData: CreateContactData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      jobTitle: body.jobTitle,
      department: body.department,
      companyId: body.companyId,
      companyName: body.companyName,
      portalAccess: body.portalAccess,
      canLogIncidents: body.canLogIncidents,
      receiveNotifications: body.receiveNotifications,
      preferredLanguage: body.preferredLanguage,
      timezone: body.timezone,
      createdById: session.user.id,
      createdByName: session.user.name
    }

    const contact = await ContactModel.createItem(createData)

    // If portal access is enabled and password is provided, create portal user
    if (body.portalAccess && body.portalPassword) {
      try {
        await PortalUserModel.createItem({
          name: body.name,
          email: body.email,
          phone: body.phone,
          jobTitle: body.jobTitle,
          companyId: body.companyId,
          companyName: body.companyName,
          password: body.portalPassword,
          role: 'user',
          createdById: session.user.id,
          createdByName: session.user.name
        })
      } catch (portalError: any) {
        console.error('Error creating portal user:', portalError)
        // If portal user creation fails, we still return the contact
        // but we could add a warning here
      }
    }

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
