import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { IncidentModel, UpdateIncidentData } from '@/lib/models/Incident'

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
    const incident = await IncidentModel.getItemById(resolvedParams.id)

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Error fetching incident:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const resolvedParams = await params

    // Get current incident to check if status is changing to resolved/closed
    const currentIncident = await IncidentModel.getItemById(resolvedParams.id)
    if (!currentIncident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    const updateData: UpdateIncidentData = { ...body }

    // Set resolved/closed metadata
    if (body.status === 'Resolved' && currentIncident.status !== 'Resolved') {
      updateData.resolutionNotes = body.resolutionNotes
      updateData.internalResolutionNotes = body.internalResolutionNotes
    }

    const incident = await IncidentModel.updateItem(resolvedParams.id, updateData)

    if (!incident) {
      return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
    }

    return NextResponse.json({ incident })
  } catch (error: any) {
    console.error('Error updating incident:', error)
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
    const success = await IncidentModel.deleteItem(resolvedParams.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting incident:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
