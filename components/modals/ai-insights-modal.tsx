"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Brain, TrendingUp, AlertTriangle, Users, Clock, Target, CheckCircle, XCircle } from 'lucide-react'
import { TicketData } from '@/lib/csv-parser'
import { DashboardMetrics } from '@/lib/data-processor'

interface AIInsightsModalProps {
  isOpen: boolean
  onClose: () => void
  tickets: TicketData[]
  metrics: DashboardMetrics
  selectedSDM?: string
  selectedCompany?: string
  selectedDateFilter?: string
}

interface AIInsight {
  title: string
  description: string
  type: 'positive' | 'warning' | 'critical' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  metric?: string | number
}

export function AIInsightsModal({ 
  isOpen, 
  onClose, 
  tickets, 
  metrics, 
  selectedSDM, 
  selectedCompany, 
  selectedDateFilter 
}: AIInsightsModalProps) {
  
  const generateInsights = (): AIInsight[] => {
    const insights: AIInsight[] = []
    
    // SLA Performance Analysis
    if (metrics.slaCompliance >= 95) {
      insights.push({
        title: "Excellent SLA Performance",
        description: `Outstanding SLA compliance at ${metrics.slaCompliance}%. Your team is consistently meeting service level commitments.`,
        type: 'positive',
        icon: Target,
        metric: `${metrics.slaCompliance}%`
      })
    } else if (metrics.slaCompliance >= 80) {
      insights.push({
        title: "Good SLA Performance",
        description: `SLA compliance at ${metrics.slaCompliance}% is above industry average but has room for improvement. Consider reviewing breach patterns.`,
        type: 'neutral',
        icon: Target,
        metric: `${metrics.slaCompliance}%`
      })
    } else {
      insights.push({
        title: "SLA Performance Needs Attention",
        description: `SLA compliance at ${metrics.slaCompliance}% is below optimal levels. Immediate action recommended to improve service delivery.`,
        type: 'critical',
        icon: AlertTriangle,
        metric: `${metrics.slaCompliance}%`
      })
    }

    // Ticket Volume Analysis
    const openToTotalRatio = (metrics.openTickets / metrics.totalTickets) * 100
    if (openToTotalRatio > 30) {
      insights.push({
        title: "High Open Ticket Volume",
        description: `${openToTotalRatio.toFixed(1)}% of tickets are currently open. Consider increasing resolution capacity or reviewing ticket prioritization.`,
        type: 'warning',
        icon: AlertTriangle,
        metric: `${metrics.openTickets} open`
      })
    } else if (openToTotalRatio < 10) {
      insights.push({
        title: "Efficient Ticket Resolution",
        description: `Only ${openToTotalRatio.toFixed(1)}% of tickets remain open, indicating strong resolution efficiency.`,
        type: 'positive',
        icon: CheckCircle,
        metric: `${metrics.openTickets} open`
      })
    }

    // Resolution Time Analysis
    if (metrics.avgResolution <= 4) {
      insights.push({
        title: "Fast Resolution Times",
        description: `Average resolution time of ${metrics.avgResolution} hours demonstrates excellent response efficiency.`,
        type: 'positive',
        icon: Clock,
        metric: `${metrics.avgResolution}h avg`
      })
    } else if (metrics.avgResolution > 24) {
      insights.push({
        title: "Slow Resolution Times",
        description: `Average resolution time of ${metrics.avgResolution} hours exceeds optimal thresholds. Review resource allocation and processes.`,
        type: 'warning',
        icon: Clock,
        metric: `${metrics.avgResolution}h avg`
      })
    }

    // Agent Performance Analysis
    const agentStats = analyzeAgentPerformance(tickets)
    if (agentStats.topPerformer) {
      insights.push({
        title: "Top Performing Agent",
        description: `${agentStats.topPerformer.agent} has resolved ${agentStats.topPerformer.count} tickets with excellent efficiency. Consider recognizing their performance.`,
        type: 'positive',
        icon: Users,
        metric: `${agentStats.topPerformer.count} tickets`
      })
    }

    // Priority Distribution Analysis
    const priorityAnalysis = analyzePriorityDistribution(tickets)
    if (priorityAnalysis.urgentPercent > 15) {
      insights.push({
        title: "High Urgent Ticket Volume",
        description: `${priorityAnalysis.urgentPercent.toFixed(1)}% of tickets are marked urgent. Review escalation criteria to ensure appropriate prioritization.`,
        type: 'warning',
        icon: AlertTriangle,
        metric: `${priorityAnalysis.urgentPercent.toFixed(1)}% urgent`
      })
    }

    // Company-Specific Insights
    if (selectedCompany && selectedCompany !== 'all') {
      const companyTickets = tickets.filter(t => t.companyName === selectedCompany)
      if (companyTickets.length > 0) {
        const avgResolutionForCompany = calculateCompanyAvgResolution(companyTickets)
        if (avgResolutionForCompany > metrics.avgResolution * 1.5) {
          insights.push({
            title: `${selectedCompany} Needs Attention`,
            description: `This company's average resolution time (${avgResolutionForCompany.toFixed(1)}h) is significantly higher than overall average. Review support processes.`,
            type: 'warning',
            icon: Users,
            metric: `${avgResolutionForCompany.toFixed(1)}h avg`
          })
        }
      }
    }

    // Escalation Analysis
    const escalatedCount = tickets.filter(t => t.sdmEscalation === 'true').length
    const escalationRate = (escalatedCount / tickets.length) * 100
    if (escalationRate > 10) {
      insights.push({
        title: "High Escalation Rate",
        description: `${escalationRate.toFixed(1)}% of tickets require escalation. Review first-line resolution capabilities and training needs.`,
        type: 'warning',
        icon: TrendingUp,
        metric: `${escalationRate.toFixed(1)}% escalated`
      })
    } else if (escalationRate < 2) {
      insights.push({
        title: "Low Escalation Rate",
        description: `Only ${escalationRate.toFixed(1)}% of tickets require escalation, indicating strong first-line resolution capabilities.`,
        type: 'positive',
        icon: CheckCircle,
        metric: `${escalationRate.toFixed(1)}% escalated`
      })
    }

    // Time-based insights
    if (selectedDateFilter && selectedDateFilter !== 'all') {
      const timeInsight = generateTimeBasedInsight(selectedDateFilter, metrics)
      if (timeInsight) {
        insights.push(timeInsight)
      }
    }

    return insights
  }

  const analyzeAgentPerformance = (tickets: TicketData[]) => {
    const agentCounts: { [key: string]: number } = {}
    tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').forEach(ticket => {
      if (ticket.agent && ticket.agent !== 'Unassigned') {
        agentCounts[ticket.agent] = (agentCounts[ticket.agent] || 0) + 1
      }
    })

    const topAgent = Object.entries(agentCounts).reduce((max, [agent, count]) => 
      count > (max?.count || 0) ? { agent, count } : max, null as { agent: string; count: number } | null
    )

    return { topPerformer: topAgent }
  }

  const analyzePriorityDistribution = (tickets: TicketData[]) => {
    const urgentCount = tickets.filter(t => t.priority === 'Urgent').length
    const urgentPercent = (urgentCount / tickets.length) * 100
    return { urgentPercent }
  }

  const calculateCompanyAvgResolution = (companyTickets: TicketData[]): number => {
    const resolvedTickets = companyTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed')
    if (resolvedTickets.length === 0) return 0
    
    const totalHours = resolvedTickets.reduce((sum, ticket) => {
      const hours = parseFloat(ticket.resolutionTimeHrs?.split(':')[0] || '0')
      return sum + hours
    }, 0)
    
    return totalHours / resolvedTickets.length
  }

  const generateTimeBasedInsight = (dateFilter: string, metrics: DashboardMetrics): AIInsight | null => {
    const filterLabels: { [key: string]: string } = {
      'last3months': 'last 3 months',
      'last6months': 'last 6 months',
      'lastyear': 'last year'
    }

    const period = filterLabels[dateFilter] || 'selected period'
    
    if (metrics.totalTickets < 10) {
      return {
        title: "Low Activity Period",
        description: `Only ${metrics.totalTickets} tickets in ${period}. Consider if this represents normal seasonal variation or potential data issues.`,
        type: 'neutral',
        icon: TrendingUp,
        metric: `${metrics.totalTickets} tickets`
      }
    }

    return null
  }

  const insights = generateInsights()

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50'
      case 'warning': return 'border-yellow-200 bg-yellow-50'
      case 'critical': return 'border-red-200 bg-red-50'
      default: return 'border-blue-200 bg-blue-50'
    }
  }

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Brain className="h-5 w-5 text-purple-600 mr-2" />
            AI Insights & Recommendations
            {(selectedCompany && selectedCompany !== 'all') && (
              <Badge variant="outline" className="ml-2">
                {selectedCompany}
              </Badge>
            )}
            {(selectedSDM && selectedSDM !== 'all') && (
              <Badge variant="outline" className="ml-2">
                {selectedSDM}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overview Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.totalTickets}</div>
                  <div className="text-sm text-gray-600">Total Tickets</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{metrics.slaCompliance}%</div>
                  <div className="text-sm text-gray-600">SLA Compliance</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{metrics.avgResolution}h</div>
                  <div className="text-sm text-gray-600">Avg Resolution</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{metrics.openTickets}</div>
                  <div className="text-sm text-gray-600">Open Tickets</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <div className="space-y-3">
            {insights.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No specific insights available for the current data selection.</p>
                </CardContent>
              </Card>
            ) : (
              insights.map((insight, index) => {
                const Icon = insight.icon
                return (
                  <Card key={index} className={`border-l-4 ${getInsightColor(insight.type)}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Icon className="h-5 w-5 mt-0.5 text-gray-600" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                              <Badge className={getInsightBadgeColor(insight.type)}>
                                {insight.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{insight.description}</p>
                          </div>
                        </div>
                        {insight.metric && (
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-gray-900">{insight.metric}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Recommendations Footer */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Brain className="h-4 w-4" />
                <span>
                  These insights are generated based on the current filter selection and historical patterns. 
                  Recommendations should be validated with additional context and domain expertise.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}