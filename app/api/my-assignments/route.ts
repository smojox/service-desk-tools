import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PriorityTrackerModel } from '@/lib/models/PriorityTracker'
import { CSITrackerModel } from '@/lib/models/CSITracker'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = new ObjectId(session.user.id)
    
    const [priorityItems, csiItems] = await Promise.all([
      PriorityTrackerModel.getItemsByAssignee(userId),
      CSITrackerModel.getItemsByAssignee(userId)
    ])

    // Filter for open items only and sort by creation date
    const activePriorityItems = priorityItems
      .filter(item => item.status !== 'Closed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    const activeCSIItems = csiItems
      .filter(item => item.status !== 'Closed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      priorityItems: activePriorityItems,
      csiItems: activeCSIItems,
      summary: {
        totalAssigned: activePriorityItems.length + activeCSIItems.length,
        priorityCount: activePriorityItems.length,
        csiCount: activeCSIItems.length,
        onHoldCount: activePriorityItems.filter(item => item.status === 'On Hold').length + 
                     activeCSIItems.filter(item => item.status === 'On Hold').length,
        csiNearCompletion: activeCSIItems.filter(item => item.percentComplete >= 80).length
      }
    })
  } catch (error) {
    console.error('Error fetching user assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}