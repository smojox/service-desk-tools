import { TicketData } from './csv-parser'

export interface DashboardMetrics {
  totalTickets: number
  openTickets: number
  closedTickets: number
  avgResolution: number
  slaCompliance: number
}

export interface EscalatedTicket {
  ticketId: string
  subject: string
  priority: string
  companyName: string
  createdTime: string
  status: string
  usersAffected: number
}

export interface RecentTicket {
  ticketId: string
  subject: string
  priority: string
  companyName: string
  createdTime: string
  status: string
  agent: string
}

export interface ChartData {
  ticketVolumeData: Array<{ month: string; created: number; resolved: number }>
  openTicketTypeData: Array<{ type: string; count: number }>
  ageBreakdownData: Array<{ month: string; incidents: number; serviceRequests: number; problems: number; other: number }>
  statusData: Array<{ status: string; count: number; fill: string }>
}

export class DataProcessor {
  private tickets: TicketData[] = []
  private originalTickets: TicketData[] = []
  private slaOverrides: { [ticketId: string]: boolean } = {}

  constructor(tickets: TicketData[], slaOverrides: { [ticketId: string]: boolean } = {}, originalTickets?: TicketData[]) {
    this.tickets = tickets
    this.originalTickets = originalTickets || tickets
    this.slaOverrides = slaOverrides
  }

  calculateMetrics(): DashboardMetrics {
    const totalTickets = this.tickets.length
    
    const openTickets = this.tickets.filter(ticket => 
      ticket.status !== 'Resolved' && ticket.status !== 'Closed'
    ).length
    
    const closedTickets = this.tickets.filter(ticket => 
      ticket.status === 'Resolved' || ticket.status === 'Closed'
    ).length

    const resolvedTickets = this.tickets.filter(ticket => 
      ticket.status === 'Resolved' || ticket.status === 'Closed'
    )
    
    const avgResolution = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, ticket) => {
          const resolutionTime = parseFloat(ticket.resolutionTimeHrs.split(':')[0]) || 0
          return sum + resolutionTime
        }, 0) / resolvedTickets.length
      : 0

    const slaCompliance = this.calculateSLACompliance()

    return {
      totalTickets,
      openTickets,
      closedTickets,
      avgResolution: Math.round(avgResolution * 10) / 10,
      slaCompliance: Math.round(slaCompliance * 10) / 10
    }
  }

  private calculateSLACompliance(): number {
    let compliantCount = 0
    const today = new Date()
    
    this.tickets.forEach(ticket => {
      let isCompliant = false
      
      // Check CSV "Within SLA Override" field first (highest priority)
      if (ticket.withinSlaOverride && ticket.withinSlaOverride.toLowerCase() === 'true') {
        isCompliant = true
      } else if (ticket.resolutionStatus === 'Within SLA') {
        isCompliant = true
      } else if (ticket.resolutionStatus === 'SLA Violated') {
        isCompliant = false
      } else if (!ticket.resolutionStatus || ticket.resolutionStatus.trim() === '') {
        // If resolution status is blank, check due date and status
        if (ticket.status === 'Pending' || ticket.status === 'Pending - Close') {
          isCompliant = true // Assume still within SLA
        } else {
          // Check if due date has been reached
          const dueDate = new Date(ticket.dueByTime)
          isCompliant = dueDate > today
        }
      }
      
      // Apply manual override if exists (true = breached, so invert for compliance)
      // This overrides CSV field as it's a user action
      if (this.slaOverrides.hasOwnProperty(ticket.ticketId)) {
        isCompliant = !this.slaOverrides[ticket.ticketId]
      }
      
      if (isCompliant) {
        compliantCount++
      }
    })
    
    return this.tickets.length > 0 ? (compliantCount / this.tickets.length) * 100 : 0
  }

  getEscalatedTickets(): EscalatedTicket[] {
    return this.tickets
      .filter(ticket => ticket.sdmEscalation === 'true')
      .map(ticket => ({
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        priority: ticket.priority,
        companyName: ticket.companyName,
        createdTime: ticket.createdTime,
        status: ticket.status,
        usersAffected: parseInt(ticket.numberOfUsersAffected) || 0
      }))
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
  }

  getRecentPriorityTickets(): RecentTicket[] {
    return this.tickets
      .filter(ticket => ticket.priority === 'Urgent' || ticket.priority === 'High')
      .map(ticket => ({
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        priority: ticket.priority,
        companyName: ticket.companyName,
        createdTime: ticket.createdTime,
        status: ticket.status,
        agent: ticket.agent
      }))
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
      .slice(0, 10)
  }

  getChartData(): ChartData {
    // Get monthly data for last year or all data if less than a year
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const earliestDate = this.getEarliestTicketDate()
    const useAllData = earliestDate > oneYearAgo
    
    const createdByMonth = new Map<string, number>()
    const resolvedByMonth = new Map<string, number>()
    const openTicketTypes = new Map<string, number>()

    // Process filtered tickets for volume chart (respect SDM/company filters, but show full date range)
    this.tickets.forEach(ticket => {
      // Created tickets by month
      const createdDate = new Date(ticket.createdTime)
      if (!isNaN(createdDate.getTime()) && (createdDate >= oneYearAgo || useAllData)) {
        const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
        createdByMonth.set(monthKey, (createdByMonth.get(monthKey) || 0) + 1)
      }

      // Resolved tickets by month
      if (ticket.resolvedTime && ticket.resolvedTime.trim() !== '') {
        const resolvedDate = new Date(ticket.resolvedTime)
        if (!isNaN(resolvedDate.getTime()) && (resolvedDate >= oneYearAgo || useAllData)) {
          const monthKey = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}`
          resolvedByMonth.set(monthKey, (resolvedByMonth.get(monthKey) || 0) + 1)
        }
      }
    })

    // Process open tickets for type breakdown using all-time data with SDM/company filters only
    // Find the SDM and company from current filtered tickets to apply same filters
    const currentSDMs = new Set(this.tickets.map(t => t.sdm).filter(Boolean))
    const currentCompanies = new Set(this.tickets.map(t => t.companyName).filter(Boolean))
    
    // If we have specific SDM/company filters, apply them to original tickets
    const sdmFilter = currentSDMs.size === 1 ? Array.from(currentSDMs)[0] : null
    const companyFilter = currentCompanies.size === 1 ? Array.from(currentCompanies)[0] : null
    
    let ticketsToProcessForTypes = this.originalTickets
    
    // Apply SDM filter if we have one specific SDM
    if (sdmFilter && this.originalTickets.some(t => t.sdm !== sdmFilter)) {
      ticketsToProcessForTypes = ticketsToProcessForTypes.filter(ticket => ticket.sdm === sdmFilter)
    }
    
    // Apply company filter if we have one specific company
    if (companyFilter && this.originalTickets.some(t => t.companyName !== companyFilter)) {
      ticketsToProcessForTypes = ticketsToProcessForTypes.filter(ticket => ticket.companyName === companyFilter)
    }
    
    // Count open tickets by type using all-time filtered data
    ticketsToProcessForTypes
      .filter(ticket => ticket.status !== 'Resolved' && ticket.status !== 'Closed')
      .forEach(ticket => {
        const type = ticket.type || 'Unknown'
        openTicketTypes.set(type, (openTicketTypes.get(type) || 0) + 1)
      })

    // Generate monthly data - always show at least 7 months
    const allMonths = new Set([...createdByMonth.keys(), ...resolvedByMonth.keys()])
    
    // If we have fewer than 7 months, generate the last 7 months
    const monthsToShow = new Set<string>()
    
    // Add actual months with data
    allMonths.forEach(month => monthsToShow.add(month))
    
    // Ensure we have at least 7 months by filling backwards from current month
    const currentDate = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthsToShow.add(monthKey)
    }
    
    const ticketVolumeData = Array.from(monthsToShow)
      .sort()
      .slice(-7) // Always show last 7 months maximum
      .map(month => ({
        month,
        created: createdByMonth.get(month) || 0,
        resolved: resolvedByMonth.get(month) || 0
      }))

    const openTicketTypeData = Array.from(openTicketTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    // Calculate age breakdown data for open tickets by type and month
    // Use all-time data filtered only by SDM/company (not date filters)
    const ageBreakdownData = this.calculateAgeBreakdownData()

    // Calculate status breakdown data
    const statusData = this.calculateStatusData()

    return {
      ticketVolumeData,
      openTicketTypeData,
      ageBreakdownData,
      statusData
    }
  }

  private getEarliestTicketDate(): Date {
    const dates = this.originalTickets
      .map(ticket => new Date(ticket.createdTime))
      .filter(date => !isNaN(date.getTime()))
    
    return dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date()
  }

  getUniqueSDMs(): string[] {
    const sdms = new Set<string>()
    this.originalTickets.forEach(ticket => {
      if (ticket.sdm && ticket.sdm.trim() !== '') {
        sdms.add(ticket.sdm)
      }
    })
    return Array.from(sdms).sort()
  }

  getUniqueCompanies(): string[] {
    const companies = new Set<string>()
    this.originalTickets.forEach(ticket => {
      if (ticket.companyName && ticket.companyName.trim() !== '') {
        companies.add(ticket.companyName)
      }
    })
    return Array.from(companies).sort()
  }

  filterTickets(filters: {
    sdm?: string
    company?: string
    dateFrom?: string
    dateTo?: string
  }): DataProcessor {
    let filteredTickets = this.tickets

    if (filters.sdm && filters.sdm !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.sdm === filters.sdm)
    }

    if (filters.company && filters.company !== 'all') {
      filteredTickets = filteredTickets.filter(ticket => ticket.companyName === filters.company)
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filteredTickets = filteredTickets.filter(ticket => 
        new Date(ticket.createdTime) >= fromDate
      )
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      filteredTickets = filteredTickets.filter(ticket => 
        new Date(ticket.createdTime) <= toDate
      )
    }

    return new DataProcessor(filteredTickets, this.slaOverrides, this.originalTickets)
  }

  getTickets(): TicketData[] {
    return this.tickets
  }

  private calculateAgeBreakdownData(): Array<{ month: string; incidents: number; serviceRequests: number; problems: number; other: number }> {
    const ageBreakdownByMonth = new Map<string, { incidents: number; serviceRequests: number; problems: number; other: number }>()
    
    // Use original tickets for age breakdown, filtered only by SDM/company (no date filters)
    // Find the SDM and company from current filtered tickets to apply same filters
    const currentSDMs = new Set(this.tickets.map(t => t.sdm).filter(Boolean))
    const currentCompanies = new Set(this.tickets.map(t => t.companyName).filter(Boolean))
    
    // If we have specific SDM/company filters, apply them to original tickets
    const sdmFilter = currentSDMs.size === 1 ? Array.from(currentSDMs)[0] : null
    const companyFilter = currentCompanies.size === 1 ? Array.from(currentCompanies)[0] : null
    
    let ticketsToProcess = this.originalTickets
    
    // Apply SDM filter if we have one specific SDM
    if (sdmFilter && this.originalTickets.some(t => t.sdm !== sdmFilter)) {
      ticketsToProcess = ticketsToProcess.filter(ticket => ticket.sdm === sdmFilter)
    }
    
    // Apply company filter if we have one specific company
    if (companyFilter && this.originalTickets.some(t => t.companyName !== companyFilter)) {
      ticketsToProcess = ticketsToProcess.filter(ticket => ticket.companyName === companyFilter)
    }
    
    // Process open tickets to calculate age breakdown by creation month
    ticketsToProcess
      .filter(ticket => ticket.status !== 'Resolved' && ticket.status !== 'Closed')
      .forEach(ticket => {
        const createdDate = new Date(ticket.createdTime)
        if (!isNaN(createdDate.getTime())) {
          const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
          
          if (!ageBreakdownByMonth.has(monthKey)) {
            ageBreakdownByMonth.set(monthKey, { incidents: 0, serviceRequests: 0, problems: 0, other: 0 })
          }
          
          const breakdown = ageBreakdownByMonth.get(monthKey)!
          const type = ticket.type || 'Unknown'
          
          switch (type) {
            case 'Incident':
              breakdown.incidents++
              break
            case 'Service Request':
              breakdown.serviceRequests++
              break
            case 'Problem':
              breakdown.problems++
              break
            default:
              breakdown.other++
              break
          }
        }
      })

    // Get all months that have data, sorted chronologically
    const allMonths = Array.from(ageBreakdownByMonth.keys()).sort()
    
    // Return data for all months with data (dynamic expansion)
    return allMonths.map(month => ({
      month,
      incidents: ageBreakdownByMonth.get(month)?.incidents || 0,
      serviceRequests: ageBreakdownByMonth.get(month)?.serviceRequests || 0,
      problems: ageBreakdownByMonth.get(month)?.problems || 0,
      other: ageBreakdownByMonth.get(month)?.other || 0
    }))
  }

  private calculateStatusData(): Array<{ status: string; count: number; fill: string }> {
    const statusCounts = new Map<string, number>()
    
    // Use original tickets for all-time data, filtered only by SDM/company (not date filters)
    // Find the SDM and company from current filtered tickets to apply same filters
    const currentSDMs = new Set(this.tickets.map(t => t.sdm).filter(Boolean))
    const currentCompanies = new Set(this.tickets.map(t => t.companyName).filter(Boolean))
    
    // If we have specific SDM/company filters, apply them to original tickets
    const sdmFilter = currentSDMs.size === 1 ? Array.from(currentSDMs)[0] : null
    const companyFilter = currentCompanies.size === 1 ? Array.from(currentCompanies)[0] : null
    
    let ticketsToProcess = this.originalTickets
    
    // Apply SDM filter if we have one specific SDM
    if (sdmFilter && this.originalTickets.some(t => t.sdm !== sdmFilter)) {
      ticketsToProcess = ticketsToProcess.filter(ticket => ticket.sdm === sdmFilter)
    }
    
    // Apply company filter if we have one specific company
    if (companyFilter && this.originalTickets.some(t => t.companyName !== companyFilter)) {
      ticketsToProcess = ticketsToProcess.filter(ticket => ticket.companyName === companyFilter)
    }
    
    // Count open tickets by status (exclude resolved and closed)
    ticketsToProcess
      .filter(ticket => ticket.status !== 'Resolved' && ticket.status !== 'Closed')
      .forEach(ticket => {
        const status = ticket.status || 'Unknown'
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
      })

    // Define colors for different statuses (only open statuses now)
    const statusColors: { [key: string]: string } = {
      'Open': '#3b82f6',        // Blue
      'In Progress': '#f59e0b', // Amber
      'Pending': '#eab308',     // Yellow
      'On Hold': '#ef4444',     // Red
      'Awaiting Customer': '#8b5cf6', // Purple
      'Escalated': '#dc2626',   // Red-600
      'Pending - Close': '#a3a3a3', // Gray
      'Unknown': '#9ca3af'      // Gray-400
    }

    // Convert to array and sort by count (descending)
    return Array.from(statusCounts.entries())
      .map(([status, count]) => ({
        status,
        count,
        fill: statusColors[status] || '#6b7280' // Default to gray if status not found
      }))
      .sort((a, b) => b.count - a.count)
  }
}