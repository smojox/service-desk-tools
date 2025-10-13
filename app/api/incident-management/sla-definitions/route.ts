import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { SLADefinitionModel, CreateSLADefinitionData } from '@/lib/models/SLADefinition'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const slaDefinitions = await SLADefinitionModel.getAllItems()

    return NextResponse.json({ slaDefinitions })
  } catch (error) {
    console.error('Error fetching SLA definitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      tier,
      criticalResponseHours,
      highResponseHours,
      mediumResponseHours,
      lowResponseHours,
      criticalResolutionHours,
      highResolutionHours,
      mediumResolutionHours,
      lowResolutionHours,
      useBusinessHoursOnly,
      defaultBusinessHours,
      autoEscalation,
      escalationThresholdPercent,
      notificationRules,
      monthlyCost,
      perIncidentCost,
      isDefault
    } = body

    if (!name || !description || tier === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const data: CreateSLADefinitionData = {
      name,
      description,
      tier,
      criticalResponseHours: criticalResponseHours || 1,
      highResponseHours: highResponseHours || 4,
      mediumResponseHours: mediumResponseHours || 8,
      lowResponseHours: lowResponseHours || 24,
      criticalResolutionHours: criticalResolutionHours || 4,
      highResolutionHours: highResolutionHours || 24,
      mediumResolutionHours: mediumResolutionHours || 72,
      lowResolutionHours: lowResolutionHours || 168,
      useBusinessHoursOnly: useBusinessHoursOnly || false,
      defaultBusinessHours,
      autoEscalation: autoEscalation !== false,
      escalationThresholdPercent: escalationThresholdPercent || 80,
      notificationRules,
      monthlyCost,
      perIncidentCost,
      isDefault
    }

    const slaDefinition = await SLADefinitionModel.createItem(data)

    return NextResponse.json({ slaDefinition }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating SLA definition:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
