import https from 'https';

// Set up global SSL configuration for development
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

interface JiraTicket {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee: {
      displayName: string;
      emailAddress: string;
    } | null;
    priority: {
      name: string;
    };
    created: string;
    updated: string;
  };
}

interface JiraSearchResponse {
  issues: JiraTicket[];
  total: number;
  maxResults: number;
}

class JiraClient {
  private baseUrl: string;
  private username: string;
  private apiToken: string;
  private projectKey: string;

  constructor() {
    this.baseUrl = process.env.JIRA_URL || '';
    this.username = process.env.JIRA_USERNAME || '';
    this.apiToken = process.env.JIRA_API_TOKEN || '';
    this.projectKey = process.env.JIRA_PROJECT_KEY || '';
  }

  private getAuthHeader(): string {
    // For Atlassian Cloud, use email:api_token for Basic Auth
    return Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
  }

  async getOutstandingTickets(): Promise<JiraTicket[]> {
    try {
      const jql = `project=${this.projectKey} AND resolution=unresolved ORDER BY created DESC`;
      // Use the new v3/search/jql POST endpoint
      const url = `${this.baseUrl}/rest/api/3/search/jql`;

      const requestBody = {
        jql: jql,
        maxResults: 100,
        fields: ['key', 'summary', 'status', 'assignee', 'priority', 'created', 'updated']
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.getAuthHeader()}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'ServiceDeskTools/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`JIRA API Error - Status: ${response.status}, Response: ${errorText}`);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your JIRA credentials.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Check your permissions for the Support Assists project.');
        } else if (response.status === 404) {
          throw new Error('JIRA project "SUP" not found. Please verify the project key.');
        } else {
          throw new Error(`JIRA API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const data: JiraSearchResponse = await response.json();
      return data.issues;
    } catch (error) {
      console.error('Error fetching JIRA tickets:', error);
      
      // Add more specific error handling
      if (error instanceof Error) {
        if (error.message.includes('fetch failed')) {
          throw new Error('Unable to connect to JIRA. Please check the JIRA URL and network connection.');
        } else if (error.message.includes('certificate')) {
          throw new Error('SSL certificate error. This may be a development environment issue.');
        }
      }
      
      throw error;
    }
  }

  async getTicketCounts(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byAssignee: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const tickets = await this.getOutstandingTickets();
    
    const byStatus: Record<string, number> = {};
    const byAssignee: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    tickets.forEach(ticket => {
      // Count by status
      const status = ticket.fields.status.name;
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Count by assignee
      const assignee = ticket.fields.assignee?.displayName || 'Unassigned';
      byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;

      // Count by priority
      const priority = ticket.fields.priority.name;
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    });

    return {
      total: tickets.length,
      byStatus,
      byAssignee,
      byPriority,
    };
  }
}

export default JiraClient;
export type { JiraTicket };