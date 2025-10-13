import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CompanyModel, CreateCompanyData } from '@/lib/models/Company'
import { SLADefinitionModel } from '@/lib/models/SLADefinition'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query: any = {}

    if (searchParams.get('active')) query.active = searchParams.get('active') === 'true'
    if (searchParams.get('search')) query.search = searchParams.get('search')!
    if (searchParams.get('page')) query.page = parseInt(searchParams.get('page')!)
    if (searchParams.get('limit')) query.limit = parseInt(searchParams.get('limit')!)

    const { items, total } = await CompanyModel.getAllItems(query)

    const page = query.page || 1
    const limit = query.limit || 50
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      companies: items,
      pagination: { total, page, limit, totalPages }
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      domain,
      additionalDomains,
      companyCode,
      slaId,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      portalEnabled,
      allowedPortalUsers,
      businessHours
    } = body

    if (!name || !domain || !companyCode || !slaId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get SLA name
    const sla = await SLADefinitionModel.getItemById(slaId)
    if (!sla) {
      return NextResponse.json({ error: 'SLA definition not found' }, { status: 404 })
    }

    const data: CreateCompanyData = {
      name,
      domain,
      additionalDomains,
      companyCode,
      slaId,
      slaName: sla.name,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      portalEnabled: portalEnabled !== false,
      allowedPortalUsers,
      businessHours,
      createdById: session.user.id,
      createdByName: session.user.name
    }

    const company = await CompanyModel.createItem(data)

    return NextResponse.json({ company }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
