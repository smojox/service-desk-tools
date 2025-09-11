import { NextResponse } from 'next/server';
import { createFreshdeskAPI } from '@/lib/freshdesk-api';

export async function GET() {
  try {
    const domain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN;
    const apiKey = process.env.FRESHDESK_API_KEY;

    if (!domain || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Freshdesk configuration missing',
      }, { status: 500 });
    }

    const freshdeskAPI = createFreshdeskAPI(domain, apiKey);

    // Try to get statuses from the ticket fields endpoint
    const fieldsResponse = await freshdeskAPI.getTicketFields();
    
    if (fieldsResponse.error) {
      return NextResponse.json({
        success: false,
        error: fieldsResponse.error,
      });
    }

    // Find the status field
    const statusField = fieldsResponse.data?.find((field: any) => 
      field.name === 'status' || field.label === 'Status'
    );

    if (statusField?.choices) {
      return NextResponse.json({
        success: true,
        statuses: statusField.choices,
        statusField: {
          id: statusField.id,
          name: statusField.name,
          label: statusField.label,
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Could not find status field or choices',
      fields: fieldsResponse.data?.map((field: any) => ({
        id: field.id,
        name: field.name,
        label: field.label,
        type: field.type
      }))
    });

  } catch (error) {
    console.error('Freshdesk statuses API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}