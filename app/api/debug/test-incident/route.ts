import { NextRequest, NextResponse } from 'next/server'
import { IncidentModel } from '@/lib/models/Incident'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection(COLLECTIONS.INCIDENTS)

    // Get the most recently created incidents
    const incidents = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    return NextResponse.json({
      count: incidents.length,
      incidents: incidents.map(inc => ({
        ref: inc.ref,
        subject: inc.subject,
        urgency: inc.urgency,
        impact: inc.impact,
        priority: inc.priority,
        createdAt: inc.createdAt,
        reportedByType: inc.reportedByType
      }))
    })
  } catch (error: any) {
    console.error('Error fetching incidents:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
