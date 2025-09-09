import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CSITrackerModel, CreateCSITrackerData } from '@/lib/models/CSITracker'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const items = await CSITrackerModel.getAllItems()
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching CSI tracker items:', error)
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
    const { summary, companyName, assignedToId, assignedToName, linkedFreshdeskTickets, linkedJiraTickets, targetCompletionDate, category } = body

    if (!summary || !companyName || !assignedToId || !assignedToName || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const data: CreateCSITrackerData = {
      summary,
      companyName,
      assignedToId,
      assignedToName,
      linkedFreshdeskTickets: linkedFreshdeskTickets || [],
      linkedJiraTickets: linkedJiraTickets || [],
      createdById: session.user.id,
      createdByName: session.user.name,
      targetCompletionDate: targetCompletionDate ? new Date(targetCompletionDate) : undefined,
      category
    }

    const item = await CSITrackerModel.createItem(data)
    
    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    console.error('Error creating CSI tracker item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}