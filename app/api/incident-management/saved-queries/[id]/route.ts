import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { SavedQueryModel } from '@/lib/models/SavedQuery'

/**
 * GET /api/incident-management/saved-queries/:id
 * Get a specific saved query
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = await SavedQueryModel.getQueryById(params.id)

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    // Check if user has access to this query
    if (!query.isGlobal && query.createdBy !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Increment usage count
    await SavedQueryModel.incrementUsage(params.id)

    return NextResponse.json({ query })
  } catch (error) {
    console.error('Error fetching saved query:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved query' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/incident-management/saved-queries/:id
 * Update a saved query
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const query = await SavedQueryModel.getQueryById(params.id)

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    // Only creator or admin can update
    if (query.createdBy !== session.user.id && !session.user.permissions.admin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, filters, isGlobal } = body

    // Only admins can make queries global
    if (isGlobal && !session.user.permissions.admin) {
      return NextResponse.json(
        { error: 'Only admins can create global queries' },
        { status: 403 }
      )
    }

    const updatedQuery = await SavedQueryModel.updateQuery(params.id, {
      name,
      description,
      filters,
      isGlobal
    })

    return NextResponse.json({ query: updatedQuery })
  } catch (error) {
    console.error('Error updating saved query:', error)
    return NextResponse.json(
      { error: 'Failed to update saved query' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/incident-management/saved-queries/:id
 * Delete a saved query
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await SavedQueryModel.deleteQuery(params.id, session.user.id)

    if (!success) {
      return NextResponse.json(
        { error: 'Query not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved query:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved query' },
      { status: 500 }
    )
  }
}
