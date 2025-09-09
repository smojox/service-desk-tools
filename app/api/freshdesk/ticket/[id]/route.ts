import { NextRequest, NextResponse } from 'next/server'
import { createFreshdeskAPI } from '@/lib/freshdesk-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const domain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN
    const apiKey = process.env.FRESHDESK_API_KEY

    if (!domain || !apiKey) {
      return NextResponse.json(
        { error: 'Freshdesk configuration not found' },
        { status: 500 }
      )
    }

    const freshdeskAPI = createFreshdeskAPI(domain, apiKey)
    const response = await freshdeskAPI.getTicket(id)

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      )
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const domain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN
    const apiKey = process.env.FRESHDESK_API_KEY

    if (!domain || !apiKey) {
      return NextResponse.json(
        { error: 'Freshdesk configuration not found' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { fieldName, fieldValue } = body

    if (!fieldName || fieldValue === undefined) {
      return NextResponse.json(
        { error: 'fieldName and fieldValue are required' },
        { status: 400 }
      )
    }

    const freshdeskAPI = createFreshdeskAPI(domain, apiKey)
    const response = await freshdeskAPI.updateTicketCustomField(id, fieldName, fieldValue)

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: response.status || 500 }
      )
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}