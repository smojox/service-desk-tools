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
    const { content, visibleToCustomer, noteType } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    let incident

    if (visibleToCustomer !== false) {
      // Add customer update
      incident = await IncidentModel.addCustomerUpdate(
        params.id,
        content,
        session.user.id,
        session.user.name,
        'agent',
        visibleToCustomer !== false
      )
    } else {
      // Add internal note
      incident = await IncidentModel.addInternalNote(
        params.id,
        content,
        session.user.id,
        session.user.name,
        noteType || 'standard'
      )
    }

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ incident })
  } catch (error: any) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
