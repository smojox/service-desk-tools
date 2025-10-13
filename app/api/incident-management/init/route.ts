import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { SLADefinitionModel } from '@/lib/models/SLADefinition'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure default SLA exists
    await SLADefinitionModel.ensureDefaultSLA()

    // Create additional SLA tiers if needed
    const existingSLAs = await SLADefinitionModel.getAllItems()

    if (existingSLAs.length === 1) {
      // Only default exists, create Gold and Silver tiers

      await SLADefinitionModel.createItem({
        name: 'Gold SLA',
        description: 'Premium support tier with fastest response times',
        tier: 1,
        criticalResponseHours: 0.5,
        highResponseHours: 2,
        mediumResponseHours: 4,
        lowResponseHours: 12,
        criticalResolutionHours: 2,
        highResolutionHours: 8,
        mediumResolutionHours: 24,
        lowResolutionHours: 72,
        useBusinessHoursOnly: false,
        autoEscalation: true,
        escalationThresholdPercent: 70,
        isDefault: false
      })

      await SLADefinitionModel.createItem({
        name: 'Silver SLA',
        description: 'Enhanced support tier with priority response',
        tier: 2,
        criticalResponseHours: 1,
        highResponseHours: 3,
        mediumResponseHours: 6,
        lowResponseHours: 18,
        criticalResolutionHours: 4,
        highResolutionHours: 16,
        mediumResolutionHours: 48,
        lowResolutionHours: 120,
        useBusinessHoursOnly: false,
        autoEscalation: true,
        escalationThresholdPercent: 75,
        isDefault: false
      })
    }

    const allSLAs = await SLADefinitionModel.getAllItems()

    return NextResponse.json({
      success: true,
      message: 'Incident Management initialized successfully',
      slaDefinitions: allSLAs
    })
  } catch (error: any) {
    console.error('Error initializing incident management:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
