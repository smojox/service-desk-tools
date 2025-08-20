# Service Desk Analytics - Taranto

A comprehensive service desk analytics dashboard for tracking ticket performance, SLA compliance, and generating professional client reports.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [User Guide](#user-guide)
- [PDF Reports](#pdf-reports)
- [Technical Documentation](#technical-documentation)
- [Troubleshooting](#troubleshooting)

## Overview

The Service Desk Analytics application is designed to help Service Delivery Managers (SDMs) and IT teams analyze ticket performance, track SLA compliance, and generate professional reports for clients. The application processes CSV ticket data and provides comprehensive insights through interactive dashboards and automated report generation.

### Key Benefits

- **Real-time Analytics**: Interactive dashboard with live data visualization
- **SLA Management**: Track and manage SLA compliance with override capabilities
- **Professional Reporting**: Generate branded PDF reports for client presentations
- **Flexible Filtering**: Filter data by company, SDM, date range, and more
- **AI-Powered Insights**: Get intelligent analysis of ticket patterns and trends

## Features

### Dashboard Analytics
- **Key Performance Metrics**: Total tickets, open/closed counts, average resolution time, SLA compliance
- **Interactive Charts**: Monthly ticket trends and ticket type distributions
- **Escalated Tickets**: Track and analyze escalated tickets with priority breakdowns
- **Recent Priority Tickets**: Monitor high-priority and urgent tickets

### Data Management
- **CSV Import**: Upload ticket data via CSV files
- **Data Filtering**: Filter by SDM, company, date ranges, and custom time periods
- **Session Persistence**: SLA overrides and filters persist across sessions
- **Data Validation**: Automatic validation and error handling for uploaded data

### Professional Reporting
- **Template-Based PDFs**: Generate reports using custom branded templates
- **Multi-Page Reports**: Comprehensive reports spanning 7-9 pages
- **Dynamic Content**: Company-specific data and filtering
- **Professional Layout**: Branded headers, charts, and professional formatting

### Advanced Features
- **SLA Override System**: Toggle SLA compliance status for individual tickets
- **AI Insights**: Intelligent analysis of ticket patterns and recommendations
- **Export Capabilities**: PDF reports and Excel exports
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ 
- Modern web browser (Chrome, Firefox, Safari, Edge)
- CSV ticket data file

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open http://localhost:3000 in your browser

### Initial Setup

1. **Upload Data**: Click the upload area and select your CSV ticket file
2. **Configure Filters**: Set your preferred SDM, company, and date filters
3. **Explore Dashboard**: Review the analytics and metrics
4. **Generate Reports**: Create PDF reports for client presentations

## User Guide

### Uploading Ticket Data

1. **Prepare CSV File**: Ensure your CSV contains the required columns (see Data Format section)
2. **Upload Process**: 
   - Click the upload area on the main screen
   - Select your CSV file
   - Wait for processing confirmation
3. **Data Validation**: The system will validate and process your data automatically

### Using Filters

#### SDM Filter
- Select specific Service Delivery Manager
- Choose "All SDMs" to view all data
- Affects all dashboard metrics and reports

#### Company Filter
- Filter data by specific client company
- Dynamic list based on available data
- Updates other filters automatically

#### Date Filters
- **Predefined Ranges**: Last 3 months, 6 months, year
- **Specific Months**: Select individual months
- **All Time**: View complete dataset

### Dashboard Navigation

#### Key Metrics Cards
- **Total Tickets**: Overall ticket count
- **Open Tickets**: Currently unresolved tickets
- **Closed Tickets**: Resolved/closed tickets
- **Average Resolution**: Mean resolution time in hours
- **SLA Compliance**: Click to open detailed SLA analysis

#### Charts Section
- **Monthly Trends**: Created vs resolved tickets over time
- **Ticket Types**: Distribution of open tickets by category

#### Escalated Tickets
- View tickets escalated to management
- Priority-based color coding
- Detailed ticket information

### SLA Management

#### SLA Compliance Modal
1. Click the SLA Compliance metric card
2. View detailed breakdown of compliant/breached tickets
3. **Toggle Overrides**: Click toggles to override SLA status
4. **Search/Filter**: Find specific tickets quickly
5. **Export**: Download SLA breach data to Excel

#### SLA Override System
- **Purpose**: Override system-calculated SLA status
- **Persistence**: Changes are saved and persist across sessions
- **Visual Indicators**: Clear toggle states and status indicators

### AI Insights

#### Accessing AI Analysis
1. Click the "AI" button in the top toolbar
2. Wait for analysis to complete
3. Review insights and recommendations

#### Types of Insights
- **Trend Analysis**: Pattern identification in ticket data
- **Performance Recommendations**: Suggestions for improvement
- **Risk Assessment**: Identification of potential issues
- **Comparative Analysis**: Performance comparisons across periods

## PDF Reports

### Report Structure

The PDF reports follow a professional 7-9 page structure:

1. **Title Page**: Client information, report period, SDM details
2. **Agenda**: Overview of report contents
3. **Key Performance Metrics**: 6-section dashboard overview
4. **SLA Compliance Analysis**: Detailed breach analysis with ticket table
5. **Escalated Tickets** (Conditional): Appears only when escalations exist
6. **Monthly Charts**: Created vs resolved ticket trends
7. **Ticket Types**: Pie chart distribution of ticket categories
8. **Questions & Discussion**: Template page for meetings
9. **Final Page**: Branded closing page

### Generating Reports

1. **Set Filters**: Configure company, SDM, and date filters
2. **Review Data**: Ensure dashboard shows correct data
3. **Export**: Click "PDF" button in toolbar
4. **Download**: Report automatically downloads with descriptive filename

### Report Features

#### Template Integration
- Uses your branded Template.pdf file
- Preserves all graphics and branding
- Professional landscape orientation

#### Dynamic Content
- Company-specific data filtering
- Real-time chart generation
- Automatic scaling and formatting

#### Professional Layout
- Consistent typography and spacing
- Color-coded charts and metrics
- Clear visual hierarchy

### Customization

#### Template Modification
- Update `public/Template.pdf` with your branding
- Maintain 8+ page structure
- Preserve landscape orientation

#### Content Customization
- Modify agenda items in code
- Adjust chart colors and formatting
- Update summary statistics

## Technical Documentation

### Data Format Requirements

#### Required CSV Columns
- `ticketId`: Unique ticket identifier
- `subject`: Ticket title/description
- `status`: Current ticket status
- `priority`: Ticket priority level
- `createdTime`: Ticket creation timestamp
- `resolvedTime`: Resolution timestamp (if resolved)
- `dueByTime`: SLA due date
- `companyName`: Client company name
- `sdm`: Service Delivery Manager
- `agent`: Assigned agent
- `type`: Ticket category/type
- `resolutionStatus`: SLA status (optional)
- `sdmEscalation`: Escalation flag (true/false)

#### Data Validation
- Automatic date parsing and validation
- Missing field handling
- Data type conversion
- Error reporting and logging

### Performance Considerations

#### Data Processing
- Efficient in-memory processing
- Optimized filtering algorithms
- Chart data caching
- Lazy loading for large datasets

#### Browser Compatibility
- Modern ES6+ features
- Progressive enhancement
- Responsive design
- Cross-browser testing

### Architecture Overview

#### Frontend Stack
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library
- **Recharts**: Interactive charts

#### Key Components
- **DataProcessor**: Core data manipulation and filtering
- **Chart Components**: Reusable visualization components
- **PDF Generator**: Template-based report generation
- **Modal System**: SLA compliance and AI insights

#### Libraries Used
- **pdf-lib**: PDF generation and manipulation
- **date-fns**: Date handling and formatting
- **Lucide React**: Icon library
- **CSV Parser**: Custom CSV processing

## Troubleshooting

### Common Issues

#### CSV Upload Problems
- **Error**: "File format not supported"
  - **Solution**: Ensure file is .csv format with proper encoding
- **Error**: "Missing required columns" 
  - **Solution**: Verify all required columns are present and named correctly

#### Dashboard Display Issues
- **Problem**: Charts not displaying
  - **Solution**: Check browser console for errors, refresh page
- **Problem**: Filters not working
  - **Solution**: Clear filters and reload data

#### PDF Generation Problems
- **Error**: "Template not found"
  - **Solution**: Ensure Template.pdf exists in public folder
- **Error**: "PDF generation failed"
  - **Solution**: Check console for specific errors, try with smaller dataset

#### Performance Issues
- **Problem**: Slow loading with large datasets
  - **Solution**: Filter data before analysis, use date ranges
- **Problem**: Browser freezing
  - **Solution**: Reduce dataset size, clear browser cache

### Browser Requirements

#### Minimum Requirements
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- JavaScript enabled
- Local storage access
- 4GB+ RAM for large datasets

#### Recommended Setup
- Chrome or Edge latest version
- 8GB+ RAM
- Fast internet connection
- Large screen (1920x1080+)

### Support and Maintenance

#### Getting Help
1. Check browser console for error messages
2. Verify data format and content
3. Try with smaller dataset
4. Clear browser cache and reload

#### Updates and Maintenance
- Regular dependency updates
- Security patches
- Feature enhancements
- Performance optimizations

#### Data Backup
- Export filtered data regularly
- Save important SLA overrides
- Backup template files
- Document custom configurations

---

## Version Information

**Version**: 2.0.0  
**Last Updated**: January 2025  
**Compatibility**: Node.js 18+, Modern Browsers  
**License**: Internal Use Only