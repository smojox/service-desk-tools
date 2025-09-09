import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PriorityTrackerModel, UpdatePriorityTrackerData } from '@/lib/models/PriorityTracker'
import { ObjectId } from 'mongodb'

export async function GET(
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

    const item = await PriorityTrackerModel.getItemById(params.id)
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching priority tracker item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const updateData: UpdatePriorityTrackerData = body

    const item = await PriorityTrackerModel.updateItem(params.id, updateData)
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating priority tracker item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const success = await PriorityTrackerModel.deleteItem(params.id)
    
    if (!success) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting priority tracker item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}