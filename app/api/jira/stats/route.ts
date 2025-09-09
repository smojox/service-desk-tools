import { NextResponse } from 'next/server';
import JiraClient from '@/lib/jira-client';

export async function GET() {
  try {
    const jiraClient = new JiraClient();
    const stats = await jiraClient.getTicketCounts();
    
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('JIRA Stats API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}