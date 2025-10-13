import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { IncidentModel, CreateIncidentData } from '@/lib/models/Incident'
import { CompanyModel } from '@/lib/models/Company'
import { SLADefinitionModel } from '@/lib/models/SLADefinition'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query: any = {}

    if (searchParams.get('companyId')) query.companyId = searchParams.get('companyId')!
    if (searchParams.get('status')) query.status = searchParams.get('status')!.split(',')
    if (searchParams.get('priority')) query.priority = searchParams.get('priority')!.split(',')
    if (searchParams.get('assignedToId')) query.assignedToId = searchParams.get('assignedToId')!
    if (searchParams.get('reportedById')) query.reportedById = searchParams.get('reportedById')!
    if (searchParams.get('fromDate')) query.fromDate = searchParams.get('fromDate')!
    if (searchParams.get('toDate')) query.toDate = searchParams.get('toDate')!
    if (searchParams.get('search')) query.search = searchParams.get('search')!
    if (searchParams.get('page')) query.page = parseInt(searchParams.get('page')!)
    if (searchParams.get('limit')) query.limit = parseInt(searchParams.get('limit')!)
    if (searchParams.get('sortBy')) query.sortBy = searchParams.get('sortBy') as any
    if (searchParams.get('sortOrder')) query.sortOrder = searchParams.get('sortOrder') as any

    const { items, total } = await IncidentModel.getAllItems(query)

    const page = query.page || 1
    const limit = query.limit || 50
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      incidents: items,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching incidents:', error)
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
    const {
      subject,
      description,
      companyId,
      reportedByEmail,
      reportedByName,
      urgency,
      impact,
      category,
      subcategory,
      assignedToId,
      assignedToName,
      teamId,
      teamName,
      linkedFreshdeskTickets,
      linkedJiraTickets
    } = body

    // Validate required fields
    if (!subject || !description || !companyId || !urgency || !impact || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get company and SLA definition
    const company = await CompanyModel.getItemById(companyId)
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const slaDefinition = await SLADefinitionModel.getItemById(company.slaId)
    if (!slaDefinition) {
      return NextResponse.json({ error: 'SLA definition not found' }, { status: 404 })
    }

    const data: CreateIncidentData = {
      subject,
      description,
      companyId,
      reportedByEmail: reportedByEmail || session.user.email,
      reportedByName: reportedByName || session.user.name,
      reportedByType: 'internal',
      urgency,
      impact,
      category,
      subcategory,
      assignedToId,
      assignedToName,
      teamId,
      teamName,
      linkedFreshdeskTickets,
      linkedJiraTickets,
      createdById: session.user.id,
      createdByName: session.user.name
    }

    const incident = await IncidentModel.createItem(data, slaDefinition, company)

    // Update company statistics
    await CompanyModel.updateStatistics(companyId)

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating incident:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
