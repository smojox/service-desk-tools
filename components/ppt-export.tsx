"use client"

import { TicketData } from '@/lib/csv-parser'
import { DashboardMetrics, ChartData } from '@/lib/data-processor'

interface PPTExportProps {
  tickets: TicketData[]
  metrics: DashboardMetrics
  chartData: ChartData
  selectedSDM?: string
  selectedCompany?: string
  selectedDateFilter?: string
}

interface ReportData {
  metadata: {
    title: string
    subtitle: string
    dateRange: string
    generatedDate: string
    filters: {
      sdm?: string
      company?: string
      dateFilter?: string
    }
  }
  executiveSummary: {
    totalTickets: number
    openTickets: number
    closedTickets: number
    slaCompliance: number
    avgResolution: number
    kpis: string[]
  }
  slaPerformance: {
    complianceRate: number
    compliantTickets: number
    breachedTickets: number
    status: string
  }
  agentPerformance: Array<{
    agent: string
    resolved: number
    total: number
    resolutionRate: string
  }>
  escalationAnalysis: {
    totalEscalations: number
    escalationRate: string
    status: string
    recentEscalations: Array<{
      ticketId: string
      subject: string
      createdTime: string
    }>
  }
  ticketTypes: Array<{
    type: string
    count: number
    percentage: string
  }>
  volumeTrends: Array<{
    month: string
    created: number
    resolved: number
  }>
}

export class PPTDataGenerator {
  generateReportData(data: PPTExportProps): ReportData {
    const { metrics, tickets, chartData, selectedSDM, selectedCompany, selectedDateFilter } = data
    
    // Calculate SLA breakdown
    const breachedTickets = tickets.filter(t => 
      t.resolutionStatus === 'SLA Violated' || 
      ((!t.resolutionStatus || t.resolutionStatus.trim() === '') && 
       t.status !== 'Pending' && t.status !== 'Pending - Close' &&
       new Date(t.dueByTime) < new Date())
    ).length
    
    const compliantTickets = tickets.length - breachedTickets
    
    // Calculate agent stats
    const agentStats: { [key: string]: { resolved: number; total: number } } = {}
    
    tickets.forEach(ticket => {
      if (ticket.agent && ticket.agent !== 'Unassigned') {
        if (!agentStats[ticket.agent]) {
          agentStats[ticket.agent] = { resolved: 0, total: 0 }
        }
        agentStats[ticket.agent].total++
        if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
          agentStats[ticket.agent].resolved++
        }
      }
    })
    
    const topAgents = Object.entries(agentStats)
      .map(([agent, stats]) => ({
        agent,
        resolved: stats.resolved,
        total: stats.total,
        resolutionRate: ((stats.resolved / stats.total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 5)
    
    // Escalation analysis
    const escalatedTickets = tickets.filter(t => t.sdmEscalation === 'true')
    const escalationRate = ((escalatedTickets.length / tickets.length) * 100).toFixed(1)
    
    const recentEscalations = escalatedTickets
      .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
      .slice(0, 3)
      .map(ticket => ({
        ticketId: ticket.ticketId,
        subject: ticket.subject || 'No Subject',
        createdTime: ticket.createdTime
      }))
    
    // Ticket types with percentages
    const ticketTypes = chartData.openTicketTypeData.map(type => ({
      type: type.type,
      count: type.count,
      percentage: `${((type.count / metrics.openTickets) * 100).toFixed(1)}%`
    }))
    
    // KPIs
    const slaStatus = metrics.slaCompliance >= 90 ? '🟢 Excellent' : 
                     metrics.slaCompliance >= 70 ? '🟡 Good' : '🔴 Needs Attention'
    
    const kpis = [
      `SLA Performance: ${slaStatus}`,
      `Resolution Efficiency: ${metrics.avgResolution < 8 ? '🟢 Fast' : metrics.avgResolution < 24 ? '🟡 Moderate' : '🔴 Slow'}`,
      `Ticket Volume: ${metrics.openTickets < (tickets.length * 0.1) ? '🟢 Low' : metrics.openTickets < (tickets.length * 0.3) ? '🟡 Moderate' : '🔴 High'} open tickets`
    ]
    
    return {
      metadata: {
        title: 'Service Desk Analytics Report',
        subtitle: this.buildSubtitle(selectedCompany, selectedSDM),
        dateRange: this.getDateFilterLabel(selectedDateFilter),
        generatedDate: new Date().toLocaleDateString(),
        filters: {
          sdm: selectedSDM && selectedSDM !== 'all' ? selectedSDM : undefined,
          company: selectedCompany && selectedCompany !== 'all' ? selectedCompany : undefined,
          dateFilter: selectedDateFilter
        }
      },
      executiveSummary: {
        totalTickets: metrics.totalTickets,
        openTickets: metrics.openTickets,
        closedTickets: metrics.closedTickets,
        slaCompliance: metrics.slaCompliance,
        avgResolution: metrics.avgResolution,
        kpis
      },
      slaPerformance: {
        complianceRate: metrics.slaCompliance,
        compliantTickets,
        breachedTickets,
        status: metrics.slaCompliance >= 90 ? 'Excellent' : metrics.slaCompliance >= 70 ? 'Good' : 'Needs Improvement'
      },
      agentPerformance: topAgents,
      escalationAnalysis: {
        totalEscalations: escalatedTickets.length,
        escalationRate,
        status: parseFloat(escalationRate) < 5 ? '🟢 Low' : parseFloat(escalationRate) < 15 ? '🟡 Moderate' : '🔴 High',
        recentEscalations
      },
      ticketTypes,
      volumeTrends: chartData.ticketVolumeData
    }
  }
  
  private buildSubtitle(company?: string, sdm?: string): string {
    let subtitle = 'Performance Analysis Dashboard'
    if (company && company !== 'all') subtitle += ` - ${company}`
    if (sdm && sdm !== 'all') subtitle += ` (${sdm})`
    return subtitle
  }
  
  private getDateFilterLabel(dateFilter?: string): string {
    switch (dateFilter) {
      case 'last3months': return 'Last 3 Months'
      case 'last6months': return 'Last 6 Months'
      case 'lastyear': return 'Last Year'
      case 'all': return 'All Time'
      default:
        if (dateFilter?.includes('-')) {
          const [year, month] = dateFilter.split('-')
          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
        return 'All Time'
    }
  }
}

// Hook for easy usage in components
export function usePPTExport() {
  const exportToPPT = async (data: PPTExportProps) => {
    const generator = new PPTDataGenerator()
    const reportData = generator.generateReportData(data)
    
    // Create downloadable JSON file with structured data
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `Service_Desk_Report_Data_${timestamp}.json`
    
    const jsonContent = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Also create a formatted text version for easy copy-paste
    const textContent = generateTextReport(reportData)
    const textBlob = new Blob([textContent], { type: 'text/plain' })
    const textUrl = URL.createObjectURL(textBlob)
    
    const textLink = document.createElement('a')
    textLink.href = textUrl
    textLink.download = `Service_Desk_Report_${timestamp}.txt`
    textLink.style.display = 'none'
    document.body.appendChild(textLink)
    textLink.click()
    document.body.removeChild(textLink)
    URL.revokeObjectURL(textUrl)
  }
  
  return { exportToPPT }
}

function generateTextReport(data: ReportData): string {
  return `
SERVICE DESK ANALYTICS REPORT
${data.metadata.title}
${data.metadata.subtitle}
Report Period: ${data.metadata.dateRange}
Generated: ${data.metadata.generatedDate}

EXECUTIVE SUMMARY
Total Tickets: ${data.executiveSummary.totalTickets}
Open Tickets: ${data.executiveSummary.openTickets}
Closed Tickets: ${data.executiveSummary.closedTickets}
SLA Compliance: ${data.executiveSummary.slaCompliance}%
Average Resolution: ${data.executiveSummary.avgResolution}h

Key Performance Indicators:
${data.executiveSummary.kpis.map(kpi => `• ${kpi}`).join('\n')}

SLA PERFORMANCE
Compliance Rate: ${data.slaPerformance.complianceRate}%
Compliant Tickets: ${data.slaPerformance.compliantTickets}
Breached Tickets: ${data.slaPerformance.breachedTickets}
Status: ${data.slaPerformance.status}

AGENT PERFORMANCE (Top 5)
${data.agentPerformance.map(agent => 
  `${agent.agent}: ${agent.resolved}/${agent.total} (${agent.resolutionRate}%)`
).join('\n')}

ESCALATION ANALYSIS
Total Escalations: ${data.escalationAnalysis.totalEscalations}
Escalation Rate: ${data.escalationAnalysis.escalationRate}%
Status: ${data.escalationAnalysis.status}

Recent Escalations:
${data.escalationAnalysis.recentEscalations.map(esc => 
  `• ${esc.ticketId}: ${esc.subject}`
).join('\n')}

TICKET TYPES
${data.ticketTypes.map(type => 
  `${type.type}: ${type.count} tickets (${type.percentage})`
).join('\n')}

VOLUME TRENDS
${data.volumeTrends.map(trend => 
  `${trend.month}: ${trend.created} created, ${trend.resolved} resolved`
).join('\n')}
`.trim()
}