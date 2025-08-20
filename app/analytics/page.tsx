"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  ChevronRight,
  Search,
  Bell,
  Settings,
  Filter,
  CalendarIcon,
  FileText,
  FileSpreadsheet,
  Brain,
  Target,
  ArrowUp,
  Upload,
  BarChart3,
  PieChart,
  Calendar,
  X,
  ToggleLeft,
  ToggleRight,
  Loader2,
  User,
  Building2,
  ArrowLeft,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TicketData, parseCSV } from "@/lib/csv-parser"
import { DataProcessor, DashboardMetrics, EscalatedTicket, RecentTicket, ChartData } from "@/lib/data-processor"
import { CSVUpload } from "@/components/csv-upload"
import { MonthlyTicketsChart } from "@/components/charts/monthly-tickets-chart"
import { OpenTicketsPieChart } from "@/components/charts/open-tickets-pie-chart"
import { TicketAgeBreakdownChart } from "@/components/charts/ticket-age-breakdown-chart"
import { TicketStatusChart } from "@/components/charts/ticket-status-chart"
import { SLAComplianceModal } from "@/components/modals/sla-compliance-modal"
import { AIInsightsModal } from "@/components/modals/ai-insights-modal"
import { MonthlyReviewModal } from "@/components/modals/monthly-review-modal"
import { ExecutiveSummaryModal, PageSelectionOptions } from "@/components/modals/executive-summary-modal"
import { usePDFExport } from "@/components/pdf-export"
import { freshdeskClient } from "@/lib/freshdesk-client"
import { toast } from "sonner"


const statusColors = {
  critical: "bg-red-500",
  investigating: "bg-orange-500",
  monitoring: "bg-yellow-500",
  resolved: "bg-green-500",
}

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-green-100 text-green-800",
}

export default function AnalyticsDashboard() {
  const router = useRouter()
  const { exportToPDF } = usePDFExport()
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null)
  const [selectedSDM, setSelectedSDM] = useState<string>("")
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [dateFilterOptions, setDateFilterOptions] = useState<Array<{value: string, label: string}>>([
    { value: 'all', label: 'All Time' },
    { value: 'last3months', label: 'Last 3 Months' },
    { value: 'last6months', label: 'Last 6 Months' },
    { value: 'lastyear', label: 'Last Year' }
  ])
  
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    avgResolution: 0,
    slaCompliance: 0
  })
  const [escalatedTickets, setEscalatedTickets] = useState<EscalatedTicket[]>([])
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([])
  const [chartData, setChartData] = useState<ChartData>({
    ticketVolumeData: [],
    openTicketTypeData: [],
    ageBreakdownData: [],
    statusData: []
  })
  const [sdmOptions, setSdmOptions] = useState<Array<{value: string, label: string}>>([])
  const [companyOptions, setCompanyOptions] = useState<Array<{value: string, label: string}>>([])
  const [filteredCompanyOptions, setFilteredCompanyOptions] = useState<Array<{value: string, label: string}>>([])
  const [loading, setLoading] = useState(false)
  const [hasData, setHasData] = useState(false)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all')
  const [showSLAModal, setShowSLAModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showMonthlyReviewModal, setShowMonthlyReviewModal] = useState(false)
  const [showExecutiveSummaryModal, setShowExecutiveSummaryModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TicketData[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [slaOverrides, setSlaOverrides] = useState<{ [ticketId: string]: boolean }>({})
  const [loadingTickets, setLoadingTickets] = useState<Set<string>>(new Set())

  // Don't load CSV data on mount - wait for user upload

  // Update data when filters change
  useEffect(() => {
    if (tickets.length > 0) {
      updateDashboardData()
    }
  }, [selectedSDM, selectedCompany, selectedDateFilter, tickets, slaOverrides])

  // Update company options when SDM changes
  useEffect(() => {
    if (tickets.length > 0) {
      updateCompanyOptions()
    }
  }, [selectedSDM, tickets])

  // Update date filter options when tickets are loaded
  useEffect(() => {
    if (tickets.length > 0) {
      const monthOptions = generateMonthOptions()
      setDateFilterOptions([
        { value: 'all', label: 'All Time' },
        { value: 'last3months', label: 'Last 3 Months' },
        { value: 'last6months', label: 'Last 6 Months' },
        { value: 'lastyear', label: 'Last Year' },
        ...monthOptions
      ])
    }
  }, [tickets])

  const loadCSVData = async () => {
    try {
      const response = await fetch('/testfiles/testfile.csv')
      const csvContent = await response.text()
      const parsedTickets = parseCSV(csvContent)
      setTickets(parsedTickets)
      
      const processor = new DataProcessor(parsedTickets)
      const uniqueSDMs = processor.getUniqueSDMs()
      const uniqueCompanies = processor.getUniqueCompanies()
      
      setSdmOptions([
        { value: 'all', label: 'All SDMs' },
        ...uniqueSDMs.map(sdm => ({ value: sdm, label: sdm }))
      ])
      
      setCompanyOptions([
        { value: 'all', label: 'All Companies' },
        ...uniqueCompanies.map(company => ({ value: company, label: company }))
      ])
      
      setFilteredCompanyOptions([
        { value: 'all', label: 'All Companies' },
        ...uniqueCompanies.map(company => ({ value: company, label: company }))
      ])
      
      setHasData(true)
      
      
      setLoading(false)
    } catch (error) {
      console.error('Error loading CSV data:', error)
      setLoading(false)
    }
  }

  const generateMonthOptions = () => {
    if (tickets.length === 0) return []
    
    const months = new Set<string>()
    tickets.forEach(ticket => {
      const date = new Date(ticket.createdTime)
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months.add(monthKey)
      }
    })
    
    return Array.from(months)
      .sort()
      .reverse() // Most recent first
      .map(monthKey => {
        const [year, month] = monthKey.split('-')
        const date = new Date(parseInt(year), parseInt(month) - 1, 1)
        return {
          value: monthKey,
          label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        }
      })
  }

  const getDateFilterRange = (): { from?: string; to?: string } => {
    const now = new Date()
    
    // Handle specific month selection
    if (selectedDateFilter.includes('-')) {
      const [year, month] = selectedDateFilter.split('-')
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0) // Last day of month
      return {
        from: startOfMonth.toISOString().split('T')[0],
        to: endOfMonth.toISOString().split('T')[0]
      }
    }
    
    switch (selectedDateFilter) {
      case 'last3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        return { from: threeMonthsAgo.toISOString().split('T')[0], to: undefined }
      case 'last6months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        return { from: sixMonthsAgo.toISOString().split('T')[0], to: undefined }
      case 'lastyear':
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        return { from: oneYearAgo.toISOString().split('T')[0], to: undefined }
      default:
        return { from: undefined, to: undefined }
    }
  }

  const updateCompanyOptions = () => {
    // Always allow all companies to be visible
    setFilteredCompanyOptions(companyOptions)
    
    // If specific SDM is selected, we can still filter companies in the data processing
    // but keep the dropdown enabled for user selection
    if (!selectedSDM || selectedSDM === 'all') {
      return
    }

    const sdmTickets = tickets.filter(ticket => ticket.sdm === selectedSDM)
    const uniqueCompanies = new Set<string>()
    sdmTickets.forEach(ticket => {
      if (ticket.companyName && ticket.companyName.trim() !== '') {
        uniqueCompanies.add(ticket.companyName)
      }
    })

    setFilteredCompanyOptions([
      { value: 'all', label: 'All Companies' },
      ...Array.from(uniqueCompanies).sort().map(company => ({ value: company, label: company }))
    ])

    // Reset company selection if current selection is not available for this SDM
    if (selectedCompany && selectedCompany !== 'all' && !uniqueCompanies.has(selectedCompany)) {
      setSelectedCompany('all')
    }
  }

  const updateDashboardData = () => {
    const processor = new DataProcessor(tickets, slaOverrides)
    const dateFilter = getDateFilterRange()
    const filteredProcessor = processor.filterTickets({
      sdm: selectedSDM || undefined,
      company: selectedCompany || undefined,
      dateFrom: dateFilter.from,
      dateTo: dateFilter.to || undefined
    })
    
    // For monthly chart, we want to respect SDM/company filters but ignore date filters
    const monthlyChartProcessor = processor.filterTickets({
      sdm: selectedSDM || undefined,
      company: selectedCompany || undefined,
      // Don't apply date filters to monthly chart
    })
    
    setMetrics(filteredProcessor.calculateMetrics())
    setEscalatedTickets(filteredProcessor.getEscalatedTickets())
    setRecentTickets(filteredProcessor.getRecentPriorityTickets())
    
    // Get chart data with monthly data from company/SDM filtered processor
    // and pie chart data from fully filtered processor
    const monthlyChartData = monthlyChartProcessor.getChartData()
    const pieChartData = filteredProcessor.getChartData()
    
    setChartData({
      ticketVolumeData: monthlyChartData.ticketVolumeData,
      openTicketTypeData: pieChartData.openTicketTypeData,
      ageBreakdownData: pieChartData.ageBreakdownData,
      statusData: filteredProcessor.getChartData().statusData
    })
  }

  // Get filtered tickets for the modal
  const getFilteredTickets = () => {
    const processor = new DataProcessor(tickets, slaOverrides)
    const dateFilter = getDateFilterRange()
    return processor.filterTickets({
      sdm: selectedSDM || undefined,
      company: selectedCompany || undefined,
      dateFrom: dateFilter.from,
      dateTo: dateFilter.to || undefined
    }).getTickets()
  }

  // Handle SLA override changes from modal
  const handleSLAOverrideChange = (newOverrides: { [ticketId: string]: boolean }) => {
    setSlaOverrides(newOverrides)
  }

  // Handle PDF export
  const handlePDFExport = async () => {
    setShowExecutiveSummaryModal(true)
  }

  // Handle PDF export with executive summary
  const handlePDFExportWithSummary = async (executiveSummary: string, pageSelection: PageSelectionOptions) => {
    try {
      await exportToPDF({
        tickets: getFilteredTickets(), // For metrics and other filtered data
        allTickets: tickets, // For monthly chart - unfiltered by date
        metrics,
        chartData,
        selectedSDM: selectedSDM === 'all' ? undefined : selectedSDM,
        selectedCompany: selectedCompany === 'all' ? undefined : selectedCompany,
        selectedDateFilter,
        executiveSummary,
        pageSelection
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      // You could show a toast notification here
    }
  }

  const handleCSVUpload = (newTickets: TicketData[]) => {
    try {
      console.log('Processing CSV upload...', { ticketCount: newTickets.length })
      
      setTickets(newTickets)
      
      const processor = new DataProcessor(newTickets)
      console.log('DataProcessor created successfully')
      
      const uniqueSDMs = processor.getUniqueSDMs()
      const uniqueCompanies = processor.getUniqueCompanies()
      console.log('Unique data extracted:', { sdmCount: uniqueSDMs.length, companyCount: uniqueCompanies.length })
      
      setSdmOptions([
        { value: 'all', label: 'All SDMs' },
        ...uniqueSDMs.map(sdm => ({ value: sdm, label: sdm }))
      ])
      
      setCompanyOptions([
        { value: 'all', label: 'All Companies' },
        ...uniqueCompanies.map(company => ({ value: company, label: company }))
      ])
      
      setFilteredCompanyOptions([
        { value: 'all', label: 'All Companies' },
        ...uniqueCompanies.map(company => ({ value: company, label: company }))
      ])
      
      // Reset filters
      setSelectedSDM('all')
      setSelectedCompany('all')
      setSelectedDateFilter('all')
      
      // CSV uploaded successfully
      setLoading(false)
      setHasData(true)
      
      
      console.log('CSV upload completed successfully')
    } catch (error) {
      console.error('Error processing CSV upload:', error)
      setLoading(false)
      // You could show an error message to the user here
    }
  }

  const handleTicketClick = (ticketId: string) => {
    const domain = process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN || 'wsp'
    const freshdeskUrl = `https://${domain}.freshdesk.com/a/tickets/${ticketId}`
    window.open(freshdeskUrl, '_blank')
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch()
    }
  }

  const performSearch = () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false)
      setSearchResults([])
      return
    }

    // Search for exact incident ID match
    const results = tickets.filter(ticket => 
      ticket.ticketId === searchQuery.trim()
    )
    
    setSearchResults(results)
    setShowSearchResults(true)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  // SLA toggle functionality for search results
  const toggleSLAStatus = async (ticketId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    const slaStatus = newStatus ? 'SLA Violated' : 'Within SLA'
    
    console.log(`Toggle SLA for ticket ${ticketId}: ${currentStatus ? 'Breached' : 'Within SLA'} → ${slaStatus}`)
    
    // Add to loading state
    setLoadingTickets(prev => new Set(prev).add(ticketId))
    
    try {
      // Update local state first for immediate UI feedback
      const newOverrides = {
        ...slaOverrides,
        [ticketId]: newStatus
      }
      setSlaOverrides(newOverrides)
      
      // Update search results immediately
      setSearchResults(prevResults => 
        prevResults.map(result => 
          result.ticketId === ticketId 
            ? { ...result, resolutionStatus: newStatus ? 'SLA Violated' : 'Within SLA' }
            : result
        )
      )
      
      // Update Freshdesk via API route
      const response = await freshdeskClient.updateSLAStatus(ticketId, slaStatus)
      
      if (response.error) {
        // Revert local state if API call failed
        setSlaOverrides(slaOverrides)
        setSearchResults(prevResults => 
          prevResults.map(result => 
            result.ticketId === ticketId 
              ? { ...result, resolutionStatus: currentStatus ? 'SLA Violated' : 'Within SLA' }
              : result
          )
        )
        toast.error(`Failed to update SLA status in Freshdesk: ${response.error}`)
      } else {
        toast.success(slaStatus === 'Within SLA' 
          ? `Ticket marked as Within SLA (override applied) in Freshdesk` 
          : `Override cleared - ticket follows normal SLA calculation in Freshdesk`)
      }
    } catch (error) {
      // Revert local state if something went wrong
      setSlaOverrides(slaOverrides)
      setSearchResults(prevResults => 
        prevResults.map(result => 
          result.ticketId === ticketId 
            ? { ...result, resolutionStatus: currentStatus ? 'SLA Violated' : 'Within SLA' }
            : result
        )
      )
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

  // Helper function to determine if ticket is breached
  const isTicketBreached = (ticket: TicketData): boolean => {
    // Check if manual override exists (highest priority)
    if (slaOverrides.hasOwnProperty(ticket.ticketId)) {
      return slaOverrides[ticket.ticketId]
    }
    
    // Check CSV "Within SLA Override" field first
    if (ticket.withinSlaOverride && ticket.withinSlaOverride.toLowerCase() === 'true') {
      return false // Override says within SLA
    }
    
    // Use existing resolution status logic
    if (ticket.resolutionStatus === 'Within SLA') {
      return false
    } else if (ticket.resolutionStatus === 'SLA Violated') {
      return true
    } else if (!ticket.resolutionStatus || ticket.resolutionStatus.trim() === '') {
      // If resolution status is blank, check due date and status
      if (ticket.status === 'Pending' || ticket.status === 'Pending - Close') {
        return false // Assume still within SLA
      } else {
        // Check if due date has been reached
        const dueDate = new Date(ticket.dueByTime)
        const now = new Date()
        return now > dueDate
      }
    }
    
    return false
  }

  const getDateFilterLabel = (dateFilter: string): string => {
    switch (dateFilter) {
      case 'last3months': return 'Last 3 Months'
      case 'last6months': return 'Last 6 Months'
      case 'lastyear': return 'Last 12 Months'
      case 'all': return 'All Time'
      default:
        if (dateFilter?.includes('-')) {
          const [year, month] = dateFilter.split('-')
          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
          return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        }
        return 'Selected Period'
    }
  }

  const handleExcelExport = () => {
    const filteredTickets = getFilteredTickets()
    
    if (filteredTickets.length === 0) {
      alert('No tickets to export with current filters')
      return
    }

    // Create CSV content
    const headers = [
      'Ticket ID',
      'Subject',
      'Company',
      'Agent',
      'SDM',
      'Status',
      'Priority',
      'Type',
      'Created Time',
      'Resolved Time',
      'Resolution Status',
      'Due By Time',
      'SDM Escalation'
    ]

    const csvRows = [headers.join(',')]
    
    filteredTickets.forEach(ticket => {
      const row = [
        ticket.ticketId || '',
        `"${(ticket.subject || '').replace(/"/g, '""')}"`,
        `"${(ticket.companyName || '').replace(/"/g, '""')}"`,
        `"${(ticket.agent || '').replace(/"/g, '""')}"`,
        `"${(ticket.sdm || '').replace(/"/g, '""')}"`,
        ticket.status || '',
        ticket.priority || '',
        ticket.type || '',
        ticket.createdTime || '',
        ticket.resolvedTime || '',
        ticket.resolutionStatus || '',
        ticket.dueByTime || '',
        ticket.sdmEscalation || ''
      ]
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    // Generate filename based on current filters
    const timestamp = new Date().toISOString().split('T')[0]
    const companyName = selectedCompany && selectedCompany !== 'all' ? selectedCompany.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Companies'
    const sdmName = selectedSDM && selectedSDM !== 'all' ? selectedSDM.replace(/[^a-zA-Z0-9]/g, '_') : 'All_SDMs'
    const dateFilter = selectedDateFilter && selectedDateFilter !== 'all' ? selectedDateFilter : 'All_Time'
    
    const filename = `Service_Desk_Export_${companyName}_${sdmName}_${dateFilter}_${timestamp}.csv`
    
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', filename)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = "up",
    onClick,
    children,
  }: {
    title: string
    value: string | number
    change?: string
    icon: any
    trend?: "up" | "down"
    onClick?: () => void
    children?: React.ReactNode
  }) => {
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm"
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <Icon className="h-4 w-4 text-teal-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {change && (
            <p className={`text-xs ${trend === "up" ? "text-green-600" : "text-red-600"} flex items-center mt-1`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {change}
            </p>
          )}
          {children}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400">
      {/* Header */}
      <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:bg-white/20"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tools
              </Button>
              <img 
                src="/logo.png" 
                alt="Taranto Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = document.createElement('h1')
                  fallback.textContent = 'Taranto'
                  fallback.className = 'text-2xl font-bold text-white'
                  e.currentTarget.parentNode?.insertBefore(fallback, e.currentTarget)
                }}
              />
              <span className="text-gray-300">Service Desk Analytics</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search incident ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-64"
                />
              </div>
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar - only show when data is loaded */}
      {hasData && (
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm font-medium">Filters:</span>
              </div>

              {/* SDM Dropdown */}
              <Select value={selectedSDM} onValueChange={setSelectedSDM}>
                <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select SDM" />
                </SelectTrigger>
                <SelectContent>
                  {sdmOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Company Dropdown */}
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCompanyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Filter Dropdown */}
              <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select Time Period" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={() => {
                  setSelectedSDM('all')
                  setSelectedCompany('all')
                  setSelectedDateFilter('all')
                }}
              >
                Clear Filters
              </Button>

              {/* Clear Search Button - only show when search is active */}
              {showSearchResults && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-white/20"
                  onClick={clearSearch}
                >
                  Clear Search
                </Button>
              )}

            </div>

            {/* Export and AI Icons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                title="Replace CSV Data"
                onClick={() => {
                  setHasData(false)
                  setTickets([])
                  setSelectedSDM('all')
                  setSelectedCompany('all')
                  setSelectedDateFilter('all')
                  // Clear data state
                }}
              >
                <Upload className="h-4 w-4" />
                <span className="ml-1 text-xs">CSV</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                title="Export Service Review PDF"
                onClick={handlePDFExport}
              >
                <FileText className="h-4 w-4" />
                <span className="ml-1 text-xs">PDF</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                title="Export to Excel"
                onClick={handleExcelExport}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="ml-1 text-xs">Excel</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                title="Monthly Review"
                onClick={() => setShowMonthlyReviewModal(true)}
              >
                <Calendar className="h-4 w-4" />
                <span className="ml-1 text-xs">Review</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                title="AI Insights"
                onClick={() => setShowAIModal(true)}
              >
                <Brain className="h-4 w-4" />
                <span className="ml-1 text-xs">AI</span>
              </Button>
            </div>
          </div>
        </div>
        </div>
      )}

      <div className="p-6">
        {/* Initial Upload State */}
        {!hasData && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-12 max-w-lg">
              <Upload className="mx-auto h-16 w-16 text-teal-600 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Service Desk Analytics
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your CSV file to start analyzing your service desk data and gain insights into ticket trends, SLA compliance, and team performance.
              </p>
              <CSVUpload onDataUpload={handleCSVUpload} className="mt-4" />
            </div>
          </div>
        )}

        {/* Dashboard Content - only show when data is loaded */}
        {hasData && (
          <div>
            {/* Search Results */}
            {showSearchResults && (
              <div className="mb-8">
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Search Results for "{searchQuery}"</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSearch}
                          className="h-8 w-8 p-0"
                          title="Close search results"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchResults.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No incident found with ID: {searchQuery}
                      </p>
                    ) : (
                      <div className="space-y-6">
                        {searchResults.map((ticket) => {
                          const isBreached = isTicketBreached(ticket)
                          return (
                            <div 
                              key={ticket.ticketId}
                              className={`p-6 rounded-lg border-l-4 ${
                                isBreached 
                                  ? 'border-red-500 bg-red-50' 
                                  : 'border-green-500 bg-green-50'
                              }`}
                            >
                              {/* Header with Ticket ID and SLA Status */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <span 
                                    className="text-xl font-bold text-blue-600 cursor-pointer hover:text-blue-800 underline" 
                                    onClick={() => handleTicketClick(ticket.ticketId)}
                                  >
                                    {ticket.ticketId}
                                  </span>
                                  <Badge className={`${
                                    ticket.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                    ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                                    ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {ticket.priority}
                                  </Badge>
                                  <Badge variant="outline">{ticket.status}</Badge>
                                  <Badge variant="outline">{ticket.type}</Badge>
                                </div>
                                
                                {/* SLA Toggle */}
                                <div className="flex items-center space-x-3">
                                  <div className={`flex items-center ${isBreached ? 'text-red-600' : 'text-green-600'}`}>
                                    {isBreached ? (
                                      <AlertTriangle className="h-4 w-4 mr-1" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                    )}
                                    <span className="font-medium">
                                      {isBreached ? 'SLA Breached' : 'Within SLA'}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-8 w-8"
                                    onClick={() => toggleSLAStatus(ticket.ticketId, isBreached)}
                                    title={`Toggle to ${isBreached ? 'Within SLA' : 'SLA Breached'}`}
                                    disabled={loadingTickets.has(ticket.ticketId)}
                                  >
                                    {loadingTickets.has(ticket.ticketId) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : isBreached ? (
                                      <ToggleLeft className="h-5 w-5 text-red-600" />
                                    ) : (
                                      <ToggleRight className="h-5 w-5 text-green-600" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Subject */}
                              <h3 className="text-lg font-semibold text-gray-900 mb-4">{ticket.subject}</h3>

                              {/* All Field Values in a Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-700 border-b pb-1">Contact Information</h4>
                                  <div><span className="font-medium">Company:</span> {ticket.companyName || 'N/A'}</div>
                                  <div><span className="font-medium">Requester:</span> {ticket.requester || 'N/A'}</div>
                                  <div><span className="font-medium">Email:</span> {ticket.requesterEmail || 'N/A'}</div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-700 border-b pb-1">Assignment</h4>
                                  <div><span className="font-medium">Agent:</span> {ticket.agent || 'N/A'}</div>
                                  <div><span className="font-medium">SDM:</span> {ticket.sdm || 'N/A'}</div>
                                  <div><span className="font-medium">Group:</span> {ticket.group || 'N/A'}</div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-700 border-b pb-1">Timestamps</h4>
                                  <div><span className="font-medium">Created:</span> {ticket.createdTime ? new Date(ticket.createdTime).toLocaleString() : 'N/A'}</div>
                                  <div><span className="font-medium">Updated:</span> {ticket.updatedTime ? new Date(ticket.updatedTime).toLocaleString() : 'N/A'}</div>
                                  <div><span className="font-medium">Due By:</span> {ticket.dueByTime ? new Date(ticket.dueByTime).toLocaleString() : 'N/A'}</div>
                                  {ticket.resolvedTime && (
                                    <div><span className="font-medium">Resolved:</span> {new Date(ticket.resolvedTime).toLocaleString()}</div>
                                  )}
                                  {ticket.closedTime && (
                                    <div><span className="font-medium">Closed:</span> {new Date(ticket.closedTime).toLocaleString()}</div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-700 border-b pb-1">Classification</h4>
                                  <div><span className="font-medium">Source:</span> {ticket.source || 'N/A'}</div>
                                  <div><span className="font-medium">Category:</span> {ticket.category || 'N/A'}</div>
                                  <div><span className="font-medium">Sub-category:</span> {ticket.subCategory || 'N/A'}</div>
                                  <div><span className="font-medium">Item Category:</span> {ticket.itemCategory || 'N/A'}</div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-700 border-b pb-1">SLA & Status</h4>
                                  <div><span className="font-medium">Resolution Status:</span> {ticket.resolutionStatus || 'N/A'}</div>
                                  <div><span className="font-medium">SDM Escalation:</span> {ticket.sdmEscalation === 'true' ? 'Yes' : 'No'}</div>
                                  <div><span className="font-medium">First Response Due:</span> {ticket.frDueByTime ? new Date(ticket.frDueByTime).toLocaleString() : 'N/A'}</div>
                                  {slaOverrides.hasOwnProperty(ticket.ticketId) && (
                                    <div className="text-blue-600 font-medium">(Manual Override Applied)</div>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold text-gray-700 border-b pb-1">Additional Info</h4>
                                  <div><span className="font-medium">Tags:</span> {ticket.tags || 'N/A'}</div>
                                  <div><span className="font-medium">Custom Fields:</span> {ticket.customFields || 'N/A'}</div>
                                  {ticket.description && (
                                    <div className="col-span-full mt-4">
                                      <h4 className="font-semibold text-gray-700 border-b pb-1 mb-2">Description</h4>
                                      <p className="text-gray-600 bg-gray-100 p-3 rounded text-xs">{ticket.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Key Metrics */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
                  Key Metrics - {getDateFilterLabel(selectedDateFilter)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="p-6 rounded-lg bg-gray-50">
                        <div className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Tickets</p>
                          <p className="text-3xl font-bold text-gray-900">{metrics.totalTickets}</p>
                        </div>
                        <Activity className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Open Tickets</p>
                          <p className="text-3xl font-bold text-gray-900">{metrics.openTickets}</p>
                        </div>
                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                    
                    <div className="p-6 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Closed Tickets</p>
                          <p className="text-3xl font-bold text-gray-900">{metrics.closedTickets}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div 
                      className="p-6 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                      onClick={() => setShowSLAModal(true)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">SLA Compliance</p>
                          <p className="text-3xl font-bold text-gray-900">{metrics.slaCompliance}%</p>
                        </div>
                        <Target className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Monthly Created vs Resolved Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
                </div>
              ) : (
                <MonthlyTicketsChart data={chartData.ticketVolumeData} />
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Open Tickets by Type</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
                </div>
              ) : (
                <OpenTicketsPieChart data={chartData.openTicketTypeData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row of Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Breakdown by Age of Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
                </div>
              ) : (
                <TicketAgeBreakdownChart data={chartData.ageBreakdownData} />
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">Open Tickets by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse bg-gray-200 rounded w-full h-full"></div>
                </div>
              ) : (
                <TicketStatusChart data={chartData.statusData} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Escalated Tickets Section */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 flex items-center">
                <ArrowUp className="h-5 w-5 text-red-600 mr-2" />
                Escalated Tickets
              </CardTitle>
              <Badge className="bg-red-100 text-red-800">
                {loading ? '...' : `${escalatedTickets?.length || 0} Escalated`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 rounded-full bg-gray-300" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {!escalatedTickets || escalatedTickets.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No escalated tickets found</p>
                ) : (
                  escalatedTickets.slice(0, 5).map((ticket) => {
                    const priorityColor = ticket.priority === 'Urgent' ? 'red' : 
                                         ticket.priority === 'High' ? 'orange' : 'yellow'
                    return (
                      <div key={ticket.ticketId} className={`flex items-center justify-between p-4 bg-${priorityColor}-50 rounded-lg border-l-4 border-${priorityColor}-500`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full bg-${priorityColor}-500`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                            <p className="text-sm text-gray-600">
                              <span 
                                className="cursor-pointer text-blue-600 hover:text-blue-800 underline" 
                                onClick={() => handleTicketClick(ticket.ticketId)}
                              >
                                {ticket.ticketId}
                              </span> • {ticket.companyName} • {new Date(ticket.createdTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`bg-${priorityColor}-100 text-${priorityColor}-800`}>
                            {ticket.priority}
                          </Badge>
                          {ticket.usersAffected > 0 && (
                            <span className="text-sm text-gray-600">{ticket.usersAffected}+ users affected</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Priority Tickets */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">Recent Priority Tickets</CardTitle>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-3 h-3 rounded-full bg-gray-300" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {!recentTickets || recentTickets.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No high priority tickets found</p>
                  ) : (
                    recentTickets.map((ticket) => {
                      const priorityColor = ticket.priority === 'Urgent' ? 'red' : 'orange'
                      return (
                        <div key={ticket.ticketId} className={`flex items-center justify-between p-4 bg-${priorityColor}-50 rounded-lg hover:bg-${priorityColor}-100 transition-colors`}>
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full bg-${priorityColor}-500`} />
                            <div>
                              <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                              <p className="text-sm text-gray-600">
                                <span 
                                  className="cursor-pointer text-blue-600 hover:text-blue-800 underline" 
                                  onClick={() => handleTicketClick(ticket.ticketId)}
                                >
                                  {ticket.ticketId}
                                </span> • {new Date(ticket.createdTime).toLocaleDateString()} • {ticket.agent}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`bg-${priorityColor}-100 text-${priorityColor}-800`}>
                              {ticket.priority}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
          </div>
        )}
      </div>
      
      {/* SLA Compliance Modal */}
      {showSLAModal && (
        <SLAComplianceModal
          isOpen={showSLAModal}
          onClose={() => setShowSLAModal(false)}
          tickets={getFilteredTickets()}
          compliancePercentage={metrics.slaCompliance}
          selectedCompany={selectedCompany}
          currentSLAOverrides={slaOverrides}
          onSLAOverrideChange={handleSLAOverrideChange}
        />
      )}
      
      {/* AI Insights Modal */}
      {showAIModal && (
        <AIInsightsModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          tickets={getFilteredTickets()}
          metrics={metrics}
          selectedSDM={selectedSDM}
          selectedCompany={selectedCompany}
          selectedDateFilter={selectedDateFilter}
        />
      )}
      
      {/* Monthly Review Modal */}
      {showMonthlyReviewModal && (
        <MonthlyReviewModal
          isOpen={showMonthlyReviewModal}
          onClose={() => setShowMonthlyReviewModal(false)}
          tickets={tickets}
        />
      )}
      
      {/* Executive Summary Modal */}
      {showExecutiveSummaryModal && (
        <ExecutiveSummaryModal
          isOpen={showExecutiveSummaryModal}
          onClose={() => setShowExecutiveSummaryModal(false)}
          onConfirm={handlePDFExportWithSummary}
          metrics={metrics}
          selectedCompany={selectedCompany}
          selectedSDM={selectedSDM}
          selectedDateFilter={selectedDateFilter}
        />
      )}

      
    </div>
  )
}