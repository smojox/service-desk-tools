import { NextRequest, NextResponse } from 'next/server'
import { IncidentModel } from '@/lib/models/Incident'

/**
 * Bulk update SLA statuses for all open incidents
 * This endpoint should be called periodically by a cron job
 * For security, it can be protected with an API key
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for API key in production
    const apiKey = request.headers.get('x-api-key')
    if (process.env.CRON_API_KEY && apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updatedCount = await IncidentModel.updateSLAStatuses()

    return NextResponse.json({
      success: true,
      message: `Updated SLA statuses for ${updatedCount} incidents`,
      updatedCount
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating SLA statuses:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// Allow GET for testing/manual triggering (remove in production if not needed)
export async function GET(request: NextRequest) {
  return POST(request)
}
