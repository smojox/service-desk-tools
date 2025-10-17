import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { IncidentModel } from '@/lib/models/Incident'
import { PortalUserModel } from '@/lib/models/PortalUser'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    const auth = await verifyPortalAuth(request)

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const incident = await IncidentModel.getItemByRef(resolvedParams.ref)

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    // Get portal user to check permissions
    const portalUser = await PortalUserModel.getItemById(auth.userId)

    if (!portalUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the incident belongs to the user's company
    if (incident.companyId.toString() !== auth.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If user can't view all company incidents, verify it's their incident
    if (!portalUser.canViewAllCompanyIncidents && incident.reportedById?.toString() !== auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if user can add comments
    if (!portalUser.canAddComments) {
      return NextResponse.json({ error: 'You do not have permission to add comments' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Add customer update
    const updatedIncident = await IncidentModel.addCustomerUpdate(
      incident._id!,
      content,
      auth.userId,
      portalUser.name,
      'customer',
      true // visibleToCustomer
    )

    return NextResponse.json({ incident: updatedIncident })
  } catch (error: any) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
