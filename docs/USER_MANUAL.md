# Service Desk Analytics - User Manual

## Quick Start Guide

### Step 1: Accessing the Application
1. Open your web browser
2. Navigate to the application URL
3. You'll see the welcome screen with upload area

### Step 2: Upload Your Data
1. **Prepare your CSV file** with ticket data
2. **Click the upload area** or drag and drop your CSV file
3. **Wait for processing** - you'll see a confirmation message
4. **Dashboard loads** with your data automatically

### Step 3: Explore Your Data
1. **Review metrics** in the top cards
2. **Check charts** for trends and patterns
3. **Apply filters** to focus on specific data
4. **Generate reports** when ready

---

## Detailed User Instructions

### Data Upload Process

#### Before You Start
- Ensure your CSV file contains ticket data
- File should have columns like: ticketId, subject, status, priority, createdTime, companyName, sdm, agent
- File size should be reasonable (under 50MB for best performance)

#### Upload Steps
1. **Initial Screen**: When you first open the app, you'll see an upload area
2. **Select File**: Click "Browse files" or drag your CSV file onto the upload area
3. **Processing**: Wait for the file to process (usually 5-30 seconds)
4. **Confirmation**: You'll see the dashboard load with your data

#### If Upload Fails
- Check file format (must be .csv)
- Verify column names match expected format
- Try with a smaller file first
- Check browser console for error details

### Dashboard Overview

#### Top Metrics Cards
- **Total Tickets**: Shows overall count of tickets in your dataset
- **Open Tickets**: Currently unresolved tickets
- **Closed Tickets**: Resolved or closed tickets  
- **Average Resolution**: Mean time to resolve tickets (in hours)
- **SLA Compliance**: Percentage meeting SLA requirements (clickable for details)

#### Charts Section
- **Monthly Trends**: Line chart showing created vs resolved tickets over time
- **Open Tickets by Type**: Pie chart showing distribution of ticket categories

#### Escalated Tickets Section
- Shows tickets that have been escalated to management
- Color-coded by priority (red = urgent, orange = high)
- Click items for more details

#### Recent Priority Tickets
- Lists high-priority and urgent tickets
- Sorted by creation date
- Shows key details: ID, subject, priority, agent

### Using Filters

#### Filter Bar (Top of Dashboard)
Located below the header when data is loaded.

#### SDM (Service Delivery Manager) Filter
- **Purpose**: Filter data by specific SDM
- **Options**: "All SDMs" or select specific manager
- **Effect**: Updates all dashboard data and reports

#### Company Filter  
- **Purpose**: Focus on specific client company
- **Options**: "All Companies" or select specific company
- **Behavior**: List updates based on selected SDM

#### Date Filter
- **All Time**: Shows complete dataset
- **Last 3 Months**: Data from past 3 months
- **Last 6 Months**: Data from past 6 months  
- **Last Year**: Data from past 12 months
- **Specific Months**: Choose individual months (e.g., "January 2024")

#### Clear Filters Button
- Resets all filters to "All" selections
- Useful for starting fresh analysis

### SLA Compliance Management

#### Accessing SLA Details
1. **Click** the "SLA Compliance" metric card
2. **Modal opens** showing detailed breakdown
3. **View tabs** for different views of SLA data

#### Understanding SLA Status
- **Green Toggle**: Ticket meets SLA requirements
- **Red Toggle**: Ticket breaches SLA requirements  
- **System Calculated**: Based on due dates and resolution times
- **Manual Override**: You can toggle to override system calculation

#### Managing SLA Overrides
1. **Find ticket** in the SLA modal list
2. **Click toggle** to change SLA status
3. **Status saves** automatically
4. **Persists** across sessions (remembered when you return)

#### Searching SLA Data
- **Search box**: Type ticket ID, subject, or company name
- **Real-time filtering**: Results update as you type
- **Case insensitive**: Search works regardless of capitalization

#### Exporting SLA Data
1. **Click "Export to Excel"** button in SLA modal
2. **File downloads** with current filtered data
3. **Includes**: All SLA breach details with override status

### AI Insights Feature

#### Accessing AI Analysis
1. **Click "AI" button** in top toolbar
2. **Wait for analysis** (may take 10-30 seconds)
3. **Review insights** in the modal that opens

#### Types of AI Insights
- **Performance Trends**: Analysis of ticket volume and resolution patterns
- **Risk Assessment**: Identification of potential problem areas
- **Recommendations**: Suggestions for process improvements
- **Comparative Analysis**: How current period compares to previous periods

#### Understanding AI Recommendations
- **Actionable Items**: Specific steps you can take
- **Priority Indicators**: Which issues to address first
- **Data-Driven**: Based on patterns in your actual ticket data
- **Context Aware**: Considers your specific company/SDM filters

### Report Generation

#### Preparing for Report Generation
1. **Set Filters**: Choose company, SDM, and date range
2. **Review Dashboard**: Ensure data looks correct
3. **Check SLA Overrides**: Apply any necessary SLA status changes
4. **Verify Charts**: Confirm charts show expected data

#### Generating PDF Reports
1. **Click "PDF" button** in top toolbar
2. **Wait for generation** (usually 10-30 seconds)
3. **Download starts** automatically
4. **File saved** with descriptive name (e.g., "Service_Review_CompanyName_2024-01-15.pdf")

#### PDF Report Contents
**Page 1**: Title page with client and report details  
**Page 2**: Agenda outlining report contents  
**Page 3**: Key performance metrics dashboard  
**Page 4**: SLA compliance analysis with breach details  
**Page 5**: Escalated tickets analysis (if escalations exist)  
**Page 6**: Monthly created vs resolved tickets chart  
**Page 7**: Open tickets by type pie chart  
**Page 8**: Questions and discussion page  
**Page 9**: Final branded page  

#### Report Features
- **Professional Layout**: Uses your branded template
- **Dynamic Data**: Shows filtered data only
- **High Quality**: Suitable for client presentations
- **Comprehensive**: Covers all key performance areas

### Advanced Features

#### Monthly Chart Behavior
- **Always Shows 7 Months**: Even if you select one month filter
- **Company Specific**: When company is selected, chart shows only that company's data
- **Historical Context**: Provides trend analysis over time

#### Data Persistence
- **SLA Overrides**: Saved in browser, persist across sessions
- **Filter Preferences**: May be remembered (browser dependent)
- **Upload History**: Recent files may be cached

#### Excel Export Options
- **SLA Breach Data**: Export from SLA compliance modal
- **Filtered Data**: Exports respect current filter selections
- **Formatted Output**: Ready for further analysis

### Best Practices

#### Data Management
- **Regular Uploads**: Update data weekly or monthly
- **Backup Important Overrides**: Document manual SLA changes
- **File Naming**: Use consistent naming for CSV files
- **Data Quality**: Ensure consistent formatting in source data

#### Filtering Strategy
- **Start Broad**: Begin with "All" filters to understand full dataset
- **Narrow Focus**: Apply specific filters for detailed analysis
- **Compare Periods**: Use date filters to compare different time periods
- **Client Reports**: Use company filter for client-specific reports

#### Report Generation
- **Review Before Export**: Always check dashboard before generating reports
- **Appropriate Filters**: Ensure filters match intended audience
- **Quality Check**: Open generated PDF to verify content
- **Regular Schedule**: Generate reports on consistent schedule

### Troubleshooting Common Issues

#### Upload Problems
**Problem**: CSV won't upload  
**Solution**: Check file format, column names, file size

**Problem**: Data looks wrong after upload  
**Solution**: Verify CSV column headers match expected format

#### Dashboard Issues  
**Problem**: Charts not showing  
**Solution**: Refresh browser, check for JavaScript errors

**Problem**: Filters not working  
**Solution**: Clear filters and try again, reload page if needed

#### Report Generation Issues
**Problem**: PDF generation fails  
**Solution**: Try with smaller date range, check browser console

**Problem**: PDF missing data  
**Solution**: Verify filters are set correctly before generating

#### Performance Issues
**Problem**: App running slowly  
**Solution**: Use smaller datasets, apply date filters, close other browser tabs

**Problem**: Browser freezing  
**Solution**: Refresh page, try with smaller CSV file

### Getting the Most from Your Analytics

#### Regular Review Schedule
- **Weekly**: Check recent ticket trends and escalations
- **Monthly**: Generate client reports and review SLA compliance
- **Quarterly**: Analyze long-term trends and performance patterns

#### Key Metrics to Monitor
- **SLA Compliance Trends**: Track improvement or degradation over time
- **Escalation Patterns**: Identify common escalation triggers
- **Resolution Times**: Monitor efficiency improvements
- **Ticket Volume**: Understand workload patterns

#### Using Data for Improvement
- **Identify Bottlenecks**: Look for patterns in delayed resolutions
- **Resource Planning**: Use volume trends for capacity planning
- **Client Communication**: Use reports for regular client updates
- **Process Improvement**: Analyze data to optimize workflows

---

## Support and Help

### Self-Help Resources
1. **Check this manual** for step-by-step instructions
2. **Browser console** for technical error messages
3. **Try with sample data** to isolate issues
4. **Clear browser cache** if experiencing problems

### Common Error Messages
- **"Template PDF not found"**: Ensure Template.pdf is in public folder
- **"File format not supported"**: Use .csv files only
- **"Missing required columns"**: Check CSV column headers
- **"Processing failed"**: Try smaller file or check data format

### Performance Tips
- **Use date filters** to work with smaller datasets
- **Close unused browser tabs** to free memory
- **Regular browser refresh** to clear memory
- **Stable internet connection** for smooth operation

Remember: This application is designed to make service desk analytics simple and powerful. Take time to explore the features and find the workflow that works best for your team!