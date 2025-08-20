"use client"

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { TicketData } from '@/lib/csv-parser'
import { DashboardMetrics, ChartData } from '@/lib/data-processor'
import { PageSelectionOptions } from '@/components/modals/executive-summary-modal'

interface PDFExportProps {
  tickets: TicketData[]
  allTickets?: TicketData[] // For monthly chart - unfiltered by date
  metrics: DashboardMetrics
  chartData: ChartData
  selectedSDM?: string
  selectedCompany?: string
  selectedDateFilter?: string
  executiveSummary?: string
  pageSelection?: PageSelectionOptions
}

export class ClientServiceReportGenerator {
  private templateDoc: PDFDocument | null = null
  private newDoc: PDFDocument | null = null

  constructor() {
    this.templateDoc = null
    this.newDoc = null
  }

  // Helper function to convert priority text to Priority numbers
  private convertPriorityToNumber(priority: string, type?: string): string {
    // Special case: Question / Severity 5 is always Priority 5
    if (type && type.toLowerCase().includes('question') && type.toLowerCase().includes('severity 5')) {
      return 'Priority 5'
    }
    
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'Priority 1'
      case 'high':
        return 'Priority 2'
      case 'medium':
        return 'Priority 3'
      case 'low':
        return 'Priority 4'
      default:
        return priority || 'N/A'
    }
  }

  async generateReport(data: PDFExportProps): Promise<void> {
    const { metrics, tickets, allTickets, chartData, selectedSDM, selectedCompany, selectedDateFilter, executiveSummary, pageSelection } = data
    
    try {
      // Load template PDF
      await this.loadTemplatePDF()
      
      // Create new PDF document
      this.newDoc = await PDFDocument.create()
      
      // Copy and modify specific pages from template
      await this.createTitlePageWithTemplate(selectedCompany, selectedDateFilter, selectedSDM)
      await this.createAgendaPageWithTemplate(executiveSummary, pageSelection) // Pass pageSelection to filter agenda
      
      // Add executive summary page if provided
      if (executiveSummary && executiveSummary.trim()) {
        await this.createExecutiveSummaryPageWithTemplate(executiveSummary)
      }
      
      // Add pages based on selection
      if (pageSelection?.keyPerformanceMetrics !== false) {
        await this.createServiceReportPageWithTemplate(metrics, tickets, chartData)
      }
      
      if (pageSelection?.slaComplianceAnalysis !== false) {
        await this.createSLADetailPageWithTemplate(metrics, tickets)
      }
      
      // Add escalated tickets page only if selected and escalations exist
      if (pageSelection?.escalatedTicketsAnalysis !== false) {
        const escalatedTickets = tickets.filter(t => t.sdmEscalation === 'true')
        if (escalatedTickets.length > 0) {
          await this.createEscalatedTicketsPageWithTemplate(escalatedTickets)
        }
      }
      
      if (pageSelection?.monthlyCreatedVsResolved !== false) {
        await this.createMonthlyChartsPageWithTemplate(chartData, allTickets || tickets, selectedCompany, selectedSDM)
      }
      
      if (pageSelection?.openTicketsByType !== false) {
        await this.createTicketTypesPieChartPageWithTemplate(chartData)
      }
      
      if (pageSelection?.breakdownByAgeOfTicket !== false) {
        await this.createTicketAgeBreakdownPageWithTemplate(chartData, selectedCompany)
      }
      
      if (pageSelection?.openIncidentsAndServiceRequests !== false) {
        await this.createOpenTicketsPageWithTemplate(allTickets || tickets, selectedCompany)
      }
      
      if (pageSelection?.openProblemRecords !== false) {
        await this.createProblemTicketsPageWithTemplate(allTickets || tickets, selectedCompany)
      }
      
      if (pageSelection?.questionsAndDiscussion !== false) {
        await this.createQuestionsPageWithTemplate()
      }
      
      if (pageSelection?.escalationProcess !== false) {
        await this.createEscalationProcessPageWithTemplate()
      }
      
      await this.createFinalPageWithTemplate()
      
      // Generate and download
      const pdfBytes = await this.newDoc.save()
      const timestamp = new Date().toISOString().split('T')[0]
      const companyName = selectedCompany && selectedCompany !== 'all' ? selectedCompany.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Companies'
      const filename = `Service_Review_${companyName}_${timestamp}.pdf`
      
      // Download the PDF
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error generating PDF with templates:', error)
      // Fallback to basic PDF without templates
      await this.generateBasicReport(data)
    }
  }

  private async loadTemplatePDF(): Promise<void> {
    try {
      const response = await fetch('/Template.pdf')
      if (!response.ok) {
        throw new Error('Template PDF not found')
      }
      const templateBytes = await response.arrayBuffer()
      this.templateDoc = await PDFDocument.load(templateBytes)
    } catch (error) {
      console.error('Error loading template PDF:', error)
      throw error
    }
  }

  private async copyTemplatePageWithOverlay(templatePageIndex: number): Promise<any> {
    if (!this.templateDoc || !this.newDoc) {
      throw new Error('Template or new document not initialized')
    }

    // Copy the specific page from template
    const [templatePage] = await this.newDoc.copyPages(this.templateDoc, [templatePageIndex])
    const page = this.newDoc.addPage(templatePage)
    
    return page
  }

  private async createTitlePageWithTemplate(company?: string, dateFilter?: string, sdm?: string): Promise<void> {
    // Use Page 1 (index 0) of template
    const page = await this.copyTemplatePageWithOverlay(0)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    
    // Adjust positioning: move right and down, make white and 20% bigger than 50% smaller (so 40% smaller overall)
    // Move 2cm (57 points) to the left from the original position
    const rightOffset = width * 0.65 - 57 // Move to right side, then 2cm left
    const downOffset = height * 0.48 // Move down 20% more (was 0.6, now 0.48 = 60% - 20% of 60%)
    
    // Client name (positioned to the right and down, white, 20% bigger than previous)
    if (company && company !== 'all') {
      page.drawText(`Client: ${company}`, {
        x: rightOffset,
        y: downOffset,
        size: 14.4, // 20% bigger than 12 (12 * 1.2 = 14.4)
        font: boldFont,
        color: rgb(1, 1, 1), // White text
      })
    }
    
    // Report period
    const periodLabel = this.getDateFilterLabel(dateFilter)
    page.drawText(`Report Period: ${periodLabel}`, {
      x: rightOffset,
      y: downOffset - 30,
      size: 10.8, // 20% bigger than 9 (9 * 1.2 = 10.8)
      font: font,
      color: rgb(1, 1, 1), // White text
    })
    
    // SDM
    if (sdm && sdm !== 'all') {
      const sdmText = `Service Delivery Manager: ${sdm}`
      page.drawText(sdmText, {
        x: rightOffset,
        y: downOffset - 60,
        size: 9.6, // 20% bigger than 8 (8 * 1.2 = 9.6)
        font: font,
        color: rgb(1, 1, 1), // White text
      })
    }
    
    // Generated date
    const dateText = `Generated: ${new Date().toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    })}`
    page.drawText(dateText, {
      x: rightOffset,
      y: downOffset - 90,
      size: 7.2, // 20% bigger than 6 (6 * 1.2 = 7.2)
      font: font,
      color: rgb(1, 1, 1), // White text
    })
  }

  private async createAgendaPageWithTemplate(executiveSummary?: string, pageSelection?: PageSelectionOptions): Promise<void> {
    // Use Page 2 (index 1) of template
    const page = await this.copyTemplatePageWithOverlay(1)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { height } = page.getSize()
    
    // Add agenda title in white text, moved down 1cm from previous position
    page.drawText('Agenda', {
      x: 80,
      y: height - 77,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1), // White text
    })
    
    // Add agenda items (reflect actual page headings)
    const agendaItems = []
    
    // Add Executive Summary if provided
    if (executiveSummary && executiveSummary.trim()) {
      agendaItems.push('Executive Summary')
    }
    
    // Add remaining agenda items based on selection
    if (pageSelection?.keyPerformanceMetrics !== false) {
      agendaItems.push('Key Performance Metrics')
    }
    if (pageSelection?.slaComplianceAnalysis !== false) {
      agendaItems.push('SLA Compliance Analysis')
    }
    if (pageSelection?.escalatedTicketsAnalysis !== false) {
      agendaItems.push('Escalated Tickets Analysis')
    }
    if (pageSelection?.monthlyCreatedVsResolved !== false) {
      agendaItems.push('Monthly Created vs Resolved Tickets')
    }
    if (pageSelection?.openTicketsByType !== false) {
      agendaItems.push('Open Tickets by Type')
    }
    if (pageSelection?.breakdownByAgeOfTicket !== false) {
      agendaItems.push('Breakdown by Age of Ticket')
    }
    if (pageSelection?.openIncidentsAndServiceRequests !== false) {
      agendaItems.push('Open Incidents and Service Requests')
    }
    if (pageSelection?.openProblemRecords !== false) {
      agendaItems.push('Open Problem Records')
    }
    if (pageSelection?.questionsAndDiscussion !== false) {
      agendaItems.push('Questions & Discussion')
    }
    if (pageSelection?.escalationProcess !== false) {
      agendaItems.push('Escalation Process')
    }
    
    const startY = height - 206 // Move down 2cm more (was 150, now 206 = 150 + 56 points)
    const itemHeight = 25
    
    agendaItems.forEach((item, index) => {
      const y = startY - (index * itemHeight)
      page.drawText(`${index + 1}. ${item}`, {
        x: 80, // Adjust X position based on template
        y: y,
        size: 16,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      })
    })
  }

  private async createExecutiveSummaryPageWithTemplate(executiveSummary: string): Promise<void> {
    // Use Page 3 (index 2) of template - the blank canvas
    const page = await this.copyTemplatePageWithOverlay(2)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const tealColor = rgb(0.06, 0.46, 0.43)
    const textColor = rgb(0.2, 0.2, 0.2)
    
    // Page title
    page.drawText('Executive Summary', {
      x: 50,
      y: height - 60,
      size: 22,
      font: boldFont,
      color: tealColor,
    })
    
    // Better page layout parameters
    const leftMargin = 50
    const rightMargin = width - 50
    const maxLineWidth = rightMargin - leftMargin
    const normalLineHeight = 16 // Increased to match working text spacing
    const headerLineHeight = 20
    const paragraphSpacing = 10
    const sectionSpacing = 15
    const bottomMargin = 60
    
    let currentY = height - 95
    
    // Split the summary into paragraphs and further split bullet points
    let paragraphs = executiveSummary.split('\n\n').filter(p => p.trim().length > 0)
    
    // Further split paragraphs that contain bullet points into individual lines
    const expandedParagraphs: string[] = []
    for (const paragraph of paragraphs) {
      if (paragraph.includes('•')) {
        // Split on bullet points and process each separately
        const lines = paragraph.split('\n').filter(line => line.trim().length > 0)
        for (const line of lines) {
          expandedParagraphs.push(line.trim())
        }
      } else {
        expandedParagraphs.push(paragraph.trim())
      }
    }
    paragraphs = expandedParagraphs
    
    console.log(`Processing ${paragraphs.length} paragraphs for executive summary`)
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim()
      
      if (currentY < bottomMargin + 20) {
        console.log(`Stopping at paragraph ${i} due to space constraints`)
        break
      }
      
      // Skip the main title since we already drew it
      if (paragraph.includes('Executive Summary - Service Analytics Review')) {
        console.log(`Skipping main title paragraph`)
        continue
      }
      
      // Check if this is a standalone section header
      const headerPatterns = ['Key Performance Highlights:', 'Operational Excellence:', 'Focus Areas:', 'Looking Forward:']
      const isStandaloneHeader = headerPatterns.some(pattern => paragraph.trim() === pattern)
      
      if (isStandaloneHeader) {
        // Ensure we have space for header and at least one line of content
        if (currentY < bottomMargin + 40) break
        
        // Draw the header
        const headerText = paragraph.replace(':', '')
        console.log(`Drawing standalone header: "${headerText}"`)
        page.drawText(headerText, {
          x: leftMargin,
          y: currentY,
          size: 13,
          font: boldFont,
          color: tealColor,
        })
        currentY -= headerLineHeight + sectionSpacing
        continue
      }
      
      // Process all paragraphs as regular text (no special bullet point handling)
      console.log(`Processing paragraph ${i}: "${paragraph.substring(0, 50)}..."`);
      const lines = this.wrapTextToLines(paragraph, maxLineWidth, 11)
      console.log(`Paragraph wrapped into ${lines.length} lines`)
      
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j]
        if (currentY < bottomMargin) {
          console.log(`Stopping at line ${j} due to bottom margin`)
          break
        }
        
        console.log(`Drawing line ${j}: "${line}" (${line.length} chars)`)
        page.drawText(line, {
          x: leftMargin,
          y: currentY,
          size: 11,
          font: font,
          color: textColor,
        })
        currentY -= normalLineHeight
      }
      
      currentY -= paragraphSpacing // Extra space between paragraphs
    }
    
    // Add a note if content was truncated
    if (currentY < bottomMargin + 20) {
      page.drawText('...continued in discussion', {
        x: rightMargin - 120,
        y: bottomMargin,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
  }

  private wrapTextToLines(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    // Expanded character limit - doubling from 85 to 170 characters per line
    // Based on testing, 85 chars worked well, so 170 should still fit comfortably
    // with 50pt margins on standard PDF page width
    const maxCharsPerLine = 170 // Doubled from 85 to make better use of page width
    
    console.log(`Wrapping text with max ${maxCharsPerLine} chars per line. Text: "${text.substring(0, 100)}..."`)
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const testLine = currentLine ? `${currentLine} ${word}` : word
      
      // If adding this word would exceed our limit, start a new line
      if (testLine.length > maxCharsPerLine && currentLine.length > 0) {
        console.log(`Line break at word ${i}: "${currentLine}" (${currentLine.length} chars)`)
        lines.push(currentLine.trim())
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    
    // Add the last line if there's content
    if (currentLine.trim().length > 0) {
      console.log(`Final line: "${currentLine}" (${currentLine.length} chars)`)
      lines.push(currentLine.trim())
    }
    
    console.log(`Total lines created: ${lines.length}`)
    return lines
  }

  private async createServiceReportPageWithTemplate(metrics: DashboardMetrics, tickets: TicketData[], chartData: ChartData): Promise<void> {
    // Use Page 3 (index 2) of template - the blank canvas
    const page = await this.copyTemplatePageWithOverlay(2)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    
    // Layout service data in 6 sections on the blank canvas
    await this.addServiceDataSections(page, font, boldFont, metrics, tickets, chartData, width, height)
  }

  private async createSLADetailPageWithTemplate(metrics: DashboardMetrics, tickets: TicketData[]): Promise<void> {
    // Use Page 3 (blank canvas) again for SLA details
    const page = await this.copyTemplatePageWithOverlay(2)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const tealColor = rgb(0.06, 0.46, 0.43)
    const textColor = rgb(0.2, 0.2, 0.2)
    const redColor = rgb(0.8, 0.2, 0.2)
    
    // Page title
    page.drawText('SLA Compliance Analysis', {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: tealColor,
    })
    
    // Get breached tickets
    const breachedTickets = tickets.filter(t => 
      t.resolutionStatus === 'SLA Violated' || 
      ((!t.resolutionStatus || t.resolutionStatus.trim() === '') && 
       t.status !== 'Pending' && t.status !== 'Pending - Close' &&
       new Date(t.dueByTime) < new Date())
    )
    
    // SLA Summary
    const compliantTickets = tickets.length - breachedTickets.length
    page.drawText(`Total Tickets: ${tickets.length}`, {
      x: 50, y: height - 100, size: 12, font: font, color: textColor,
    })
    page.drawText(`SLA Compliant: ${compliantTickets} (${metrics.slaCompliance}%)`, {
      x: 50, y: height - 120, size: 12, font: font, color: textColor,
    })
    page.drawText(`SLA Breached: ${breachedTickets.length}`, {
      x: 50, y: height - 140, size: 12, font: font, color: redColor,
    })
    
    // Table headers
    const tableY = height - 180
    const headerHeight = 20
    const rowHeight = 18
    const columnWidths = [80, 200, 90, 90, 90, 80]
    const columnX = [50, 130, 330, 420, 510, 600]
    const headers = ['Ticket ID', 'Summary', 'Created', 'Due Date', 'Resolved', 'Status']
    
    // Draw header background
    page.drawRectangle({
      x: 50, y: tableY - 5, width: width - 100, height: headerHeight,
      color: rgb(0.9, 0.9, 0.9),
    })
    
    // Draw headers
    headers.forEach((header, index) => {
      page.drawText(header, {
        x: columnX[index], y: tableY + 5, size: 10, font: boldFont, color: textColor,
      })
    })
    
    // Draw breached tickets (limit to fit on page)
    const maxRows = Math.min(breachedTickets.length, 20)
    breachedTickets.slice(0, maxRows).forEach((ticket, index) => {
      const y = tableY - headerHeight - (index * rowHeight)
      const rowColor = index % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1)
      
      // Draw row background
      page.drawRectangle({
        x: 50, y: y - 5, width: width - 100, height: rowHeight,
        color: rowColor,
      })
      
      // Ticket data
      const ticketData = [
        ticket.ticketId || 'N/A',
        (ticket.subject || 'No Subject').length > 25 ? 
          (ticket.subject || 'No Subject').substring(0, 25) + '...' : 
          (ticket.subject || 'No Subject'),
        new Date(ticket.createdTime).toLocaleDateString('en-GB') || 'N/A',
        new Date(ticket.dueByTime).toLocaleDateString('en-GB') || 'N/A',
        ticket.resolvedTime ? new Date(ticket.resolvedTime).toLocaleDateString('en-GB') : 'Open',
        ticket.status || 'Unknown'
      ]
      
      ticketData.forEach((data, colIndex) => {
        page.drawText(data, {
          x: columnX[colIndex], y: y, size: 8, font: font, color: textColor,
        })
      })
    })
    
    // Footer note if more tickets exist
    if (breachedTickets.length > maxRows) {
      page.drawText(`Showing ${maxRows} of ${breachedTickets.length} breached tickets`, {
        x: 50, y: 80, size: 10, font: font, color: rgb(0.5, 0.5, 0.5),
      })
    }
  }

  private async createEscalatedTicketsPageWithTemplate(escalatedTickets: TicketData[]): Promise<void> {
    // Use Page 3 (blank canvas) for escalated tickets details
    const page = await this.copyTemplatePageWithOverlay(2)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const tealColor = rgb(0.06, 0.46, 0.43)
    const textColor = rgb(0.2, 0.2, 0.2)
    const redColor = rgb(0.8, 0.2, 0.2)
    
    // Page title
    page.drawText('Escalated Tickets Analysis', {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: tealColor,
    })
    
    // Escalation summary
    const escalationRate = ((escalatedTickets.length / (escalatedTickets.length + 100)) * 100).toFixed(1) // Approximate
    page.drawText(`Total Escalations: ${escalatedTickets.length}`, {
      x: 50, y: height - 100, size: 12, font: font, color: textColor,
    })
    page.drawText(`Escalation Rate: ${escalationRate}%`, {
      x: 50, y: height - 120, size: 12, font: font, color: redColor,
    })
    
    // Table headers
    const tableY = height - 160
    const headerHeight = 20
    const rowHeight = 18
    const columnX = [50, 130, 300, 420, 520, 620, 720]
    const headers = ['Ticket ID', 'Summary', 'Company', 'Priority', 'Agent', 'Created', 'Status']
    
    // Draw header background
    page.drawRectangle({
      x: 50, y: tableY - 5, width: width - 100, height: headerHeight,
      color: rgb(0.9, 0.9, 0.9),
    })
    
    // Draw headers
    headers.forEach((header, index) => {
      page.drawText(header, {
        x: columnX[index], y: tableY + 5, size: 10, font: boldFont, color: textColor,
      })
    })
    
    // Draw escalated tickets (limit to fit on page)
    const maxRows = Math.min(escalatedTickets.length, 18)
    escalatedTickets.slice(0, maxRows).forEach((ticket, index) => {
      const y = tableY - headerHeight - (index * rowHeight)
      const rowColor = index % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1)
      
      // Draw row background
      page.drawRectangle({
        x: 50, y: y - 5, width: width - 100, height: rowHeight,
        color: rowColor,
      })
      
      // Ticket data
      const ticketData = [
        ticket.ticketId || 'N/A',
        (ticket.subject || 'No Subject').length > 20 ? 
          (ticket.subject || 'No Subject').substring(0, 20) + '...' : 
          (ticket.subject || 'No Subject'),
        (ticket.companyName || 'Unknown').length > 15 ?
          (ticket.companyName || 'Unknown').substring(0, 15) + '...' :
          (ticket.companyName || 'Unknown'),
        ticket.priority || 'Normal',
        (ticket.agent || 'Unassigned').length > 12 ?
          (ticket.agent || 'Unassigned').substring(0, 12) + '...' :
          (ticket.agent || 'Unassigned'),
        new Date(ticket.createdTime).toLocaleDateString('en-GB') || 'N/A',
        ticket.status || 'Unknown'
      ]
      
      ticketData.forEach((data, colIndex) => {
        page.drawText(data, {
          x: columnX[colIndex], y: y, size: 8, font: font, color: textColor,
        })
      })
    })
    
    // Footer note if more tickets exist
    if (escalatedTickets.length > maxRows) {
      page.drawText(`Showing ${maxRows} of ${escalatedTickets.length} escalated tickets`, {
        x: 50, y: 80, size: 10, font: font, color: rgb(0.5, 0.5, 0.5),
      })
    }
    
    // Escalation insights
    const priorityCounts: { [key: string]: number } = {}
    escalatedTickets.forEach(ticket => {
      const priority = ticket.priority || 'Normal'
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
    })
    
    let insightY = 120
    page.drawText('Escalation Breakdown by Priority:', {
      x: 450, y: insightY, size: 12, font: boldFont, color: tealColor,
    })
    
    Object.entries(priorityCounts).forEach(([priority, count], index) => {
      const percentage = ((count / escalatedTickets.length) * 100).toFixed(1)
      page.drawText(`${priority}: ${count} tickets (${percentage}%)`, {
        x: 450, y: insightY - 20 - (index * 16), size: 10, font: font, color: textColor,
      })
    })
  }

  private async createMonthlyChartsPageWithTemplate(chartData: ChartData, allTickets: TicketData[], selectedCompany?: string, selectedSDM?: string): Promise<void> {
    // Dedicated page for Monthly Created vs Resolved chart
    const page = await this.copyTemplatePageWithOverlay(2)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const tealColor = rgb(0.06, 0.46, 0.43)
    const textColor = rgb(0.2, 0.2, 0.2)
    
    // Page title with company context
    const titleSuffix = selectedCompany && selectedCompany !== 'all' ? ` - ${selectedCompany}` : ''
    page.drawText(`Monthly Created vs Resolved Tickets${titleSuffix}`, {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: tealColor,
    })
    
    // Chart subtitle
    page.drawText('Ticket Volume Trends Over Time', {
      x: 50, y: height - 90, size: 14, font: font, color: textColor,
    })
    
    // Generate company-specific monthly data
    const filteredTickets = allTickets.filter(ticket => {
      if (selectedCompany && selectedCompany !== 'all' && ticket.companyName !== selectedCompany) {
        return false
      }
      if (selectedSDM && selectedSDM !== 'all' && ticket.sdm !== selectedSDM) {
        return false
      }
      return true
    })
    
    const companyMonthlyData = this.generateMonthlyData(filteredTickets)
    
    // Draw chart with more space and better scaling
    const chartStartX = 80
    const chartStartY = height - 450
    const chartWidth = 600
    const chartHeight = 250
    
    // Y-axis
    page.drawLine({
      start: { x: chartStartX, y: chartStartY },
      end: { x: chartStartX, y: chartStartY + chartHeight },
      thickness: 2,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    // X-axis
    page.drawLine({
      start: { x: chartStartX, y: chartStartY },
      end: { x: chartStartX + chartWidth, y: chartStartY },
      thickness: 2,
      color: rgb(0.5, 0.5, 0.5),
    })
    
    const monthlyData = companyMonthlyData.slice(-8) // Last 8 months
    const maxTickets = Math.max(...monthlyData.map(d => Math.max(d.created, d.resolved)), 10)
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxTickets / 5) * i)
      const y = chartStartY + (chartHeight / 5) * i
      page.drawText(`${value}`, {
        x: chartStartX - 25, y: y - 3, size: 8, font: font, color: textColor,
      })
      
      // Grid lines
      page.drawLine({
        start: { x: chartStartX, y: y },
        end: { x: chartStartX + chartWidth, y: y },
        thickness: 0.5,
        color: rgb(0.9, 0.9, 0.9),
      })
    }
    
    monthlyData.forEach((data, index) => {
      const x = chartStartX + 40 + (index * (chartWidth - 80) / (monthlyData.length - 1))
      const createdHeight = (data.created / maxTickets) * chartHeight
      const resolvedHeight = (data.resolved / maxTickets) * chartHeight
      
      // Created tickets bar (blue)
      page.drawRectangle({
        x: x - 12, y: chartStartY, width: 18, height: createdHeight,
        color: rgb(0.2, 0.6, 1),
      })
      
      // Resolved tickets bar (green) 
      page.drawRectangle({
        x: x + 8, y: chartStartY, width: 18, height: resolvedHeight,
        color: rgb(0.2, 0.8, 0.4),
      })
      
      // Month label
      const monthLabel = data.month.length > 8 ? data.month.substring(0, 8) : data.month
      page.drawText(monthLabel, {
        x: x - 20, y: chartStartY - 20, size: 9, font: font, color: textColor,
      })
      
      // Values above bars (no decimals)
      page.drawText(`${Math.round(data.created)}`, {
        x: x - 12, y: chartStartY + createdHeight + 8, size: 8, font: font, color: rgb(0.2, 0.6, 1),
      })
      page.drawText(`${Math.round(data.resolved)}`, {
        x: x + 8, y: chartStartY + resolvedHeight + 8, size: 8, font: font, color: rgb(0.2, 0.8, 0.4),
      })
    })
    
    // Summary statistics without decimals - moved 1.5cm more to the right
    const summaryX = width - 258 // Move 1.5cm right from previous position (300 - 42 = 258)
    
    // Enhanced legend - aligned with Summary text
    const legendY = height - 120
    const legendX = summaryX // Align with Summary Statistics
    page.drawRectangle({ x: legendX, y: legendY, width: 20, height: 12, color: rgb(0.2, 0.6, 1) })
    page.drawText('Created Tickets', { x: legendX + 30, y: legendY + 6, size: 12, font: font, color: textColor })
    page.drawRectangle({ x: legendX, y: legendY - 25, width: 20, height: 12, color: rgb(0.2, 0.8, 0.4) })
    page.drawText('Resolved Tickets', { x: legendX + 30, y: legendY - 19, size: 12, font: font, color: textColor })
    page.drawText('Summary Statistics:', {
      x: summaryX, y: 200, size: 16, font: boldFont, color: tealColor,
    })
    
    const totalCreated = monthlyData.reduce((sum, d) => sum + d.created, 0)
    const totalResolved = monthlyData.reduce((sum, d) => sum + d.resolved, 0)
    const avgMonthlyCreated = Math.round(totalCreated / monthlyData.length)
    const avgMonthlyResolved = Math.round(totalResolved / monthlyData.length)
    
    page.drawText(`• Average monthly created: ${avgMonthlyCreated} tickets`, {
      x: summaryX, y: 175, size: 12, font: font, color: textColor,
    })
    page.drawText(`• Average monthly resolved: ${avgMonthlyResolved} tickets`, {
      x: summaryX, y: 155, size: 12, font: font, color: textColor,
    })
    page.drawText(`• Total tickets created: ${Math.round(totalCreated)}`, {
      x: summaryX, y: 135, size: 12, font: font, color: textColor,
    })
    page.drawText(`• Total tickets resolved: ${Math.round(totalResolved)}`, {
      x: summaryX, y: 115, size: 12, font: font, color: textColor,
    })
  }

  private generateMonthlyData(tickets: TicketData[]): Array<{ month: string; created: number; resolved: number }> {
    const createdByMonth = new Map<string, number>()
    const resolvedByMonth = new Map<string, number>()
    
    // Process tickets for monthly data
    tickets.forEach(ticket => {
      // Created tickets by month
      const createdDate = new Date(ticket.createdTime)
      if (!isNaN(createdDate.getTime())) {
        const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
        createdByMonth.set(monthKey, (createdByMonth.get(monthKey) || 0) + 1)
      }

      // Resolved tickets by month
      if (ticket.resolvedTime && ticket.resolvedTime.trim() !== '') {
        const resolvedDate = new Date(ticket.resolvedTime)
        if (!isNaN(resolvedDate.getTime())) {
          const monthKey = `${resolvedDate.getFullYear()}-${String(resolvedDate.getMonth() + 1).padStart(2, '0')}`
          resolvedByMonth.set(monthKey, (resolvedByMonth.get(monthKey) || 0) + 1)
        }
      }
    })

    // Generate monthly data - always show at least 7 months
    const allMonths = new Set([...createdByMonth.keys(), ...resolvedByMonth.keys()])
    
    // Ensure we have at least 7 months by filling backwards from current month
    const currentDate = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      allMonths.add(monthKey)
    }
    
    return Array.from(allMonths)
      .sort()
      .slice(-7) // Always show last 7 months maximum
      .map(month => ({
        month,
        created: createdByMonth.get(month) || 0,
        resolved: resolvedByMonth.get(month) || 0
      }))
  }

  private async createTicketTypesPieChartPageWithTemplate(chartData: ChartData): Promise<void> {
    // Dedicated page for Ticket Types pie chart
    const page = await this.copyTemplatePageWithOverlay(2)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const tealColor = rgb(0.06, 0.46, 0.43)
    const textColor = rgb(0.2, 0.2, 0.2)
    
    // Page title
    page.drawText('Open Tickets by Type', {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: tealColor,
    })
    
    page.drawText('Distribution of Open Ticket Categories', {
      x: 50, y: height - 90, size: 14, font: font, color: textColor,
    })
    
    const topTypes = chartData.openTicketTypeData.slice(0, 12)
    const totalOpenTickets = topTypes.reduce((sum, type) => sum + type.count, 0)
    
    // Draw actual pie chart
    const centerX = 300
    const centerY = height - 280
    const radius = 120
    
    const colors = [
      rgb(0.2, 0.6, 1), rgb(0.8, 0.4, 0.2), rgb(0.2, 0.8, 0.4), 
      rgb(0.8, 0.2, 0.8), rgb(1, 0.6, 0.2), rgb(0.4, 0.2, 0.8),
      rgb(0.6, 0.8, 0.2), rgb(0.8, 0.2, 0.4), rgb(0.5, 0.5, 0.5),
      rgb(0.9, 0.5, 0.7), rgb(0.3, 0.7, 0.8), rgb(0.7, 0.3, 0.5)
    ]
    
    let currentAngle = 0
    
    topTypes.forEach((type, index) => {
      const percentage = (type.count / totalOpenTickets) * 100
      const sliceAngle = (percentage / 100) * 2 * Math.PI
      
      // Draw pie slice (simplified as polygon)
      const points = []
      points.push({ x: centerX, y: centerY }) // Center point
      
      for (let a = currentAngle; a <= currentAngle + sliceAngle; a += 0.1) {
        points.push({
          x: centerX + radius * Math.cos(a),
          y: centerY + radius * Math.sin(a)
        })
      }
      
      // Draw slice as series of triangles from center
      for (let i = 1; i < points.length - 1; i++) {
        const triangle = [points[0], points[i], points[i + 1]]
        // Draw filled triangle (approximated with small rectangles)
        for (let step = 0; step <= 1; step += 0.1) {
          const x1 = triangle[0].x + step * (triangle[1].x - triangle[0].x)
          const y1 = triangle[0].y + step * (triangle[1].y - triangle[0].y)
          const x2 = triangle[0].x + step * (triangle[2].x - triangle[0].x)
          const y2 = triangle[0].y + step * (triangle[2].y - triangle[0].y)
          
          page.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            thickness: 2,
            color: colors[index % colors.length],
          })
        }
      }
      
      // Label outside the pie
      const labelAngle = currentAngle + sliceAngle / 2
      const labelX = centerX + (radius + 40) * Math.cos(labelAngle)
      const labelY = centerY + (radius + 40) * Math.sin(labelAngle)
      
      if (percentage > 3) { // Only show labels for significant slices
        page.drawText(`${Math.round(percentage)}%`, {
          x: labelX - 10, y: labelY, size: 8, font: font, color: textColor,
        })
      }
      
      currentAngle += sliceAngle
    })
    
    // Summary at bottom - moved to very right
    const chartSummaryX = width - 300 // Position at far right
    
    // Legend with ticket counts - aligned with Chart Summary
    let legendY = height - 130
    const legendX = chartSummaryX // Align with Chart Summary
    page.drawText('Legend:', {
      x: legendX, y: legendY + 20, size: 14, font: boldFont, color: tealColor,
    })
    
    topTypes.forEach((type, index) => {
      const percentage = Math.round((type.count / totalOpenTickets) * 100)
      const typeLabel = type.type.length > 25 ? type.type.substring(0, 25) + '...' : type.type
      
      page.drawRectangle({
        x: legendX, y: legendY - 5, width: 15, height: 10,
        color: colors[index % colors.length],
      })
      
      page.drawText(`${typeLabel}: ${type.count} (${percentage}%)`, {
        x: legendX + 20, y: legendY, size: 9, font: font, color: textColor,
      })
      
      legendY -= 20
    })
    page.drawText('Chart Summary:', {
      x: chartSummaryX, y: 180, size: 16, font: boldFont, color: tealColor,
    })
    
    page.drawText(`• Total open tickets: ${totalOpenTickets}`, {
      x: chartSummaryX, y: 155, size: 12, font: font, color: textColor,
    })
    page.drawText(`• Number of ticket types: ${chartData.openTicketTypeData.length}`, {
      x: chartSummaryX, y: 135, size: 12, font: font, color: textColor,
    })
    page.drawText(`• Most common type: ${topTypes[0]?.type} (${topTypes[0]?.count} tickets)`, {
      x: chartSummaryX, y: 115, size: 12, font: font, color: textColor,
    })
  }

  private async createQuestionsPageWithTemplate(): Promise<void> {
    // Use Page 7 (index 6) of template
    await this.copyTemplatePageWithOverlay(6)
    // No additional content needed - template handles this
  }

  private async createFinalPageWithTemplate(): Promise<void> {
    // Use Page 8 (index 7) of template  
    await this.copyTemplatePageWithOverlay(7)
    // No additional content needed - template handles this
  }

  private async addServiceDataSections(page: any, font: any, boldFont: any, metrics: DashboardMetrics, tickets: TicketData[], chartData: ChartData, width: number, height: number): Promise<void> {
    const sectionTitleSize = 14
    const textSize = 10
    const tealColor = rgb(0.06, 0.46, 0.43) // Teal color matching dashboard
    const textColor = rgb(0.2, 0.2, 0.2)
    
    // Section positions (moved up 1cm and improved alignment)
    const leftX = 60
    const rightX = width / 2 + 40
    const topY = height - 72  // Moved up 1cm (28 points)
    const middleY = height - 222  // Moved up 1cm
    const bottomY = height - 372  // Moved up 1cm
    
    // Top Left: Key Metrics
    page.drawText('Key Performance Metrics', {
      x: leftX,
      y: topY,
      size: sectionTitleSize,
      font: boldFont,
      color: tealColor,
    })
    
    const metricsData = [
      `Total Tickets: ${metrics.totalTickets}`,
      `Open Tickets: ${metrics.openTickets}`,
      `SLA Compliance: ${metrics.slaCompliance}%`,
      `Avg Resolution: ${metrics.avgResolution}h`
    ]
    
    metricsData.forEach((metric, index) => {
      page.drawText(metric, {
        x: leftX,
        y: topY - 30 - (index * 20),
        size: textSize,
        font: font,
        color: textColor,
      })
    })
    
    // Top Right: SLA Performance
    page.drawText('SLA Performance', {
      x: rightX,
      y: topY,
      size: sectionTitleSize,
      font: boldFont,
      color: tealColor,
    })
    
    const breachedTickets = tickets.filter(t => 
      t.resolutionStatus === 'SLA Violated' || 
      ((!t.resolutionStatus || t.resolutionStatus.trim() === '') && 
       t.status !== 'Pending' && t.status !== 'Pending - Close' &&
       new Date(t.dueByTime) < new Date())
    ).length
    
    const compliantTickets = tickets.length - breachedTickets
    
    const slaData = [
      `Compliance Rate: ${metrics.slaCompliance}%`,
      `Within SLA: ${compliantTickets}`,
      `Breached: ${breachedTickets}`,
    ]
    
    slaData.forEach((item, index) => {
      page.drawText(item, {
        x: rightX,
        y: topY - 30 - (index * 20),
        size: textSize,
        font: font,
        color: textColor,
      })
    })
    
    // Middle Left: Current Status
    page.drawText('Current Ticket Status', {
      x: leftX,
      y: middleY,
      size: sectionTitleSize,
      font: boldFont,
      color: tealColor,
    })
    
    const statusCounts: { [key: string]: number } = {}
    tickets.forEach(ticket => {
      const status = ticket.status || 'Unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    Object.entries(statusCounts).slice(0, 5).forEach(([status, count], index) => {
      page.drawText(`${status}: ${count}`, {
        x: leftX,
        y: middleY - 30 - (index * 16),
        size: textSize,
        font: font,
        color: textColor,
      })
    })
    
    // Middle Right: Escalated Tickets
    page.drawText('Escalated Tickets', {
      x: rightX,
      y: middleY,
      size: sectionTitleSize,
      font: boldFont,
      color: tealColor,
    })
    
    const escalatedTickets = tickets.filter(t => t.sdmEscalation === 'true')
    const escalationRate = ((escalatedTickets.length / tickets.length) * 100).toFixed(1)
    
    const escalationData = [
      `Total Escalations: ${escalatedTickets.length}`,
      `Escalation Rate: ${escalationRate}%`,
    ]
    
    escalationData.forEach((item, index) => {
      page.drawText(item, {
        x: rightX,
        y: middleY - 30 - (index * 20),
        size: textSize,
        font: font,
        color: textColor,
      })
    })
    
    // Bottom Left: Top Ticket Types
    page.drawText('Top Ticket Types', {
      x: leftX,
      y: bottomY,
      size: sectionTitleSize,
      font: boldFont,
      color: tealColor,
    })
    
    const topTypes = chartData.openTicketTypeData.slice(0, 5)
    topTypes.forEach((type, index) => {
      page.drawText(`${type.type}: ${type.count}`, {
        x: leftX,
        y: bottomY - 30 - (index * 16),
        size: textSize,
        font: font,
        color: textColor,
      })
    })
    
    // Bottom Right: Summary of tickets by Priority
    page.drawText('Summary of tickets by Priority', {
      x: rightX,
      y: bottomY,
      size: sectionTitleSize,
      font: boldFont,
      color: tealColor,
    })
    
    // Count tickets by priority level
    const priorityCounts = {
      'Priority 1': tickets.filter(t => t.priority === 'Urgent').length,
      'Priority 2': tickets.filter(t => t.priority === 'High').length,
      'Priority 3': tickets.filter(t => t.priority === 'Medium').length,
      'Priority 4': tickets.filter(t => t.priority === 'Low').length,
    }
    
    const priorityData = [
      `Priority 1: ${priorityCounts['Priority 1']}`,
      `Priority 2: ${priorityCounts['Priority 2']}`,
      `Priority 3: ${priorityCounts['Priority 3']}`,
      `Priority 4: ${priorityCounts['Priority 4']}`,
    ]
    
    priorityData.forEach((item, index) => {
      page.drawText(item, {
        x: rightX,
        y: bottomY - 30 - (index * 20),
        size: textSize,
        font: font,
        color: textColor,
      })
    })
  }

  private async generateBasicReport(data: PDFExportProps): Promise<void> {
    // Fallback basic report without templates
    const { selectedCompany, selectedDateFilter } = data
    
    // Create a simple PDF using pdf-lib
    const doc = await PDFDocument.create()
    const page = doc.addPage([595.28, 841.89]) // A4 size
    const font = await doc.embedFont(StandardFonts.Helvetica)
    
    const { width, height } = page.getSize()
    
    page.drawText('Service Desk Report', {
      x: width / 2 - 100,
      y: height - 100,
      size: 20,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    })
    
    if (selectedCompany && selectedCompany !== 'all') {
      page.drawText(`Client: ${selectedCompany}`, {
        x: width / 2 - 80,
        y: height - 140,
        size: 16,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      })
    }
    
    const pdfBytes = await doc.save()
    const timestamp = new Date().toISOString().split('T')[0]
    const companyName = selectedCompany && selectedCompany !== 'all' ? selectedCompany.replace(/[^a-zA-Z0-9]/g, '_') : 'All_Companies'
    const filename = `Service_Review_${companyName}_${timestamp}.pdf`
    
    // Download the PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  private getDateFilterLabel(dateFilter?: string): string {
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
        return 'All Time'
    }
  }

  private async createTicketAgeBreakdownPageWithTemplate(chartData: ChartData, selectedCompany?: string): Promise<void> {
    // Use Page 3 (blank canvas) for age breakdown chart
    const page = await this.copyTemplatePageWithOverlay(2)
    const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
    const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
    
    const { width, height } = page.getSize()
    const tealColor = rgb(0.06, 0.46, 0.43)
    const textColor = rgb(0.2, 0.2, 0.2)
    
    // Page title
    page.drawText('Breakdown by Age of Ticket (All Time)', {
      x: 50,
      y: height - 60,
      size: 20,
      font: boldFont,
      color: tealColor,
    })
    
    const companyText = selectedCompany && selectedCompany !== 'all' ? ` - ${selectedCompany}` : ' - All Companies'
    page.drawText(`Open Tickets by Creation Month and Type${companyText}`, {
      x: 50, y: height - 90, size: 14, font: font, color: textColor,
    })
    
    const ageData = chartData.ageBreakdownData
    if (ageData.length === 0) {
      page.drawText('No age breakdown data available', {
        x: 50, y: height - 150, size: 12, font: font, color: textColor,
      })
      return
    }
    
    // Chart dimensions - match pie chart positioning, moved 3cm up (85 points)
    const chartX = 50
    const chartY = height - 365
    const chartWidth = 400
    const chartHeight = 200
    
    // Colors for different ticket types
    const typeColors = {
      incidents: rgb(0.2, 0.6, 1),
      serviceRequests: rgb(0.8, 0.4, 0.2),
      problems: rgb(0.8, 0.2, 0.2),
      other: rgb(0.6, 0.6, 0.6)
    }
    
    // Find max value for scaling
    const maxValue = Math.max(...ageData.map(d => d.incidents + d.serviceRequests + d.problems + d.other))
    const scale = maxValue > 0 ? chartHeight / maxValue : 1
    
    // Draw axes
    page.drawLine({
      start: { x: chartX, y: chartY },
      end: { x: chartX + chartWidth, y: chartY },
      thickness: 1,
      color: textColor,
    })
    page.drawLine({
      start: { x: chartX, y: chartY },
      end: { x: chartX, y: chartY + chartHeight },
      thickness: 1,
      color: textColor,
    })
    
    // Draw bars
    const barWidth = Math.min(chartWidth / (ageData.length * 1.2), 35)
    const barSpacing = chartWidth / ageData.length
    
    ageData.forEach((data, index) => {
      const barX = chartX + (index * barSpacing) + (barSpacing - barWidth) / 2
      let currentY = chartY
      
      // Stack bars for each type
      const types = [
        { key: 'incidents', value: data.incidents, color: typeColors.incidents },
        { key: 'serviceRequests', value: data.serviceRequests, color: typeColors.serviceRequests },
        { key: 'problems', value: data.problems, color: typeColors.problems },
        { key: 'other', value: data.other, color: typeColors.other }
      ]
      
      types.forEach(type => {
        if (type.value > 0) {
          const barHeight = type.value * scale
          page.drawRectangle({
            x: barX,
            y: currentY,
            width: barWidth,
            height: barHeight,
            color: type.color,
          })
          currentY += barHeight
        }
      })
      
      // Format month label as MMM/YY format from YYYY-MM format
      const formatMonthLabel = (monthString: string) => {
        if (monthString.includes('-')) {
          const [year, month] = monthString.split('-')
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          const monthIndex = parseInt(month) - 1
          const shortMonth = monthNames[monthIndex] || 'Unknown'
          const shortYear = year.substring(2)
          return `${shortMonth}/${shortYear}`
        }
        return monthString
      }
      
      const monthLabel = formatMonthLabel(data.month)
      
      // Draw month label vertically
      const labelChars = monthLabel.split('')
      labelChars.forEach((char, charIndex) => {
        page.drawText(char, {
          x: barX + barWidth / 2 - 3,
          y: chartY - 30 - (charIndex * 12),
          size: 8,
          font: font,
          color: textColor,
        })
      })
      
      // Draw total count above bar
      const total = data.incidents + data.serviceRequests + data.problems + data.other
      if (total > 0) {
        page.drawText(total.toString(), {
          x: barX + barWidth / 2 - 5,
          y: currentY + 5,
          size: 8,
          font: font,
          color: textColor,
        })
      }
    })
    
    // Legend and summary positioning - match pie chart layout
    const chartSummaryX = width - 300 // Position at far right to match pie chart
    let legendY = height - 130 // Match pie chart legend position
    const legendX = chartSummaryX // Align with Chart Summary
    
    page.drawText('Legend:', {
      x: legendX, y: legendY + 20, size: 14, font: boldFont, color: tealColor,
    })
    
    const legendItems = [
      { label: 'Incidents', color: typeColors.incidents },
      { label: 'Service Requests', color: typeColors.serviceRequests },
      { label: 'Problems', color: typeColors.problems },
      { label: 'Other', color: typeColors.other }
    ]
    
    legendItems.forEach((item, index) => {
      const y = legendY - (index * 20)
      
      // Draw colored rectangle
      page.drawRectangle({
        x: legendX, y: y - 5, width: 15, height: 10,
        color: item.color,
      })
      
      // Draw label
      page.drawText(item.label, {
        x: legendX + 20, y: y - 2, size: 9, font: font, color: textColor,
      })
    })
    
    // Summary statistics - match pie chart summary positioning
    const totalByType = ageData.reduce((acc, data) => ({
      incidents: acc.incidents + data.incidents,
      serviceRequests: acc.serviceRequests + data.serviceRequests,
      problems: acc.problems + data.problems,
      other: acc.other + data.other
    }), { incidents: 0, serviceRequests: 0, problems: 0, other: 0 })
    
    const totalTickets = Object.values(totalByType).reduce((sum, count) => sum + count, 0)
    
    page.drawText('Chart Summary:', {
      x: chartSummaryX, y: 180, size: 16, font: boldFont, color: tealColor,
    })
    
    page.drawText(`• Total open tickets: ${totalTickets}`, {
      x: chartSummaryX, y: 155, size: 12, font: font, color: textColor,
    })
    
    page.drawText(`• Incidents: ${totalByType.incidents} tickets`, {
      x: chartSummaryX, y: 135, size: 12, font: font, color: textColor,
    })
    
    page.drawText(`• Service Requests: ${totalByType.serviceRequests} tickets`, {
      x: chartSummaryX, y: 115, size: 12, font: font, color: textColor,
    })
    
    page.drawText(`• Problems: ${totalByType.problems} tickets`, {
      x: chartSummaryX, y: 95, size: 12, font: font, color: textColor,
    })
  }

  private async createOpenTicketsPageWithTemplate(tickets: TicketData[], selectedCompany?: string): Promise<void> {
    // Filter for open Incidents and Service Requests by company
    const openTickets = tickets.filter(t => 
      t.status !== 'Resolved' && t.status !== 'Closed' && 
      (t.type === 'Incident' || t.type === 'Service Request') &&
      (selectedCompany === 'all' || !selectedCompany || t.companyName === selectedCompany)
    )
    
    if (openTickets.length === 0) {
      return // Don't create page if no open tickets
    }
    
    const ticketsPerPage = 15
    const totalPages = Math.ceil(openTickets.length / ticketsPerPage)
    
    // Create pages for all tickets
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIndex = pageNum * ticketsPerPage
      const endIndex = startIndex + ticketsPerPage
      const pageTickets = openTickets.slice(startIndex, endIndex)
      
      // Use Page 3 (blank canvas) for open tickets details
      const page = await this.copyTemplatePageWithOverlay(2)
      const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
      const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
      
      const { width, height } = page.getSize()
      const tealColor = rgb(0.06, 0.46, 0.43)
      const textColor = rgb(0.2, 0.2, 0.2)
      const redColor = rgb(0.8, 0.2, 0.2)
      
      // Page title with page number if multiple pages
      const pageTitle = totalPages > 1 ? 
        `Open Incidents and Service Requests (All Time) - Page ${pageNum + 1} of ${totalPages}` :
        'Open Incidents and Service Requests (All Time)'
      
      page.drawText(pageTitle, {
        x: 50,
        y: height - 60,
        size: 20,
        font: boldFont,
        color: tealColor,
      })
      
      // Summary (only on first page)
      if (pageNum === 0) {
        const incidentCount = openTickets.filter(t => t.type === 'Incident').length
        const serviceRequestCount = openTickets.filter(t => t.type === 'Service Request').length
        
        page.drawText(`Total Open Tickets: ${openTickets.length} (All Time)`, {
          x: 50, y: height - 100, size: 12, font: font, color: textColor,
        })
        page.drawText(`Incidents: ${incidentCount} | Service Requests: ${serviceRequestCount}`, {
          x: 50, y: height - 120, size: 12, font: font, color: textColor,
        })
      }
      
      // Table headers
      const tableY = height - 180
      const headerHeight = 20
      const rowHeight = 18
      const columnX = [50, 110, 250, 310, 370, 430, 490, 550]
      const headers = ['Ticket ID', 'Summary', 'Created', 'Priority', 'Type', 'Status', 'Agent', 'Client Ref']
      
      // Draw header background
      page.drawRectangle({
        x: 50, y: tableY - 5, width: width - 100, height: headerHeight,
        color: rgb(0.9, 0.9, 0.9),
      })
      
      // Draw headers
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: columnX[index], y: tableY + 5, size: 10, font: boldFont, color: textColor,
        })
      })
      
      // Draw ticket data rows for this page
      pageTickets.forEach((ticket, index) => {
        const y = tableY - headerHeight - (index * rowHeight)
        const rowColor = index % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1)
        
        // Draw row background
        page.drawRectangle({
          x: 50, y: y - 5, width: width - 100, height: rowHeight,
          color: rowColor,
        })
        
        // Draw row data - truncate summary to 25 characters like SLA compliance
        const truncatedSummary = (ticket.subject || 'No Subject').length > 25 ? 
          (ticket.subject || 'No Subject').substring(0, 25) + '...' : 
          (ticket.subject || 'No Subject')
        
        // Truncate client reference if too long
        const truncatedClientRef = (ticket.clientReference || 'N/A').length > 15 ? 
          (ticket.clientReference || 'N/A').substring(0, 15) + '...' : 
          (ticket.clientReference || 'N/A')
        
        const rowData = [
          ticket.ticketId || 'N/A',
          truncatedSummary,
          ticket.createdTime ? new Date(ticket.createdTime).toLocaleDateString('en-GB') : 'N/A',
          this.convertPriorityToNumber(ticket.priority, ticket.type),
          ticket.type || 'N/A',
          ticket.status || 'N/A',
          ticket.agent || 'N/A',
          truncatedClientRef,
        ]
        
        rowData.forEach((data, colIndex) => {
          const priorityColor = ticket.priority === 'Urgent' ? redColor : textColor
          page.drawText(data, {
            x: columnX[colIndex], y: y + 2, size: 8, font: font, 
            color: colIndex === 3 ? priorityColor : textColor,
          })
        })
      })
      
      // Show page info at bottom
      page.drawText(`Page ${pageNum + 1} of ${totalPages} | Showing ${startIndex + 1}-${Math.min(endIndex, openTickets.length)} of ${openTickets.length} tickets`, {
        x: 50, y: 50, size: 10, font: font, color: textColor,
      })
    }
  }

  private async createProblemTicketsPageWithTemplate(tickets: TicketData[], selectedCompany?: string): Promise<void> {
    // Filter for open Problem type records by company
    const problemTickets = tickets.filter(t => 
      t.type === 'Problem' &&
      t.status !== 'Resolved' && t.status !== 'Closed' &&
      (selectedCompany === 'all' || !selectedCompany || t.companyName === selectedCompany)
    )
    
    if (problemTickets.length === 0) {
      return // Don't create page if no open problem tickets
    }
    
    const ticketsPerPage = 15
    const totalPages = Math.ceil(problemTickets.length / ticketsPerPage)
    
    // Create pages for all tickets
    for (let pageNum = 0; pageNum < totalPages; pageNum++) {
      const startIndex = pageNum * ticketsPerPage
      const endIndex = startIndex + ticketsPerPage
      const pageTickets = problemTickets.slice(startIndex, endIndex)
      
      // Use Page 3 (blank canvas) for problem tickets details
      const page = await this.copyTemplatePageWithOverlay(2)
      const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
      const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
      
      const { width, height } = page.getSize()
      const tealColor = rgb(0.06, 0.46, 0.43)
      const textColor = rgb(0.2, 0.2, 0.2)
      const redColor = rgb(0.8, 0.2, 0.2)
      
      // Page title with page number if multiple pages
      const pageTitle = totalPages > 1 ? 
        `Open Problem Records (All Time) - Page ${pageNum + 1} of ${totalPages}` :
        'Open Problem Records (All Time)'
      
      page.drawText(pageTitle, {
        x: 50,
        y: height - 60,
        size: 20,
        font: boldFont,
        color: tealColor,
      })
      
      // Summary - all tickets are open since we filtered for open only (only on first page)
      if (pageNum === 0) {
        const urgentProblems = problemTickets.filter(t => t.priority === 'Urgent').length
        const highProblems = problemTickets.filter(t => t.priority === 'High').length
        
        page.drawText(`Total Open Problem Records: ${problemTickets.length} (All Time)`, {
          x: 50, y: height - 100, size: 12, font: font, color: textColor,
        })
        page.drawText(`Urgent: ${urgentProblems} | High: ${highProblems} | Others: ${problemTickets.length - urgentProblems - highProblems}`, {
          x: 50, y: height - 120, size: 12, font: font, color: textColor,
        })
      }
      
      // Table headers - including JIRA ref and Release version as requested
      const tableY = height - 180
      const headerHeight = 20
      const rowHeight = 18
      const columnX = [50, 120, 170, 240, 408, 476, 561, 631]
      const headers = ['Ticket ID', 'Created', 'JIRA Ref', 'Summary', 'Priority', 'Status', 'Release Ver', 'Client Ref']
      
      // Draw header background
      page.drawRectangle({
        x: 50, y: tableY - 5, width: width - 100, height: headerHeight,
        color: rgb(0.9, 0.9, 0.9),
      })
      
      // Draw headers
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: columnX[index], y: tableY + 5, size: 10, font: boldFont, color: textColor,
        })
      })
      
      // Draw ticket data rows for this page
      pageTickets.forEach((ticket, index) => {
        const y = tableY - headerHeight - (index * rowHeight)
        const rowColor = index % 2 === 0 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1)
        
        // Draw row background
        page.drawRectangle({
          x: 50, y: y - 5, width: width - 100, height: rowHeight,
          color: rowColor,
        })
        
        // Draw row data - truncate summary to 35 characters for more room
        const truncatedSummary = (ticket.subject || 'No Subject').length > 35 ? 
          (ticket.subject || 'No Subject').substring(0, 35) + '...' : 
          (ticket.subject || 'No Subject')
        
        // Truncate client reference if too long
        const truncatedClientRef = (ticket.clientReference || 'N/A').length > 60 ? 
          (ticket.clientReference || 'N/A').substring(0, 60) + '...' : 
          (ticket.clientReference || 'N/A')
        
        const rowData = [
          ticket.ticketId || 'N/A',
          ticket.createdTime ? new Date(ticket.createdTime).toLocaleDateString('en-GB') : 'N/A',
          ticket.jiraRef || 'N/A',
          truncatedSummary,
          this.convertPriorityToNumber(ticket.priority, ticket.type),
          ticket.status || 'N/A',
          ticket.releaseVersion || 'N/A',
          truncatedClientRef,
        ]
        
        rowData.forEach((data, colIndex) => {
          const priorityColor = ticket.priority === 'Urgent' ? redColor : textColor
          let cellColor = textColor
          
          if (colIndex === 3) cellColor = priorityColor // Priority column
          // Status column - all are open so no special color needed
          
          page.drawText(data, {
            x: columnX[colIndex], y: y + 2, size: 8, font: font, 
            color: cellColor,
          })
        })
      })
      
      // Show page info at bottom
      page.drawText(`Page ${pageNum + 1} of ${totalPages} | Showing ${startIndex + 1}-${Math.min(endIndex, problemTickets.length)} of ${problemTickets.length} tickets`, {
        x: 50, y: 50, size: 10, font: font, color: textColor,
      })
    }
  }

  private async createEscalationProcessPageWithTemplate(): Promise<void> {
    try {
      // Load the EscalationProcess.pdf from public folder
      const escalationPdfBytes = await fetch('/EscalationProcess.pdf').then(res => res.arrayBuffer())
      const escalationDoc = await PDFDocument.load(escalationPdfBytes)
      
      // Copy all pages from the escalation process document
      const escalationPages = await this.newDoc!.copyPages(escalationDoc, escalationDoc.getPageIndices())
      
      // Add each page to the main document
      escalationPages.forEach(page => {
        this.newDoc!.addPage(page)
      })
      
    } catch (error) {
      console.error('Error loading EscalationProcess.pdf:', error)
      
      // Create a fallback page if the PDF can't be loaded
      const page = await this.copyTemplatePageWithOverlay(2)
      const font = await this.newDoc!.embedFont(StandardFonts.Helvetica)
      const boldFont = await this.newDoc!.embedFont(StandardFonts.HelveticaBold)
      
      const { height } = page.getSize()
      const tealColor = rgb(0.06, 0.46, 0.43)
      const textColor = rgb(0.2, 0.2, 0.2)
      
      // Page title
      page.drawText('Escalation Process', {
        x: 50,
        y: height - 60,
        size: 20,
        font: boldFont,
        color: tealColor,
      })
      
      page.drawText('Escalation process document could not be loaded.', {
        x: 50, y: height - 120, size: 14, font: font, color: textColor,
      })
      
      page.drawText('Please contact your system administrator for the escalation process details.', {
        x: 50, y: height - 150, size: 12, font: font, color: textColor,
      })
    }
  }
}

// Hook for easy usage in components
export function usePDFExport() {
  const exportToPDF = async (data: PDFExportProps) => {
    const generator = new ClientServiceReportGenerator()
    await generator.generateReport(data)
  }
  
  return { exportToPDF }
}