import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { ResourcePlannerModel, UpdateResourceAssignmentData } from '@/lib/models/ResourcePlanner'
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

    const assignment = await ResourcePlannerModel.getAssignmentById(params.id)
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error fetching resource assignment:', error)
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
    const updateData: UpdateResourceAssignmentData = body

    // Convert date strings to Date objects if provided
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate)
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate)
    }

    const assignment = await ResourcePlannerModel.updateAssignment(params.id, updateData)
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error updating resource assignment:', error)
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

    const success = await ResourcePlannerModel.deleteAssignment(params.id)
    
    if (!success) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Error deleting resource assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}