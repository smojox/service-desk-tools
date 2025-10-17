import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { IncidentModel, CreateIncidentData } from '@/lib/models/Incident'
import { PortalUserModel } from '@/lib/models/PortalUser'
import { CompanyModel } from '@/lib/models/Company'
import { SLADefinitionModel } from '@/lib/models/SLADefinition'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyPortalAuth(request)

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get portal user to check permissions
    const portalUser = await PortalUserModel.getItemById(auth.userId)

    if (!portalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Build query filter
    const query: any = {
      companyId: auth.companyId
    }

    // If user can only see their own incidents, filter by reportedById
    if (!portalUser.canViewAllCompanyIncidents) {
      query.reportedById = auth.userId
    }

    if (status) {
      query.status = status
    }

    const result = await IncidentModel.getAllItems(query)

    return NextResponse.json({
      incidents: result.items
    })
  } catch (error: any) {
    console.error('Error fetching portal incidents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyPortalAuth(request)

    if (!auth) {
      console.error('Portal auth failed')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get portal user to check permissions
    const portalUser = await PortalUserModel.getItemById(auth.userId)

    if (!portalUser) {
      console.error('Portal user not found:', auth.userId)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!portalUser.canCreateIncidents) {
      console.error('User does not have create permission:', auth.userId)
      return NextResponse.json({ error: 'You do not have permission to create incidents' }, { status: 403 })
    }

    const body = await request.json()
    console.log('Creating portal incident with body:', body)

    // Get company and SLA definition
    const company = await CompanyModel.getItemById(auth.companyId)
    if (!company) {
      console.error('Company not found:', auth.companyId)
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    const slaDefinition = await SLADefinitionModel.getItemById(company.slaId)
    if (!slaDefinition) {
      console.error('SLA definition not found for company:', auth.companyId)
      return NextResponse.json({ error: 'SLA definition not found' }, { status: 500 })
    }

    // Map priority to urgency and impact
    // For customer portal, we derive urgency and impact from the priority they select
    let urgency: 'Low' | 'Medium' | 'High' | 'Critical'
    let impact: 'Low' | 'Medium' | 'High' | 'Critical'

    switch (body.priority || 'medium') {
      case 'critical':
        urgency = 'Critical'
        impact = 'Critical'
        break
      case 'high':
        urgency = 'High'
        impact = 'High'
        break
      case 'low':
        urgency = 'Low'
        impact = 'Low'
        break
      case 'medium':
      default:
        urgency = 'Medium'
        impact = 'Medium'
        break
    }

    const createData: CreateIncidentData = {
      subject: body.title,
      description: body.description,
      companyId: auth.companyId,
      reportedByEmail: portalUser.email,
      reportedByName: portalUser.name,
      reportedByType: 'customer',
      urgency,
      impact,
      category: body.category || 'General',
      subcategory: body.subCategory,
      linkedFreshdeskTickets: [],
      linkedJiraTickets: [],
      createdById: auth.userId,
      createdByName: portalUser.name
    }

    console.log('Creating incident with data:', createData)
    const incident = await IncidentModel.createItem(createData, slaDefinition, company)
    console.log('Created incident:', incident)

    // Update company statistics
    await CompanyModel.updateStatistics(auth.companyId)

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating portal incident:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
