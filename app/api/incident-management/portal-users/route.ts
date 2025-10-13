import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PortalUserModel, CreatePortalUserData } from '@/lib/models/PortalUser'
import { CompanyModel } from '@/lib/models/Company'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query: any = {}

    if (searchParams.get('companyId')) query.companyId = searchParams.get('companyId')!
    if (searchParams.get('active')) query.active = searchParams.get('active') === 'true'
    if (searchParams.get('search')) query.search = searchParams.get('search')!

    const portalUsers = await PortalUserModel.getAllItems(query)

    return NextResponse.json({ portalUsers })
  } catch (error) {
    console.error('Error fetching portal users:', error)
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
    const { name, email, phone, jobTitle, companyId, role, sendWelcomeEmail, password } = body

    if (!name || !email || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get company name
    const company = await CompanyModel.getItemById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const data: CreatePortalUserData = {
      name,
      email,
      phone,
      jobTitle,
      companyId,
      companyName: company.name,
      role: role || 'user',
      password,
      sendWelcomeEmail: sendWelcomeEmail || false,
      createdById: session.user.id,
      createdByName: session.user.name
    }

    const { user: portalUser, magicLink } = await PortalUserModel.createItem(data)

    return NextResponse.json({ portalUser, magicLink }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating portal user:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
