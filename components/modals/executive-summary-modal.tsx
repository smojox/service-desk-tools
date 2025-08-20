"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, FileText, Download, Sparkles, Settings } from 'lucide-react'
import { DashboardMetrics } from '@/lib/data-processor'

export interface PageSelectionOptions {
  keyPerformanceMetrics: boolean
  slaComplianceAnalysis: boolean
  escalatedTicketsAnalysis: boolean
  monthlyCreatedVsResolved: boolean
  openTicketsByType: boolean
  breakdownByAgeOfTicket: boolean
  openIncidentsAndServiceRequests: boolean
  openProblemRecords: boolean
  questionsAndDiscussion: boolean
  escalationProcess: boolean
}

interface ExecutiveSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (summary: string, pageSelection: PageSelectionOptions) => void
  metrics: DashboardMetrics
  selectedCompany?: string
  selectedSDM?: string
  selectedDateFilter?: string
}

export function ExecutiveSummaryModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  metrics,
  selectedCompany,
  selectedSDM,
  selectedDateFilter
}: ExecutiveSummaryModalProps) {
  const [summary, setSummary] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [pageSelection, setPageSelection] = useState<PageSelectionOptions>({
    keyPerformanceMetrics: true,
    slaComplianceAnalysis: true,
    escalatedTicketsAnalysis: true,
    monthlyCreatedVsResolved: true,
    openTicketsByType: true,
    breakdownByAgeOfTicket: true,
    openIncidentsAndServiceRequests: true,
    openProblemRecords: true,
    questionsAndDiscussion: true,
    escalationProcess: true,
  })

  // Generate AI summary when modal opens
  useEffect(() => {
    if (isOpen && !hasGenerated) {
      generateAISummary()
    }
  }, [isOpen])

  const generateAISummary = async () => {
    setIsGenerating(true)
    
    try {
      // Create a professional summary based on the metrics
      const companyText = selectedCompany && selectedCompany !== 'all' ? selectedCompany : 'all managed services'
      const sdmText = selectedSDM && selectedSDM !== 'all' ? `under ${selectedSDM}'s management` : ''
      const periodText = getDateFilterLabel(selectedDateFilter)
      
      const slaStatus = metrics.slaCompliance >= 95 ? 'exceptional' : 
                       metrics.slaCompliance >= 90 ? 'strong' : 
                       metrics.slaCompliance >= 80 ? 'satisfactory' : 'requires attention'
      
      const avgResolutionText = metrics.avgResolution <= 2 ? 'excellent' :
                               metrics.avgResolution <= 8 ? 'good' :
                               metrics.avgResolution <= 24 ? 'acceptable' : 'needs improvement'
      
      const generatedSummary = `Executive Summary - Service Analytics Review

We are pleased to present this comprehensive service analytics review covering ${companyText} for the period of ${periodText}. This report provides key insights into our service delivery performance and operational metrics.

Key Performance Highlights:

• Service Level Agreement (SLA) compliance achieved ${metrics.slaCompliance}% - demonstrating ${slaStatus} performance standards

• Managed a total of ${metrics.totalTickets} service requests and incidents during this period

• Currently maintaining ${metrics.openTickets} active tickets requiring attention

• Successfully resolved ${metrics.closedTickets} tickets, reflecting our commitment to customer satisfaction

• Average resolution time of ${metrics.avgResolution} hours indicates ${avgResolutionText} operational efficiency

Operational Excellence:

Our team continues to maintain high standards of service delivery while adapting to evolving business requirements. The metrics presented demonstrate our proactive approach to service management and continuous improvement initiatives.

Focus Areas:

We remain committed to enhancing our service delivery capabilities through strategic improvements in process optimization, resource allocation, and customer communication. This report serves as a foundation for discussing future service enhancements and alignment with business objectives.

Looking Forward:

We appreciate the opportunity to review these metrics with you and discuss how our services continue to support your business goals. We welcome any questions or discussions regarding the data presented in this comprehensive review.`

      setSummary(generatedSummary)
      setHasGenerated(true)
    } catch (error) {
      console.error('Error generating summary:', error)
      // Provide a fallback summary
      setSummary(`Executive Summary - Service Analytics Review

This report provides a comprehensive overview of our service delivery performance for the selected period.

Key Metrics:
• Total Tickets: ${metrics.totalTickets}
• Open Tickets: ${metrics.openTickets}
• Closed Tickets: ${metrics.closedTickets}
• SLA Compliance: ${metrics.slaCompliance}%
• Average Resolution Time: ${metrics.avgResolution} hours

We look forward to discussing these results and our continued partnership.`)
      setHasGenerated(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = () => {
    onConfirm(summary, pageSelection)
    onClose()
  }

  const handleSkip = () => {
    onConfirm('', pageSelection)
    onClose()
  }

  const handlePageSelectionChange = (key: keyof PageSelectionOptions, checked: boolean) => {
    setPageSelection(prev => ({
      ...prev,
      [key]: checked
    }))
  }

  const handleSelectAll = () => {
    const allSelected = Object.values(pageSelection).every(value => value)
    const newSelection = Object.keys(pageSelection).reduce((acc, key) => {
      acc[key as keyof PageSelectionOptions] = !allSelected
      return acc
    }, {} as PageSelectionOptions)
    setPageSelection(newSelection)
  }

  const getDateFilterLabel = (dateFilter?: string): string => {
    switch (dateFilter) {
      case 'last3months': return 'the last 3 months'
      case 'last6months': return 'the last 6 months'
      case 'lastyear': return 'the last 12 months'
      case 'all': return 'all available periods'
      default:
        if (dateFilter?.includes('-')) {
          const [year, month] = dateFilter.split('-')
          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
          return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        }
        return 'the selected period'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            Executive Summary for PDF Export
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Sparkles className="h-4 w-4 text-purple-600 mr-2" />
                Professional Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                We've generated a professional executive summary based on your current metrics. 
                You can customize this content before including it in your PDF export.
              </p>
              
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Generating professional summary...</span>
                </div>
              ) : (
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[400px] text-sm"
                  placeholder="Executive summary will appear here..."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Settings className="h-4 w-4 text-gray-600 mr-2" />
                  Page Selection
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {Object.values(pageSelection).every(value => value) ? 'Deselect All' : 'Select All'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Choose which pages to include in your PDF export. All pages are selected by default.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="keyPerformanceMetrics"
                    checked={pageSelection.keyPerformanceMetrics}
                    onCheckedChange={(checked) => handlePageSelectionChange('keyPerformanceMetrics', checked as boolean)}
                  />
                  <label htmlFor="keyPerformanceMetrics" className="text-sm">Key Performance Metrics</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="slaComplianceAnalysis"
                    checked={pageSelection.slaComplianceAnalysis}
                    onCheckedChange={(checked) => handlePageSelectionChange('slaComplianceAnalysis', checked as boolean)}
                  />
                  <label htmlFor="slaComplianceAnalysis" className="text-sm">SLA Compliance Analysis</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="escalatedTicketsAnalysis"
                    checked={pageSelection.escalatedTicketsAnalysis}
                    onCheckedChange={(checked) => handlePageSelectionChange('escalatedTicketsAnalysis', checked as boolean)}
                  />
                  <label htmlFor="escalatedTicketsAnalysis" className="text-sm">Escalated Tickets Analysis</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monthlyCreatedVsResolved"
                    checked={pageSelection.monthlyCreatedVsResolved}
                    onCheckedChange={(checked) => handlePageSelectionChange('monthlyCreatedVsResolved', checked as boolean)}
                  />
                  <label htmlFor="monthlyCreatedVsResolved" className="text-sm">Monthly Created vs Resolved</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="openTicketsByType"
                    checked={pageSelection.openTicketsByType}
                    onCheckedChange={(checked) => handlePageSelectionChange('openTicketsByType', checked as boolean)}
                  />
                  <label htmlFor="openTicketsByType" className="text-sm">Open Tickets by Type</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="breakdownByAgeOfTicket"
                    checked={pageSelection.breakdownByAgeOfTicket}
                    onCheckedChange={(checked) => handlePageSelectionChange('breakdownByAgeOfTicket', checked as boolean)}
                  />
                  <label htmlFor="breakdownByAgeOfTicket" className="text-sm">Breakdown by Age of Ticket</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="openIncidentsAndServiceRequests"
                    checked={pageSelection.openIncidentsAndServiceRequests}
                    onCheckedChange={(checked) => handlePageSelectionChange('openIncidentsAndServiceRequests', checked as boolean)}
                  />
                  <label htmlFor="openIncidentsAndServiceRequests" className="text-sm">Open Incidents & Service Requests</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="openProblemRecords"
                    checked={pageSelection.openProblemRecords}
                    onCheckedChange={(checked) => handlePageSelectionChange('openProblemRecords', checked as boolean)}
                  />
                  <label htmlFor="openProblemRecords" className="text-sm">Open Problem Records</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="questionsAndDiscussion"
                    checked={pageSelection.questionsAndDiscussion}
                    onCheckedChange={(checked) => handlePageSelectionChange('questionsAndDiscussion', checked as boolean)}
                  />
                  <label htmlFor="questionsAndDiscussion" className="text-sm">Questions & Discussion</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="escalationProcess"
                    checked={pageSelection.escalationProcess}
                    onCheckedChange={(checked) => handlePageSelectionChange('escalationProcess', checked as boolean)}
                  />
                  <label htmlFor="escalationProcess" className="text-sm">Escalation Process</label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSkip}>
              Skip Summary - Export Without
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={isGenerating || !summary.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF with Summary
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}