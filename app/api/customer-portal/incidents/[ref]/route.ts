import { NextRequest, NextResponse } from 'next/server'
import { verifyPortalAuth } from '@/lib/portal-auth'
import { IncidentModel } from '@/lib/models/Incident'
import { PortalUserModel } from '@/lib/models/PortalUser'

export async function GET(
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

    return NextResponse.json({ incident })
  } catch (error: any) {
    console.error('Error fetching portal incident:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
