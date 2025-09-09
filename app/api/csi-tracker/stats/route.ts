import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { CSITrackerModel } from '@/lib/models/CSITracker'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await CSITrackerModel.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching CSI tracker stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}