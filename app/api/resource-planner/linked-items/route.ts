import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { PriorityTrackerModel } from '@/lib/models/PriorityTracker'
import { CSITrackerModel } from '@/lib/models/CSITracker'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all open Priority and CSI items for linking
    const [priorityItems, csiItems] = await Promise.all([
      PriorityTrackerModel.getItemsByStatus('Open'),
      CSITrackerModel.getItemsByStatus('Open')
    ])

    const linkedItems = {
      priority: priorityItems.map(item => ({
        _id: item._id,
        ref: item.ref,
        summary: item.summary,
        assignedToName: item.assignedToName,
        companyName: item.companyName,
        type: 'priority' as const
      })),
      csi: csiItems.map(item => ({
        _id: item._id,
        ref: item.ref,
        summary: item.summary,
        assignedToName: item.assignedToName,
        companyName: item.companyName,
        percentComplete: item.percentComplete,
        type: 'csi' as const
      }))
    }

    return NextResponse.json(linkedItems)
  } catch (error) {
    console.error('Error fetching linked items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}