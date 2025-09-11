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

async function findWithDevelopmentStatusId(freshdeskAPI: any): Promise<number | null> {
  try {
    // Get all ticket statuses to find the ID for "With Development"
    const statusesResponse = await freshdeskAPI.getTicketStatuses();
    
    if (statusesResponse.error || !statusesResponse.data) {
      console.warn('Could not fetch ticket statuses, trying ticket fields endpoint');
      
      // Fallback: Get all ticket fields and find status field
      const fieldsResponse = await freshdeskAPI.getTicketFields();
      if (fieldsResponse.error || !fieldsResponse.data) {
        return null;
      }
      
      // Find the status field
      const statusField = fieldsResponse.data.find((field: any) => 
        field.name === 'status' || field.label === 'Status'
      );
      
      if (statusField?.choices) {
        const withDevChoice = statusField.choices.find((choice: any) =>
          choice.value?.toLowerCase().includes('development') ||
          choice.label?.toLowerCase().includes('development') ||
          choice.value?.toLowerCase().includes('dev') ||
          choice.label?.toLowerCase().includes('dev')
        );
        
        if (withDevChoice) {
          console.log(`Found "With Development" status with ID: ${withDevChoice.id}`);
          return withDevChoice.id;
        }
      }
    } else {
      // Direct status endpoint response
      const withDevStatus = statusesResponse.data.find((status: any) =>
        status.name?.toLowerCase().includes('development') ||
        status.label?.toLowerCase().includes('development') ||
        status.name?.toLowerCase().includes('dev') ||
        status.label?.toLowerCase().includes('dev')
      );
      
      if (withDevStatus) {
        console.log(`Found "With Development" status with ID: ${withDevStatus.id}`);
        return withDevStatus.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding With Development status ID:', error);
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

    // Step 1: Find the correct status ID for "With Development"
    const withDevStatusId = await findWithDevelopmentStatusId(freshdeskAPI);
    
    let ticketsResponse;
    
    if (withDevStatusId) {
      console.log(`Searching for tickets with status ID: ${withDevStatusId}`);
      // Use the found status ID to get tickets
      ticketsResponse = await freshdeskAPI.getTickets(1, 100, { status: withDevStatusId });
    } else {
      console.log('Could not find "With Development" status ID, trying search query');
      // Fallback to search query
      ticketsResponse = await freshdeskAPI.searchTickets('status:"With Development"');
      
      if (ticketsResponse.error) {
        // Try alternative search terms
        const searchTerms = [
          'status:"with development"',
          'status:"With Dev"',
          'status:"Development"',
          'status:development'
        ];
        
        for (const term of searchTerms) {
          console.log(`Trying search term: ${term}`);
          ticketsResponse = await freshdeskAPI.searchTickets(term);
          if (!ticketsResponse.error && ticketsResponse.data && ticketsResponse.data.length > 0) {
            console.log(`Found tickets with search term: ${term}`);
            break;
          }
        }
      }
    }

    if (ticketsResponse.error) {
      console.error('All attempts to find "With Development" tickets failed');
      return NextResponse.json({
        success: false,
        error: `Could not find tickets with "With Development" status: ${ticketsResponse.error}`,
      }, { status: 500 });
    }

    if (!ticketsResponse.data || ticketsResponse.data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No tickets found with "With Development" status'
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