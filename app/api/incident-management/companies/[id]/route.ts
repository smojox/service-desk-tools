import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CompanyModel, UpdateCompanyData } from '@/lib/models/Company'
import { IncidentModel } from '@/lib/models/Incident'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const company = await CompanyModel.getItemById(params.id)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get recent incidents
    const { items: recentIncidents } = await IncidentModel.getAllItems({
      companyId: params.id,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })

    return NextResponse.json({ company, recentIncidents })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateData: UpdateCompanyData = { ...body }

    const company = await CompanyModel.updateItem(params.id, updateData)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ company })
  } catch (error: any) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await CompanyModel.deleteItem(params.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
