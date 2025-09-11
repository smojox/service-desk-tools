import { NextResponse } from 'next/server';
import { createFreshdeskAPI } from '@/lib/freshdesk-api';

export async function GET() {
  try {
    const domain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN;
    const apiKey = process.env.FRESHDESK_API_KEY;

    if (!domain || !apiKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Freshdesk configuration. Please check environment variables.',
        details: {
          domain: !!domain,
          apiKey: !!apiKey,
        },
      });
    }

    const freshdeskAPI = createFreshdeskAPI(domain, apiKey);

    // Test basic connection by getting ticket fields
    const fieldsResponse = await freshdeskAPI.getTicketFields();

    if (fieldsResponse.error) {
      return NextResponse.json({
        success: false,
        error: fieldsResponse.error,
        status: fieldsResponse.status,
      });
    }

    return NextResponse.json({
      success: true,
      domain: domain,
      fieldsCount: fieldsResponse.data?.length || 0,
    });

  } catch (error) {
    console.error('Freshdesk test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}