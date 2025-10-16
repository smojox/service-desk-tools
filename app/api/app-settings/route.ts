import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { AppSettingsModel, WidgetConfig } from '@/lib/models/AppSettings'

/**
 * GET /api/app-settings
 * Get widget configuration
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const widgets = await AppSettingsModel.getWidgetConfig()

    return NextResponse.json({ widgets })
  } catch (error) {
    console.error('Error fetching app settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch app settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/app-settings
 * Update widget configuration (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.permissions.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { widgets } = await request.json() as { widgets: WidgetConfig[] }

    if (!widgets || !Array.isArray(widgets)) {
      return NextResponse.json(
        { error: 'Invalid widget configuration' },
        { status: 400 }
      )
    }

    const success = await AppSettingsModel.updateWidgetConfig(widgets, session.user.email)

    if (success) {
      return NextResponse.json({ success: true, widgets })
    } else {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating app settings:', error)
    return NextResponse.json(
      { error: 'Failed to update app settings' },
      { status: 500 }
    )
  }
}
