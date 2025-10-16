import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CompanyModel, UpdateCompanyData } from '@/lib/models/Company'
import { SLADefinitionModel } from '@/lib/models/SLADefinition'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const company = await CompanyModel.getItemById(resolvedParams.id)

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Error fetching company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const resolvedParams = await params

    const updateData: UpdateCompanyData = { ...body }

    // If SLA is being updated, fetch the SLA name
    if (body.slaId) {
      const sla = await SLADefinitionModel.getItemById(body.slaId)
      if (!sla) {
        return NextResponse.json({ error: 'SLA definition not found' }, { status: 404 })
      }
      updateData.slaName = sla.name
    }

    const company = await CompanyModel.updateItem(resolvedParams.id, updateData)

    if (!company) {
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return NextResponse.json({ company })
  } catch (error: any) {
    console.error('Error updating company:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const success = await CompanyModel.deleteItem(resolvedParams.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
