import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CSITrackerModel } from '@/lib/models/CSITracker'
import { ObjectId } from 'mongodb'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    const item = await CSITrackerModel.addComment(
      params.id,
      content.trim(),
      session.user.id,
      session.user.name
    )
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error adding comment to CSI tracker item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}