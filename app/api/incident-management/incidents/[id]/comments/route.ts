import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { IncidentModel } from '@/lib/models/Incident'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, commentType } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const resolvedParams = await params
    let incident

    if (commentType === 'private') {
      // Add internal note (not visible to customer)
      incident = await IncidentModel.addInternalNote(
        resolvedParams.id,
        content,
        session.user.id,
        session.user.name,
        'standard'
      )
    } else {
      // Add customer update (visible to customer)
      // commentType can be 'reply' or 'note'
      incident = await IncidentModel.addCustomerUpdate(
        resolvedParams.id,
        content,
        session.user.id,
        session.user.name,
        'agent',
        true
      )

      // If it's a reply, send email notification
      if (commentType === 'reply' && incident) {
        // TODO: Implement email notification to incident.reportedByEmail
        // For now, just log that an email should be sent
        console.log(`Email notification should be sent to ${incident.reportedByEmail} for incident ${incident.ref}`)
        console.log(`Subject: Update on your incident ${incident.ref}`)
        console.log(`Content: ${content}`)
      }
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
