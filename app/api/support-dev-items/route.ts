import { NextResponse } from 'next/server';
import { createFreshdeskAPI, FreshdeskTicket } from '@/lib/freshdesk-api';
import JiraClient from '@/lib/jira-client';

interface JiraTicketInfo {
  key: string;
  status: string;
  fixVersion: string | null;
  summary: string;
}

interface SupportDevItem {
  freshdeskTicket: FreshdeskTicket;
  jiraInfo: JiraTicketInfo | null;
  error?: string;
}

// Extract JIRA ticket references from Freshdesk ticket content
function extractJiraReferences(ticket: FreshdeskTicket): string[] {
  const jiraKeyPattern = /\b[A-Z]+-\d+\b/g;
  const references = new Set<string>();
  
  // Check subject
  const subjectMatches = ticket.subject.match(jiraKeyPattern);
  if (subjectMatches) {
    subjectMatches.forEach(ref => references.add(ref));
  }
  
  // Check description
  if (ticket.description) {
    const descMatches = ticket.description.match(jiraKeyPattern);
    if (descMatches) {
      descMatches.forEach(ref => references.add(ref));
    }
  }
  
  // Check custom fields for JIRA references
  if (ticket.custom_fields) {
    Object.values(ticket.custom_fields).forEach(value => {
      if (typeof value === 'string') {
        const customMatches = value.match(jiraKeyPattern);
        if (customMatches) {
          customMatches.forEach(ref => references.add(ref));
        }
      }
    });
  }
  
  return Array.from(references);
}

async function getJiraTicketInfo(jiraClient: JiraClient, ticketKey: string): Promise<JiraTicketInfo | null> {
  try {
    const ticket = await jiraClient.getTicketByKey(ticketKey);
    
    if (!ticket) {
      return null;
    }
    
    return {
      key: ticket.key,
      status: ticket.fields.status.name,
      fixVersion: ticket.fields.fixVersions && ticket.fields.fixVersions.length > 0 
        ? ticket.fields.fixVersions[0].name 
        : null,
      summary: ticket.fields.summary,
    };
  } catch (error) {
    console.warn(`Error fetching JIRA ticket ${ticketKey}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const freshdeskDomain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN;
    const freshdeskApiKey = process.env.FRESHDESK_API_KEY;

    if (!freshdeskDomain || !freshdeskApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Freshdesk configuration missing',
      }, { status: 500 });
    }

    // Check JIRA configuration
    if (!process.env.JIRA_URL || !process.env.JIRA_USERNAME || !process.env.JIRA_API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'JIRA configuration missing',
      }, { status: 500 });
    }

    const freshdeskAPI = createFreshdeskAPI(freshdeskDomain, freshdeskApiKey);
    const jiraClient = new JiraClient();

    // Search for tickets with "With Development" status
    // Try multiple approaches to find "With Development" tickets
    let ticketsResponse;
    
    // Approach 1: Search by status name
    ticketsResponse = await freshdeskAPI.searchTickets('status:"With Development"');
    
    if (ticketsResponse.error) {
      console.warn('Search by status name failed, trying status ID approach');
      
      // Approach 2: Try common status IDs for "With Development"
      const commonDevStatusIds = [11, 12, 13, 14, 15]; // Common IDs for development status
      
      for (const statusId of commonDevStatusIds) {
        const response = await freshdeskAPI.getTickets(1, 100, { status: statusId });
        if (!response.error && response.data && response.data.length > 0) {
          ticketsResponse = response;
          console.log(`Found tickets with status ID: ${statusId}`);
          break;
        }
      }
      
      // If still no results, fall back to getting recent tickets
      if (ticketsResponse.error) {
        console.warn('All status-specific searches failed, getting recent tickets');
        ticketsResponse = await freshdeskAPI.getTickets(1, 50); // Get recent 50 tickets
        
        if (ticketsResponse.error) {
          throw new Error(`Failed to fetch Freshdesk tickets: ${ticketsResponse.error}`);
        }
      }
    }

    if (!ticketsResponse.data) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const items: SupportDevItem[] = [];

    // Process each Freshdesk ticket
    for (const ticket of ticketsResponse.data) {
      try {
        const jiraRefs = extractJiraReferences(ticket);
        
        if (jiraRefs.length > 0) {
          // Use the first JIRA reference found
          const jiraInfo = await getJiraTicketInfo(jiraClient, jiraRefs[0]);
          items.push({
            freshdeskTicket: ticket,
            jiraInfo,
          });
        } else {
          // Include tickets without JIRA references
          items.push({
            freshdeskTicket: ticket,
            jiraInfo: null,
          });
        }
      } catch (error) {
        console.error(`Error processing ticket ${ticket.id}:`, error);
        // Still include the ticket but with error info
        items.push({
          freshdeskTicket: ticket,
          jiraInfo: null,
          error: error instanceof Error ? error.message : 'Unknown error processing ticket',
        });
      }
    }

    // Sort items by Freshdesk ticket creation date (most recent first)
    items.sort((a, b) => {
      return new Date(b.freshdeskTicket.created_at).getTime() - new Date(a.freshdeskTicket.created_at).getTime();
    });

    return NextResponse.json({
      success: true,
      data: items,
    });

  } catch (error) {
    console.error('Support dev items API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}