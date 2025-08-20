# Service Desk Analytics - Installation Guide

## Overview

Service Desk Analytics is a comprehensive dashboard application built with Next.js that provides analytics and reporting capabilities for service desk operations. It includes features for ticket analysis, SLA compliance tracking, PDF export, and Freshdesk integration.

## Prerequisites

Before installing the application, ensure you have the following installed on your system:

- **Node.js** (version 18.0 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git** (for cloning the repository)

### Checking Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Git version
git --version
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd service-desk-analytics-taranto
```

### 2. Install Dependencies

```bash
npm install
```

Or if you prefer yarn:

```bash
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory and configure the following environment variables:

```bash
# Copy the example environment file
cp .env.example .env.local
```

Add the following configuration to `.env.local`:

```env
# Freshdesk Configuration
NEXT_PUBLIC_FRESHDESK_DOMAIN=your-domain
FRESHDESK_API_KEY=your-api-key

# Application Configuration
NEXT_PUBLIC_APP_NAME=Service Desk Analytics
NEXT_PUBLIC_COMPANY_NAME=Your Company Name

# Optional: Analytics and Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### 4. Required Files Setup

#### Template PDF File
Place your PDF template file in the `public` directory:

```bash
# Place your template PDF file
cp your-template.pdf public/Template.pdf
```

#### Company Logo
Place your company logo in the `public` directory:

```bash
# Place your logo file
cp your-logo.png public/logo.png
```

#### Sample CSV Data (Optional)
For testing purposes, you can place a sample CSV file:

```bash
# Place sample CSV in public/testfiles/
mkdir -p public/testfiles
cp your-sample-data.csv public/testfiles/testfile.csv
```

### 5. Build the Application

```bash
npm run build
```

### 6. Start the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The application will be available at:
- Development: `http://localhost:3000`
- Production: `http://localhost:3000` (or your configured port)

## Configuration

### Freshdesk Integration

To enable Freshdesk integration features:

1. **Obtain API Key**: Get your Freshdesk API key from your Freshdesk admin panel
2. **Configure Domain**: Set your Freshdesk domain in the environment variables
3. **API Permissions**: Ensure the API key has permissions for:
   - Reading tickets
   - Updating ticket custom fields
   - Adding private notes

### CSV Data Format

The application expects CSV data with the following columns (in order):

1. Ticket ID
2. Subject
3. Status
4. Priority
5. Source
6. Type
7. Agent
8. Group
9. Created Time
10. Due By Time
11. Resolved Time
12. Closed Time
13. Last Update Time
14. Initial Response Time
15. Time Tracked
16. First Response Time Hrs
17. Resolution Time Hrs
18. Agent Interactions
19. Customer Interactions
20. Resolution Status
21. First Response Status
22. Tags
23. Survey Results
24. Association Type
25. Internal Agent
26. Internal Group
27. Every Response Status
28. Product
29. Client Priority
30. Client Reference
31. Number of Users Affected
32. Location
33. Environment
34. Product Dup
35. Module
36. Fault
37. SDM Escalation
38. Resolution
39. Jira Ref
40. Release Version
41. Review For SLA
42. Feedback Rating
43. Team
44. Workaround In Place
45. ELS
46. Position
47. Full Name
48. Title
49. Email
50. Work Phone
51. Mobile Phone
52. Twitter ID
53. Time Zone
54. Language
55. Tags Contact
56. Unique External ID
57. Twitter Verified Profile
58. Twitter Follower Count
59. Facebook ID
60. Contact ID
61. Hosted Client
62. Company Name
63. Company Domains
64. Type of HH Agreement
65. Health Score
66. Account Tier
67. Renewal Date
68. Industry
69. Trail
70. Suspensions
71. Permits
72. Taranto Version
73. Civica Version
74. SDM
75. Contract Code
76. Service Credits
77. Within SLA Override

## Features

### Core Features
- **Dashboard Analytics**: Key metrics and performance indicators
- **Interactive Charts**: Monthly trends, ticket types, age breakdown, status distribution
- **SLA Compliance**: Real-time SLA tracking with manual override capabilities
- **Search Functionality**: Quick ticket lookup with comprehensive details
- **Export Capabilities**: PDF reports and Excel data export
- **AI Insights**: Automated analysis and professional summaries

### Advanced Features
- **Freshdesk Integration**: Direct ticket linking and SLA status updates
- **Filter System**: SDM, Company, and date-based filtering
- **Responsive Design**: Mobile and desktop optimized
- **Real-time Updates**: Dynamic data processing and visualization

## Deployment

### Development Deployment
```bash
npm run dev
```

### Production Deployment

#### Option 1: Node.js Server
```bash
npm run build
npm start
```

#### Option 2: Docker Deployment
```bash
# Build Docker image
docker build -t service-desk-analytics .

# Run container
docker run -p 3000:3000 --env-file .env.local service-desk-analytics
```

#### Option 3: Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

## Troubleshooting

### Common Issues

#### 1. Node.js Version Compatibility
```bash
# If you encounter Node.js version issues
nvm install 18
nvm use 18
```

#### 2. Port Already in Use
```bash
# If port 3000 is in use, specify a different port
npm run dev -- -p 3001
```

#### 3. Environment Variables Not Loading
- Ensure `.env.local` exists in the root directory
- Check that variable names match exactly
- Restart the development server after changes

#### 4. CSV Import Issues
- Verify CSV format matches expected structure
- Check for special characters or encoding issues
- Ensure all required columns are present

#### 5. Freshdesk API Connection Issues
- Verify API key is correct and active
- Check domain name is exact match
- Ensure firewall allows outbound HTTPS connections

### Performance Optimization

#### 1. Large CSV Files
```bash
# For large datasets, consider chunked processing
# Monitor memory usage with:
node --max-old-space-size=4096 server.js
```

#### 2. Chart Rendering
- Limit chart data points for better performance
- Use data aggregation for large datasets
- Consider virtual scrolling for large lists

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different API keys for development and production
- Regularly rotate API keys

### Data Handling
- Ensure CSV data doesn't contain sensitive information
- Implement proper access controls
- Use HTTPS in production

## Support

### Getting Help
- Check the troubleshooting section above
- Review the application logs for error details
- Ensure all prerequisites are met

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild application
npm run build

# Restart application
npm start
```

## System Requirements

### Minimum Requirements
- **RAM**: 2GB
- **Storage**: 1GB free space
- **CPU**: Dual-core processor
- **Network**: Internet connection for Freshdesk integration

### Recommended Requirements
- **RAM**: 4GB or higher
- **Storage**: 5GB free space
- **CPU**: Quad-core processor
- **Network**: High-speed internet connection

## License

This project is licensed under the terms specified in the LICENSE file.

## Version Information

- **Current Version**: 1.0.0
- **Next.js Version**: 15.2.4
- **Node.js Compatibility**: 18.0+
- **Last Updated**: January 2025