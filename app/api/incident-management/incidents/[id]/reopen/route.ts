import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { IncidentModel } from '@/lib/models/Incident'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    const incident = await IncidentModel.reopenIncident(
      params.id,
      session.user.id,
      session.user.name,
      reason
    )

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ incident })
  } catch (error: any) {
    console.error('Error reopening incident:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
