import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { SavedQueryModel } from '@/lib/models/SavedQuery'

/**
 * GET /api/incident-management/saved-queries
 * Get all saved queries for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const queries = await SavedQueryModel.getQueriesForUser(session.user.id)

    return NextResponse.json({ queries })
  } catch (error) {
    console.error('Error fetching saved queries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved queries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/incident-management/saved-queries
 * Create a new saved query
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, filters, isGlobal } = body

    // Only admins can create global queries
    if (isGlobal && !session.user.permissions.admin) {
      return NextResponse.json(
        { error: 'Only admins can create global queries' },
        { status: 403 }
      )
    }

    const query = await SavedQueryModel.createQuery({
      name,
      description,
      filters,
      isGlobal: isGlobal || false,
      createdBy: session.user.id,
      createdByName: session.user.name
    })

    return NextResponse.json({ query }, { status: 201 })
  } catch (error) {
    console.error('Error creating saved query:', error)
    return NextResponse.json(
      { error: 'Failed to create saved query' },
      { status: 500 }
    )
  }
}
