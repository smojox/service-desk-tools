import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { ResourcePlannerModel } from '@/lib/models/ResourcePlanner'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await ResourcePlannerModel.getStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching resource planner stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}