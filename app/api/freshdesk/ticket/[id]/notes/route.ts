import { NextRequest, NextResponse } from 'next/server';
import { createFreshdeskAPI } from '@/lib/freshdesk-api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { noteBody } = await request.json();
    
    if (!noteBody) {
      return NextResponse.json(
        { error: 'Note body is required' },
        { status: 400 }
      );
    }

    console.log(`Creating private note for ticket ${id}:`, noteBody)

    const domain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN;
    const apiKey = process.env.FRESHDESK_API_KEY;

    if (!domain || !apiKey) {
      return NextResponse.json(
        { error: 'Freshdesk configuration missing' },
        { status: 500 }
      );
    }

    const freshdeskAPI = createFreshdeskAPI(domain, apiKey);
    const result = await freshdeskAPI.addPrivateNote(id, noteBody);

    console.log(`Freshdesk API result for note creation:`, result)

    if (result.error) {
      console.error(`Failed to create note for ticket ${id}:`, result.error)
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 500 }
      );
    }

    console.log(`Successfully created private note for ticket ${id}`)
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error creating private note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}