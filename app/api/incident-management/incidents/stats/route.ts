import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { IncidentModel } from '@/lib/models/Incident'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('companyId') || undefined
    const fromDate = searchParams.get('fromDate') || undefined
    const toDate = searchParams.get('toDate') || undefined

    const stats = await IncidentModel.getStats(companyId, fromDate, toDate)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching incident stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
