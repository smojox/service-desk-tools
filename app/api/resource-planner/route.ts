import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { ResourcePlannerModel, CreateResourceAssignmentData } from '@/lib/models/ResourcePlanner'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const assignedToId = searchParams.get('assignedToId')

    let assignments

    if (startDate && endDate && (userId || assignedToId)) {
      // First get by date range, then filter by user
      assignments = await ResourcePlannerModel.getAssignmentsByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
      const filterUserId = userId || assignedToId
      assignments = assignments.filter(assignment => 
        assignment.assignedToId.toString() === filterUserId
      )
    } else if (startDate && endDate) {
      assignments = await ResourcePlannerModel.getAssignmentsByDateRange(
        new Date(startDate),
        new Date(endDate)
      )
    } else if (userId || assignedToId) {
      assignments = await ResourcePlannerModel.getAssignmentsByUser(userId || assignedToId)
    } else {
      assignments = await ResourcePlannerModel.getAllAssignments()
    }

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching resource assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      assignedToId, 
      assignedToName, 
      startDate, 
      endDate,
      startTime,
      endTime,
      isAllDay,
      priority,
      linkedItemId,
      linkedItemType,
      linkedItemRef,
      location,
      estimatedHours,
      notes,
      tags
    } = body

    if (!title || !assignedToId || !assignedToName || !startDate || !endDate || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const data: CreateResourceAssignmentData = {
      title,
      description,
      assignedToId,
      assignedToName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      isAllDay: isAllDay || false,
      priority,
      linkedItemId,
      linkedItemType,
      linkedItemRef,
      location,
      estimatedHours,
      notes,
      tags,
      createdById: session.user.id,
      createdByName: session.user.name
    }

    const assignment = await ResourcePlannerModel.createAssignment(data)
    
    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating resource assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}