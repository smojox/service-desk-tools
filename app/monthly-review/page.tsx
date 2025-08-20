"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Calendar,
  Users,
  Building2,
  MessageSquare,
  Target,
  Save,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TicketData, parseCSV } from "@/lib/csv-parser"
import { DataProcessor } from "@/lib/data-processor"

interface CompanyReviewData {
  companyName: string
  totalTickets: number
  openTickets: number
  closedTickets: number
  avgResolutionTime: number
  slaCompliance: number
  previousMonthSLA: number
  slaChange: number
  openIncidents: number
  openServiceRequests: number
  openProblems: number
  openOthers: number
  ragStatus: 'red' | 'amber' | 'green' | 'not-set'
  comments: string
}

interface MonthlyReviewData {
  selectedMonth: string
  selectedSDM: string
  companies: CompanyReviewData[]
  lastSaved: string | null
}

const RAG_OPTIONS = [
  { value: 'not-set', label: 'Not Set', color: 'bg-gray-100 text-gray-800' },
  { value: 'red', label: 'Red', color: 'bg-red-100 text-red-800' },
  { value: 'amber', label: 'Amber', color: 'bg-amber-100 text-amber-800' },
  { value: 'green', label: 'Green', color: 'bg-green-100 text-green-800' }
]

export default function MonthlyReviewPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedSDM, setSelectedSDM] = useState<string>('')
  const [monthOptions, setMonthOptions] = useState<Array<{value: string, label: string}>>([])
  const [sdmOptions, setSdmOptions] = useState<Array<{value: string, label: string}>>([])
  const [reviewData, setReviewData] = useState<MonthlyReviewData>({
    selectedMonth: '',
    selectedSDM: '',
    companies: [],
    lastSaved: null
  })
  const [loading, setLoading] = useState(false)
  const [hasData, setHasData] = useState(false)

  // Load CSV data on mount
  useEffect(() => {
    loadCSVData()
  }, [])

  // Update review data when selections change
  useEffect(() => {
    if (selectedMonth && selectedSDM && tickets.length > 0) {
      // First try to load saved data
      const key = `monthly-review-${selectedSDM}-${selectedMonth}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          const savedData = JSON.parse(saved)
          setReviewData(savedData)
        } catch (error) {
          console.error('Error loading saved review data:', error)
          generateReviewData()
        }
      } else {
        generateReviewData()
      }
    }
  }, [selectedMonth, selectedSDM, tickets])

  const loadCSVData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/testfiles/testfile.csv')
      const csvContent = await response.text()
      const parsedTickets = parseCSV(csvContent)
      setTickets(parsedTickets)
      
      const processor = new DataProcessor(parsedTickets)
      const uniqueSDMs = processor.getUniqueSDMs()
      
      setSdmOptions(uniqueSDMs.map(sdm => ({ value: sdm, label: sdm })))
      
      // Generate month options from ticket data
      const months = new Set<string>()
      parsedTickets.forEach(ticket => {
        try {
          if (ticket.createdTime) {
            const date = new Date(ticket.createdTime)
            if (!isNaN(date.getTime())) {
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              months.add(monthKey)
            }
          }
        } catch (error) {
          console.warn('Error parsing created time:', ticket.createdTime, error)
        }
      })
      
      const monthOptionsArray = Array.from(months)
        .sort()
        .reverse()
        .map(monthKey => {
          const [year, month] = monthKey.split('-')
          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
          return {
            value: monthKey,
            label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          }
        })
      
      setMonthOptions(monthOptionsArray)
      setHasData(true)
      setLoading(false)
    } catch (error) {
      console.error('Error loading CSV data:', error)
      setLoading(false)
    }
  }

  const generateReviewData = () => {
    if (!selectedMonth || !selectedSDM) return

    try {
      const processor = new DataProcessor(tickets)
      
      // Filter tickets by SDM and month
      const [year, month] = selectedMonth.split('-')
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0)
      
      const filteredProcessor = processor.filterTickets({
        sdm: selectedSDM,
        dateFrom: startOfMonth.toISOString().split('T')[0],
        dateTo: endOfMonth.toISOString().split('T')[0]
      })
      
      const filteredTickets = filteredProcessor.getTickets()
    
    // Group by company and calculate metrics
    const companyMap = new Map<string, CompanyReviewData>()
    
    filteredTickets.forEach(ticket => {
      const companyName = ticket.companyName || 'Unknown Company'
      
      if (!companyMap.has(companyName)) {
        companyMap.set(companyName, {
          companyName,
          totalTickets: 0,
          openTickets: 0,
          closedTickets: 0,
          avgResolutionTime: 0,
          slaCompliance: 0,
          previousMonthSLA: 0,
          slaChange: 0,
          openIncidents: 0,
          openServiceRequests: 0,
          openProblems: 0,
          openOthers: 0,
          ragStatus: 'not-set',
          comments: ''
        })
      }
      
      const company = companyMap.get(companyName)!
      company.totalTickets++
      
      if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
        company.closedTickets++
      } else {
        company.openTickets++
      }
    })
    
    // Calculate additional metrics for each company
    companyMap.forEach((company, companyName) => {
      const companyTickets = filteredTickets.filter(t => (t.companyName || 'Unknown Company') === companyName)
      
      // Calculate average resolution time
      const resolvedTickets = companyTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed')
      if (resolvedTickets.length > 0) {
        const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
          try {
            // Handle different time formats - could be "00:00:00" or just "0"
            let resolutionTime = 0
            if (ticket.resolutionTimeHrs) {
              if (ticket.resolutionTimeHrs.includes(':')) {
                resolutionTime = parseFloat(ticket.resolutionTimeHrs.split(':')[0]) || 0
              } else {
                resolutionTime = parseFloat(ticket.resolutionTimeHrs) || 0
              }
            }
            return sum + resolutionTime
          } catch (error) {
            console.warn('Error parsing resolution time:', ticket.resolutionTimeHrs, error)
            return sum
          }
        }, 0)
        company.avgResolutionTime = Math.round((totalResolutionTime / resolvedTickets.length) * 10) / 10
      }
      
      // Calculate SLA compliance
      let compliantCount = 0
      companyTickets.forEach(ticket => {
        if (ticket.resolutionStatus === 'Within SLA') {
          compliantCount++
        }
      })
      company.slaCompliance = Math.round((compliantCount / companyTickets.length) * 100 * 10) / 10
    })

    // Calculate previous month SLA and open tickets by type for all companies
    companyMap.forEach((company, companyName) => {
      // Calculate previous month SLA
      const [year, month] = selectedMonth.split('-')
      const prevMonth = parseInt(month) - 1
      const prevYear = prevMonth === 0 ? parseInt(year) - 1 : parseInt(year)
      const prevMonthNum = prevMonth === 0 ? 12 : prevMonth
      const prevStartOfMonth = new Date(prevYear, prevMonthNum - 1, 1)
      const prevEndOfMonth = new Date(prevYear, prevMonthNum, 0)
      
      const prevMonthProcessor = processor.filterTickets({
        sdm: selectedSDM,
        company: companyName !== 'Unknown Company' ? companyName : undefined,
        dateFrom: prevStartOfMonth.toISOString().split('T')[0],
        dateTo: prevEndOfMonth.toISOString().split('T')[0]
      })
      
      const prevMonthTickets = prevMonthProcessor.getTickets()
      let prevCompliantCount = 0
      prevMonthTickets.forEach(ticket => {
        if (ticket.resolutionStatus === 'Within SLA') {
          prevCompliantCount++
        }
      })
      
      if (prevMonthTickets.length > 0) {
        company.previousMonthSLA = Math.round((prevCompliantCount / prevMonthTickets.length) * 100 * 10) / 10
        company.slaChange = Math.round((company.slaCompliance - company.previousMonthSLA) * 10) / 10
      } else {
        company.previousMonthSLA = -1 // Use -1 to indicate no data
        company.slaChange = 0
      }

      // Calculate open tickets by type (ALL open tickets regardless of creation date)
      // This shows the current state of open tickets for each company
      const allTicketsForCompany = tickets.filter(ticket => 
        (ticket.companyName || 'Unknown Company') === companyName &&
        ticket.sdm === selectedSDM &&
        ticket.status !== 'Resolved' && 
        ticket.status !== 'Closed'
      )
      
      // Count open tickets by specific types - current state as of report date
      allTicketsForCompany.forEach(ticket => {
        const type = ticket.type || 'Unknown'
        switch (type) {
          case 'Incident':
            company.openIncidents++
            break
          case 'Service Request':
            company.openServiceRequests++
            break
          case 'Problem':
            company.openProblems++
            break
          default:
            company.openOthers++
            break
        }
      })
    })
    
    const companiesArray = Array.from(companyMap.values()).sort((a, b) => a.companyName.localeCompare(b.companyName))
    
    setReviewData({
      selectedMonth,
      selectedSDM,
      companies: companiesArray,
      lastSaved: null
    })
    } catch (error) {
      console.error('Error generating review data:', error)
      setReviewData({
        selectedMonth,
        selectedSDM,
        companies: [],
        lastSaved: null
      })
    }
  }

  const updateCompanyRAG = (companyName: string, ragStatus: 'red' | 'amber' | 'green' | 'not-set') => {
    setReviewData(prev => ({
      ...prev,
      companies: prev.companies.map(company => 
        company.companyName === companyName 
          ? { ...company, ragStatus }
          : company
      )
    }))
  }

  // Local state for comment inputs to improve typing performance
  const [localComments, setLocalComments] = useState<{ [companyName: string]: string }>({})

  // Initialize local comments when review data changes
  useEffect(() => {
    const commentsMap: { [companyName: string]: string } = {}
    reviewData.companies.forEach(company => {
      commentsMap[company.companyName] = company.comments
    })
    setLocalComments(commentsMap)
  }, [reviewData.companies])

  // Auto-save review data when it changes (debounced)
  useEffect(() => {
    if (reviewData.companies.length > 0 && selectedSDM && selectedMonth) {
      const timeoutId = setTimeout(() => {
        const key = `monthly-review-${selectedSDM}-${selectedMonth}`
        const dataToSave = {
          ...reviewData,
          companies: reviewData.companies.map(company => ({
            ...company,
            comments: localComments[company.companyName] || company.comments
          }))
        }
        localStorage.setItem(key, JSON.stringify(dataToSave))
      }, 1000) // Auto-save after 1 second of inactivity

      return () => clearTimeout(timeoutId)
    }
  }, [reviewData, localComments, selectedSDM, selectedMonth])

  // Immediate local update for responsive typing
  const handleCommentChange = useCallback((companyName: string, value: string) => {
    setLocalComments(prev => ({
      ...prev,
      [companyName]: value
    }))
  }, [])

  // Debounced update to the main state
  const debouncedUpdateComments = useMemo(() => {
    const timeouts = new Map<string, NodeJS.Timeout>()
    
    return (companyName: string, comments: string) => {
      const existingTimeout = timeouts.get(companyName)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }
      
      const newTimeout = setTimeout(() => {
        setReviewData(prev => ({
          ...prev,
          companies: prev.companies.map(company => 
            company.companyName === companyName 
              ? { ...company, comments }
              : company
          )
        }))
        timeouts.delete(companyName)
      }, 500) // 500ms debounce
      
      timeouts.set(companyName, newTimeout)
    }
  }, [])

  // Combined handler that updates both local and debounced state
  const updateCompanyComments = useCallback((companyName: string, comments: string) => {
    handleCommentChange(companyName, comments)
    debouncedUpdateComments(companyName, comments)
  }, [handleCommentChange, debouncedUpdateComments])

  const saveReview = () => {
    // First sync any pending local comments to the main state
    const updatedReviewData = {
      ...reviewData,
      companies: reviewData.companies.map(company => ({
        ...company,
        comments: localComments[company.companyName] || company.comments
      }))
    }
    
    // Save to local storage
    const key = `monthly-review-${selectedSDM}-${selectedMonth}`
    localStorage.setItem(key, JSON.stringify(updatedReviewData))
    
    // Update the main state with synced comments and last saved time
    setReviewData({
      ...updatedReviewData,
      lastSaved: new Date().toISOString()
    })
  }

  const loadSavedReview = () => {
    if (!selectedSDM || !selectedMonth) return
    
    const key = `monthly-review-${selectedSDM}-${selectedMonth}`
    const saved = localStorage.getItem(key)
    if (saved) {
      const savedData = JSON.parse(saved)
      setReviewData(savedData)
    }
  }

  const exportToExcel = () => {
    if (reviewData.companies.length === 0) return

    // Create CSV content
    const headers = [
      'Company',
      'Total Tickets (Month)',
      'Open Tickets (Month)',
      'Closed Tickets (Month)',
      'Avg Resolution Time (hrs)',
      'Current SLA (%)',
      'Previous SLA (%)',
      'SLA Change (%)',
      'Open Incidents',
      'Open Service Requests',
      'Open Problems',
      'Open Others',
      'RAG Status',
      'Comments'
    ]
    
    const csvContent = [
      headers.join(','),
      ...reviewData.companies.map(company => [
        `"${company.companyName}"`,
        company.totalTickets,
        company.openTickets,
        company.closedTickets,
        company.avgResolutionTime,
        company.slaCompliance,
        company.previousMonthSLA >= 0 ? company.previousMonthSLA : 'N/A',
        company.slaChange,
        company.openIncidents,
        company.openServiceRequests,
        company.openProblems,
        company.openOthers,
        company.ragStatus !== 'not-set' ? company.ragStatus.toUpperCase() : '',
        `"${(localComments[company.companyName] || company.comments).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `monthly-review-${selectedSDM}-${selectedMonth}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }


  const getRagBadge = (ragStatus: string) => {
    const ragOption = RAG_OPTIONS.find(option => option.value === ragStatus)
    return ragOption ? ragOption : RAG_OPTIONS[0]
  }

  const getSLAChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center justify-center text-green-600">
          <ArrowUp className="h-4 w-4 mr-1" />
          <span>+{change}%</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center justify-center text-red-600">
          <ArrowDown className="h-4 w-4 mr-1" />
          <span>{change}%</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center justify-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          <span>0%</span>
        </div>
      )
    }
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
                size="icon"
                className="text-gray-300 hover:text-white"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/logo.png" 
                alt="Taranto Logo" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <span className="text-gray-300">Monthly SDM Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={saveReview}
                disabled={!selectedSDM || !selectedMonth}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={loadSavedReview}
                disabled={!selectedSDM || !selectedMonth}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Load
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
                onClick={exportToExcel}
                disabled={reviewData.companies.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Selection Controls */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Calendar className="h-5 w-5 mr-2" />
              Monthly Review Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select SDM
                </label>
                <Select value={selectedSDM} onValueChange={setSelectedSDM}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose SDM" />
                  </SelectTrigger>
                  <SelectContent>
                    {sdmOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {reviewData.lastSaved && (
              <div className="mt-4 text-sm text-gray-600">
                Last saved: {new Date(reviewData.lastSaved).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Table */}
        {selectedMonth && selectedSDM && reviewData.companies.length > 0 && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Building2 className="h-5 w-5 mr-2" />
                Company Review - {selectedSDM} - {monthOptions.find(m => m.value === selectedMonth)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold text-sm">Company</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Total (Month)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Open (Month)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Closed (Month)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Avg Res (hrs)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Current SLA (%)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Prev SLA (%)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">SLA Change</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Incidents (Open)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Requests (Open)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Problems (Open)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">Other (Open)</TableHead>
                      <TableHead className="font-semibold text-center text-xs">RAG</TableHead>
                      <TableHead className="font-semibold text-sm">Comments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewData.companies.map((company, index) => (
                      <TableRow key={company.companyName} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <TableCell className="font-medium text-sm">
                          {company.companyName}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.totalTickets}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.openTickets}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.closedTickets}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.avgResolutionTime}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.slaCompliance}%
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.previousMonthSLA >= 0 ? `${company.previousMonthSLA}%` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-center text-xs px-1">
                          {getSLAChangeIndicator(company.slaChange)}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.openIncidents}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.openServiceRequests}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.openProblems}
                        </TableCell>
                        <TableCell className="text-center text-xs px-2">
                          {company.openOthers}
                        </TableCell>
                        <TableCell className="text-center px-1">
                          <Select 
                            value={company.ragStatus} 
                            onValueChange={(value) => updateCompanyRAG(company.companyName, value as 'red' | 'amber' | 'green' | 'not-set')}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue>
                                <Badge className={`${getRagBadge(company.ragStatus).color} text-xs px-1`}>
                                  {getRagBadge(company.ragStatus).label}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {RAG_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  <Badge className={`${option.color} text-xs px-1`}>
                                    {option.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[180px] px-2">
                          <Textarea
                            value={localComments[company.companyName] || company.comments}
                            onChange={(e) => updateCompanyComments(company.companyName, e.target.value)}
                            placeholder="Add comments..."
                            className="min-h-[50px] resize-none text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {(!selectedMonth || !selectedSDM) && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Month and SDM
              </h3>
              <p className="text-gray-500">
                Choose a month and SDM to generate the monthly review table
              </p>
            </CardContent>
          </Card>
        )}

        {/* No data state */}
        {selectedMonth && selectedSDM && reviewData.companies.length === 0 && (
          <Card className="border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Data Available
              </h3>
              <p className="text-gray-500">
                No tickets found for {selectedSDM} in {monthOptions.find(m => m.value === selectedMonth)?.label}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}