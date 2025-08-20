interface FreshdeskConfig {
  domain: string;
  apiKey: string;
}

interface FreshdeskTicket {
  id: number;
  subject: string;
  description: string;
  status: number;
  priority: number;
  ticket_type: string;
  source: number;
  requester_id: number;
  responder_id: number;
  company_id: number;
  group_id: number;
  product_id: number;
  due_by: string;
  created_at: string;
  updated_at: string;
  custom_fields: { [key: string]: any };
  tags: string[];
  cc_emails: string[];
  fwd_emails: string[];
  reply_cc_emails: string[];
  fr_escalated: boolean;
  spam: boolean;
  email_config_id: number;
  group_name: string;
  product_name: string;
  requester_name: string;
  responder_name: string;
  company_name: string;
}

interface FreshdeskApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export class FreshdeskAPI {
  private config: FreshdeskConfig;
  private baseUrl: string;

  constructor(config: FreshdeskConfig) {
    this.config = config;
    this.baseUrl = `https://${config.domain}.freshdesk.com/api/v2`;
  }

  private getAuthHeaders(): HeadersInit {
    const credentials = btoa(`${this.config.apiKey}:X`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<FreshdeskApiResponse<T>> {
    try {
      // For server-side requests, we need to handle SSL certificate issues
      const fetchOptions: RequestInit = {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      };

      // In server environment, disable SSL verification for self-signed certificates
      if (typeof process !== 'undefined' && process.env.NODE_ENV) {
        // This is running on the server
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);

      // Restore SSL verification
      if (typeof process !== 'undefined' && process.env.NODE_ENV) {
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "1";
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: `Freshdesk API error: ${response.status} - ${errorText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      // Restore SSL verification in case of error
      if (typeof process !== 'undefined' && process.env.NODE_ENV) {
        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "1";
      }
      
      return {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 0,
      };
    }
  }

  async getTicket(ticketId: string | number): Promise<FreshdeskApiResponse<FreshdeskTicket>> {
    return this.makeRequest<FreshdeskTicket>(`/tickets/${ticketId}`);
  }

  async updateTicketCustomField(
    ticketId: string | number,
    fieldName: string,
    fieldValue: any
  ): Promise<FreshdeskApiResponse<FreshdeskTicket>> {
    const payload = {
      custom_fields: {
        [fieldName]: fieldValue,
      },
    };

    return this.makeRequest<FreshdeskTicket>(`/tickets/${ticketId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async updateSLAStatus(
    ticketId: string | number,
    slaStatus: 'Within SLA' | 'SLA Violated'
  ): Promise<FreshdeskApiResponse<FreshdeskTicket>> {
    return this.updateTicketCustomField(ticketId, 'sla_status_override', slaStatus);
  }

  async addPrivateNote(
    ticketId: string | number,
    noteBody: string
  ): Promise<FreshdeskApiResponse<any>> {
    const payload = {
      body: noteBody,
      private: true
    };

    console.log(`Making Freshdesk API request to add note to ticket ${ticketId}:`, payload)
    
    const result = await this.makeRequest(`/tickets/${ticketId}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    console.log(`Freshdesk API response for note creation:`, result)
    return result;
  }

  async getTicketFields(): Promise<FreshdeskApiResponse<any[]>> {
    return this.makeRequest<any[]>('/ticket_fields');
  }

  async searchTickets(query: string): Promise<FreshdeskApiResponse<FreshdeskTicket[]>> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest<FreshdeskTicket[]>(`/search/tickets?query="${encodedQuery}"`);
  }

  async getTickets(
    page = 1,
    perPage = 100,
    filters?: { [key: string]: any }
  ): Promise<FreshdeskApiResponse<FreshdeskTicket[]>> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    return this.makeRequest<FreshdeskTicket[]>(`/tickets?${params.toString()}`);
  }
}

export const createFreshdeskAPI = (domain: string, apiKey: string): FreshdeskAPI => {
  return new FreshdeskAPI({ domain, apiKey });
};

export type { FreshdeskTicket, FreshdeskApiResponse, FreshdeskConfig };