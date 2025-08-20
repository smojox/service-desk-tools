"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, FileSpreadsheet, User, AlertTriangle, CheckCircle, Clock, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { TicketData } from '@/lib/csv-parser'
import { freshdeskClient } from '@/lib/freshdesk-client'
import { toast } from 'sonner'

interface SLAComplianceModalProps {
  isOpen: boolean
  onClose: () => void
  tickets: TicketData[]
  compliancePercentage: number
  selectedCompany?: string
  currentSLAOverrides?: { [ticketId: string]: boolean }
  onSLAOverrideChange?: (overrides: { [ticketId: string]: boolean }) => void
}

interface SLATicket {
  ticketId: string
  subject: string
  companyName: string
  agent: string
  createdTime: string
  resolvedTime?: string
  slaHours: number
  actualHours: number
  isBreached: boolean
  priority: string
  status: string
}

interface AgentBreachSummary {
  agentName: string
  breachedCount: number
  totalCount: number
  breachPercentage: number
}

export function SLAComplianceModal({ isOpen, onClose, tickets, compliancePercentage, selectedCompany, currentSLAOverrides, onSLAOverrideChange }: SLAComplianceModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [slaOverrides, setSlaOverrides] = useState<{ [ticketId: string]: boolean }>({})
  const [loadingTickets, setLoadingTickets] = useState<Set<string>>(new Set())
  
  // Initialize and sync with parent SLA overrides
  useEffect(() => {
    if (currentSLAOverrides) {
      setSlaOverrides(currentSLAOverrides)
    }
  }, [currentSLAOverrides])
  
  // Calculate SLA data for tickets (tickets are already filtered by the parent component)
  const slaTickets: SLATicket[] = tickets.map(ticket => {
    const created = new Date(ticket.createdTime)
    const resolved = ticket.resolvedTime ? new Date(ticket.resolvedTime) : null
    const slaHours = getSLAHours(ticket.priority)
    
    let actualHours = 0
    if (resolved) {
      actualHours = Math.round((resolved.getTime() - created.getTime()) / (1000 * 60 * 60))
    } else if (ticket.status !== 'Closed' && ticket.status !== 'Resolved') {
      // For open tickets, calculate hours since creation
      actualHours = Math.round((new Date().getTime() - created.getTime()) / (1000 * 60 * 60))
    }
    
    // Determine if ticket is breached based on business rules
    let isBreached = false
    
    if (ticket.resolutionStatus === 'Within SLA') {
      isBreached = false
    } else if (ticket.resolutionStatus === 'SLA Violated') {
      isBreached = true
    } else if (!ticket.resolutionStatus || ticket.resolutionStatus.trim() === '') {
      // If resolution status is blank, check due date and status
      if (ticket.status === 'Pending' || ticket.status === 'Pending - Close') {
        isBreached = false // Assume still within SLA
      } else {
        // Check if due date has been reached
        const dueDate = new Date(ticket.dueByTime)
        const now = new Date()
        isBreached = now > dueDate
      }
    } else {
      // Default case - use time calculation
      isBreached = actualHours > slaHours
    }
    
    // Apply manual override if exists
    if (slaOverrides.hasOwnProperty(ticket.ticketId)) {
      isBreached = slaOverrides[ticket.ticketId]
    }
    
    return {
      ticketId: ticket.ticketId,
      subject: ticket.subject || 'No Subject',
      companyName: ticket.companyName || 'Unknown',
      agent: ticket.agent || 'Unassigned',
      createdTime: ticket.createdTime,
      resolvedTime: ticket.resolvedTime,
      slaHours,
      actualHours,
      isBreached,
      priority: ticket.priority || 'Medium',
      status: ticket.status || 'Open'
    }
  })

  // Sort tickets: breached first, then by creation date (newest first)
  const sortedTickets = [...slaTickets].sort((a, b) => {
    if (a.isBreached && !b.isBreached) return -1
    if (!a.isBreached && b.isBreached) return 1
    return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
  })

  // Calculate agent breach summaries
  const agentBreachSummaries: AgentBreachSummary[] = []
  const agentStats: { [key: string]: { breached: number; total: number } } = {}
  
  slaTickets.forEach(ticket => {
    if (!agentStats[ticket.agent]) {
      agentStats[ticket.agent] = { breached: 0, total: 0 }
    }
    agentStats[ticket.agent].total++
    if (ticket.isBreached) {
      agentStats[ticket.agent].breached++
    }
  })

  Object.entries(agentStats).forEach(([agent, stats]) => {
    if (stats.breached > 0) {
      agentBreachSummaries.push({
        agentName: agent,
        breachedCount: stats.breached,
        totalCount: stats.total,
        breachPercentage: Math.round((stats.breached / stats.total) * 100)
      })
    }
  })

  // Sort agents by breach count (highest first)
  agentBreachSummaries.sort((a, b) => b.breachedCount - a.breachedCount)


  // Handle SLA status toggle
  const toggleSLAStatus = async (ticketId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const slaStatus = newStatus ? 'SLA Violated' : 'Within SLA'
    
    console.log(`Toggle SLA for ticket ${ticketId}: ${currentStatus ? 'Breached' : 'Within SLA'} → ${slaStatus} ${slaStatus === 'Within SLA' ? '(Override: Manual review - Within SLA)' : '(Override: Cleared - Follow normal calculation)'}`)
    
    // Add to loading state
    setLoadingTickets(prev => new Set(prev).add(ticketId))
    
    try {
      // Update local state first for immediate UI feedback
      const newOverrides = {
        ...slaOverrides,
        [ticketId]: newStatus
      }
      setSlaOverrides(newOverrides)
      
      // Notify parent component of the change
      if (onSLAOverrideChange) {
        onSLAOverrideChange(newOverrides)
      }
      
      // Update Freshdesk via API route
      const response = await freshdeskClient.updateSLAStatus(ticketId, slaStatus)
      
      if (response.error) {
        // Revert local state if API call failed
        setSlaOverrides(slaOverrides)
        if (onSLAOverrideChange) {
          onSLAOverrideChange(slaOverrides)
        }
        toast.error(`Failed to update SLA status in Freshdesk: ${response.error}`)
      } else {
        toast.success(slaStatus === 'Within SLA' 
          ? `Ticket marked as Within SLA (override applied) in Freshdesk` 
          : `Override cleared - ticket follows normal SLA calculation in Freshdesk`)
      }
    } catch (error) {
      // Revert local state if something went wrong
      setSlaOverrides(slaOverrides)
      if (onSLAOverrideChange) {
        onSLAOverrideChange(slaOverrides)
      }
      toast.error(`Failed to update SLA status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      // Remove from loading state
      setLoadingTickets(prev => {
        const newSet = new Set(prev)
        newSet.delete(ticketId)
        return newSet
      })
    }
  }

  const handleTicketClick = (ticketId: string) => {
    const domain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN || 'wsp'
    const freshdeskUrl = `https://${domain}.freshdesk.com/a/tickets/${ticketId}`
    window.open(freshdeskUrl, '_blank')
  }

  // Calculate updated compliance percentage with overrides
  const breachedCount = slaTickets.filter(t => t.isBreached).length
  const compliantCount = slaTickets.length - breachedCount
  const updatedCompliancePercentage = slaTickets.length > 0 
    ? Math.round((compliantCount / slaTickets.length) * 100 * 10) / 10 
    : 0

  // Filter tickets for selected agent
  const agentTickets = selectedAgent 
    ? sortedTickets.filter(ticket => ticket.agent === selectedAgent && ticket.isBreached)
    : sortedTickets

  const exportToExcel = () => {
    const csvContent = [
      ['Ticket ID', 'Subject', 'Company', 'Agent', 'Priority', 'Status', 'Created', 'Resolved', 'SLA Hours', 'Actual Hours', 'Breached'].join(','),
      ...agentTickets.map(ticket => [
        ticket.ticketId,
        `"${ticket.subject.replace(/"/g, '""')}"`,
        `"${ticket.companyName.replace(/"/g, '""')}"`,
        ticket.agent,
        ticket.priority,
        ticket.status,
        ticket.createdTime,
        ticket.resolvedTime || 'N/A',
        ticket.slaHours,
        ticket.actualHours,
        ticket.isBreached ? 'Yes' : 'No'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sla-compliance-${selectedAgent || 'all'}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            SLA Compliance Analysis
            {selectedCompany && selectedCompany !== 'all' && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                - {selectedCompany}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Compliance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>SLA Compliance Overview</span>
                <Badge className={`${updatedCompliancePercentage >= 90 ? 'bg-green-100 text-green-800' : 
                  updatedCompliancePercentage >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                  {updatedCompliancePercentage}% Compliance
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {slaTickets.filter(t => !t.isBreached).length}
                  </div>
                  <div className="text-sm text-gray-600">Within SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {slaTickets.filter(t => t.isBreached).length}
                  </div>
                  <div className="text-sm text-gray-600">Breached SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {slaTickets.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Tickets</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Breach Summary */}
          {agentBreachSummaries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Agents with SLA Breaches</span>
                  {selectedAgent && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedAgent(null)}>
                      Show All Tickets
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {agentBreachSummaries.map((agent) => (
                    <Card 
                      key={agent.agentName}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedAgent === agent.agentName ? 'ring-2 ring-orange-500' : ''
                      }`}
                      onClick={() => setSelectedAgent(agent.agentName)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-600 mr-2" />
                            <span className="font-medium text-gray-900">{agent.agentName}</span>
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            {agent.breachedCount}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {agent.breachPercentage}% breach rate ({agent.breachedCount}/{agent.totalCount})
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ticket List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {selectedAgent ? `SLA Breaches by ${selectedAgent}` : 'All Tickets (Breached First)'}
                </span>
                <Button variant="outline" size="sm" onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {agentTickets.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tickets found</p>
                ) : (
                  agentTickets.map((ticket) => (
                    <div 
                      key={ticket.ticketId}
                      className={`p-4 rounded-lg border-l-4 ${
                        ticket.isBreached 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-green-500 bg-green-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span 
                              className="font-medium text-gray-900 cursor-pointer text-blue-600 hover:text-blue-800 underline" 
                              onClick={() => handleTicketClick(ticket.ticketId)}
                            >
                              {ticket.ticketId}
                            </span>
                            <Badge className={`${
                              ticket.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {ticket.priority}
                            </Badge>
                            <Badge variant="outline">{ticket.status}</Badge>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-1">{ticket.subject}</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Company: {ticket.companyName} • Agent: {ticket.agent}</div>
                            <div>Created: {new Date(ticket.createdTime).toLocaleDateString()}</div>
                            {ticket.resolvedTime && (
                              <div>Resolved: {new Date(ticket.resolvedTime).toLocaleDateString()}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end space-x-3">
                            <div className={`flex items-center ${ticket.isBreached ? 'text-red-600' : 'text-green-600'}`}>
                              {ticket.isBreached ? (
                                <AlertTriangle className="h-4 w-4 mr-1" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              )}
                              <span className="font-medium">
                                {ticket.isBreached ? 'Breached' : 'Within SLA'}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-8 w-8"
                              onClick={() => toggleSLAStatus(ticket.ticketId, ticket.isBreached)}
                              title={`Toggle to ${ticket.isBreached ? 'Within SLA' : 'Breached'}`}
                              disabled={loadingTickets.has(ticket.ticketId)}
                            >
                              {loadingTickets.has(ticket.ticketId) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : ticket.isBreached ? (
                                <ToggleLeft className="h-5 w-5 text-red-600" />
                              ) : (
                                <ToggleRight className="h-5 w-5 text-green-600" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {ticket.actualHours}h / {ticket.slaHours}h SLA
                            {slaOverrides.hasOwnProperty(ticket.ticketId) && (
                              <span className="ml-2 text-blue-600 text-xs">(Manual Override)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Helper function to determine SLA hours based on priority
function getSLAHours(priority: string): number {
  switch (priority?.toLowerCase()) {
    case 'urgent':
      return 4
    case 'high':
      return 8
    case 'medium':
      return 24
    case 'low':
      return 72
    default:
      return 24
  }
}