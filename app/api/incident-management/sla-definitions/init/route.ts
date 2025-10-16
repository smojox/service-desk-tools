import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { SLADefinitionModel } from '@/lib/models/SLADefinition'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await SLADefinitionModel.ensureDefaultSLA()

    return NextResponse.json({ message: 'Default SLA definitions initialized' }, { status: 200 })
  } catch (error: any) {
    console.error('Error initializing SLA definitions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
