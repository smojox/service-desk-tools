import { NextResponse } from 'next/server';
import JiraClient from '@/lib/jira-client';

export async function GET() {
  try {
    const jiraClient = new JiraClient();
    const tickets = await jiraClient.getOutstandingTickets();
    
    return NextResponse.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.error('JIRA API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}