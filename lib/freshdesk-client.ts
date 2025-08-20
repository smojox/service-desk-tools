interface FreshdeskClientResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export class FreshdeskClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/freshdesk';
  }

  async getTicket(ticketId: string | number): Promise<FreshdeskClientResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/ticket/${ticketId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 0,
      };
    }
  }

  async updateTicketCustomField(
    ticketId: string | number,
    fieldName: string,
    fieldValue: any
  ): Promise<FreshdeskClientResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/ticket/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldName,
          fieldValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 0,
      };
    }
  }

  async addPrivateNote(
    ticketId: string | number,
    noteBody: string
  ): Promise<FreshdeskClientResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/ticket/${ticketId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          noteBody,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 0,
      };
    }
  }

  async updateSLAStatus(
    ticketId: string | number,
    slaStatus: 'Within SLA' | 'SLA Violated'
  ): Promise<FreshdeskClientResponse<any>> {
    const fieldName = process.env.NEXT_PUBLIC_FRESHDESK_SLA_FIELD_NAME || 'review_for_sla';
    // Convert SLA status to boolean for checkbox field
    // true = Within SLA Override checked (user reviewed and marked as Within SLA)
    // false = No override (follows normal SLA calculation)
    const fieldValue = slaStatus === 'Within SLA'; // true = within SLA override, false = no override
    
    console.log(`Updating Freshdesk ticket ${ticketId}: ${fieldName} = ${fieldValue} (${slaStatus})`);
    
    // Update the SLA status field
    const updateResult = await this.updateTicketCustomField(ticketId, fieldName, fieldValue);
    
    // If SLA is being overridden to Within SLA, add a private note
    if (updateResult.status === 200 && slaStatus === 'Within SLA') {
      const noteText = 'SLA has been overridden as per Service Analytics review.';
      console.log(`Adding private note to ticket ${ticketId}: ${noteText}`);
      
      // Add the private note (don't fail the main operation if note fails)
      const noteResult = await this.addPrivateNote(ticketId, noteText);
      if (noteResult.error) {
        console.warn(`Failed to add private note to ticket ${ticketId}:`, noteResult.error);
      } else {
        console.log(`Private note added successfully to ticket ${ticketId}`);
      }
    }
    
    return updateResult;
  }
}

export const freshdeskClient = new FreshdeskClient();