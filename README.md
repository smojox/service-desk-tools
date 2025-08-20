# 🛠️ Service Desk Tools Hub v2.0

[![Release](https://img.shields.io/badge/release-v2.0-green.svg)](https://github.com/smojox/service-desk-analytics-taranto/releases/tag/v2.0)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4.24-purple.svg)](https://next-auth.js.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.18-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg)](https://tailwindcss.com/)

A comprehensive service desk tools hub built for Taranto, featuring secure authentication, powerful analytics, ticket management utilities, and administrative tools. Perfect for service desk managers, IT directors, and stakeholders who need streamlined access to service desk operations with role-based security.

## 🎯 Key Features

### 📈 **Real-time Analytics Dashboard**
- **Live Metrics**: Total tickets, open/closed counts, average resolution time, SLA compliance
- **Interactive Charts**: Monthly ticket volume trends with 7-month historical view
- **Visual KPIs**: Color-coded metrics with trend indicators and hover details
- **Performance Tracking**: Real-time updates as data changes

### 🎪 **SDM Monthly Reviews**
- **Modal-based Interface**: Streamlined review process without losing dashboard context
- **Company Analysis**: Detailed performance breakdown by company
- **SLA Trending**: Month-over-month SLA comparisons with visual indicators
- **RAG Status Management**: Red/Amber/Green classifications with comment tracking
- **Ticket Type Breakdown**: Individual counts for Incidents, Service Requests, Problems, and Others

### 🔍 **Advanced Filtering & Search**
- **Multi-dimensional Filtering**: Filter by SDM, Company, and custom date ranges
- **Smart Dropdowns**: Dynamic company filtering based on SDM selection
- **Contextual Charts**: Monthly charts respect SDM/company filters while preserving historical context
- **Clear Filters**: Easy reset functionality for quick data exploration

### 📊 **Professional Exports**
- **PDF Service Reviews**: Comprehensive reports with charts, metrics, and professional formatting
- **Page Selection**: Choose specific pages to include in PDF exports with customizable options
- **Detailed Analysis Pages**: Open Incidents/Service Requests with pagination, Problem Records with JIRA references
- **Age Breakdown Charts**: Breakdown by Age of Ticket with vertical date formatting (MMM/YY)
- **Escalation Process Integration**: Automated inclusion of escalation documentation
- **Excel Data Export**: Detailed monthly review data for further analysis
- **Print-ready Reports**: Formatted for stakeholder presentations and archival

### 🤖 **AI-Powered Insights**
- **Pattern Recognition**: Intelligent analysis of ticket trends and anomalies
- **Performance Recommendations**: AI-generated suggestions for process improvement
- **Predictive Analytics**: Forecasting based on historical data patterns
- **Executive Summaries**: High-level insights for management reporting

### 🔧 **Service Desk Tools**
- **Appeal Code Management**: Validate and generate appeal codes for different notice types
- **Code Validation**: Real-time validation of 6-character appeal codes with detailed feedback
- **Bulk Code Export**: Generate CSV files with appeal codes for date ranges
- **Notice Type Support**: Support for 10 different notice types (Parking, Bus Lane, RUCA, etc.)
- **Tools Hub**: Centralized access to additional service desk utilities

### 🌐 **Freshdesk Integration**
- **Live Ticket Updates**: Real-time integration with Freshdesk API for ticket management
- **Custom Field Updates**: Update SLA status and custom fields directly from the dashboard
- **Private Notes**: Automatically add private notes when SLA overrides are applied
- **Secure Authentication**: Basic authentication with API key management
- **Error Handling**: Comprehensive error handling with user-friendly feedback

### 🔐 **Authentication & Security** (New in v2.0)
- **Secure Login System**: NextAuth.js v4 with credential-based authentication
- **User Management**: Complete user CRUD operations with MongoDB integration
- **Role-based Access Control**: Admin, User, and Viewer roles with granular permissions
- **Admin Dashboard**: Comprehensive user management interface
- **Session Management**: Secure JWT-based sessions with 24-hour expiration
- **Route Protection**: Middleware-based access control for all application routes
- **Permission Matrix**: Fine-grained tool access control (Analytics, Appeal Codes, Admin Panel)
- **Password Security**: bcryptjs hashing with secure salt rounds

### ⚡ **Performance & User Experience**
- **Lag-free Text Entry**: Optimized comment handling for smooth typing experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Fast Data Processing**: Efficient CSV parsing and real-time calculations
- **Auto-save Functionality**: Automatic persistence of review data and comments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- MongoDB database (local or cloud instance)

### Installation

```bash
# Clone the repository
git clone https://github.com/smojox/service-desk-analytics-taranto.git
cd service-desk-analytics-taranto

# Install dependencies
npm install --legacy-peer-deps

# Configure environment variables (see Configuration section)
cp .env.example .env.local

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### First-Time Authentication Setup

1. **Visit the Application**: Navigate to http://localhost:3000
2. **Initialize Admin**: Click "Initialize Admin User (Development)" on the login page
3. **Login**: Use credentials `admin@taranto.com` / `admin123`
4. **Create Users**: Access the Admin panel to create additional users
5. **Configure Permissions**: Set up role-based access for your team

## 📋 Getting Started Guide

### 1. **Authentication & Access**
- **First Login**: Navigate to http://localhost:3000 and initialize admin user
- **User Management**: Admin users can create and manage additional users
- **Role Assignment**: Configure user roles (Admin, User, Viewer) and permissions
- **Secure Access**: All tools require authentication and appropriate permissions

### 2. **Tools Hub Navigation** 
- **Main Dashboard**: Central landing page showing available tools
- **Permission-Based Access**: Tools appear enabled/disabled based on user permissions
- **User Profile**: View current user information and role in the header
- **Admin Panel**: Access user management (admin users only)

### 3. **Service Desk Analytics**
- **Access Control**: Requires `analytics` permission
- **CSV Upload**: Upload service desk data for analysis
- **Real-time Filtering**: Filter by SDMs, companies, or time periods
- **Interactive Charts**: Hover over charts for detailed data points
- **Export Capabilities**: Generate PDF reports and Excel exports

### 4. **Appeal Code Management**
- **Access Control**: Requires `appealCodes` permission  
- **Code Validation**: Real-time validation with detailed feedback
- **Bulk Generation**: Create appeal codes for date ranges
- **CSV Export**: Export codes for all notice types

### 5. **Administrative Functions**
- **User Management**: Create, edit, and delete user accounts
- **Permission Control**: Configure granular access to tools
- **Role Management**: Assign Admin, User, or Viewer roles
- **Account Status**: Enable/disable user accounts

## 📊 Data Requirements

The dashboard expects CSV files with the following key fields:

### Required Fields
- **ticketId**: Unique ticket identifier
- **subject**: Ticket summary/title
- **status**: Current ticket status (Open, Resolved, Closed, etc.)
- **priority**: Ticket priority level
- **createdTime**: Ticket creation timestamp
- **companyName**: Customer company name
- **sdm**: Service Desk Manager assignment

### SLA & Performance Fields
- **resolutionStatus**: SLA compliance status ('Within SLA', 'SLA Violated')
- **resolutionTimeHrs**: Time to resolution in hours
- **dueByTime**: SLA due date/time

### Additional Fields
- **type**: Ticket type (Incident, Service Request, Problem, etc.)
- **agent**: Assigned agent/technician
- **group**: Support group assignment

> 📁 **Sample Data**: Check `/public/testfiles/` for example CSV format

## 🏗️ Project Structure

```
service-desk-analytics-taranto/
├── app/                     # Next.js app directory
│   ├── page.tsx            # Root page (redirects to tools)
│   ├── tools/              # Main tools hub landing page
│   ├── analytics/          # Service desk analytics dashboard
│   ├── appeal-codes/       # Appeal code management tool
│   ├── login/              # Authentication login page
│   ├── admin/              # Admin user management panel
│   ├── monthly-review/     # Review page (legacy)
│   └── api/               # API routes
│       ├── auth/          # NextAuth.js authentication
│       ├── users/         # User management API
│       └── freshdesk/     # Freshdesk API integration
├── components/             # React components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── charts/            # Chart components (Recharts)
│   ├── modals/            # Modal dialogs
│   ├── csv-upload.tsx     # CSV upload handler
│   ├── pdf-export.tsx     # PDF generation
│   └── ppt-export.tsx     # PowerPoint export
├── lib/                   # Core utilities
│   ├── models/            # Database models
│   │   └── User.ts       # User model with MongoDB integration
│   ├── auth-config.ts     # NextAuth.js configuration
│   ├── mongodb.ts         # MongoDB connection client
│   ├── csv-parser.ts      # Data parsing logic
│   ├── data-processor.ts  # Analytics engine
│   ├── freshdesk-api.ts   # Freshdesk API client
│   ├── freshdesk-client.ts # Frontend Freshdesk client
│   └── utils.ts           # Shared utilities
├── middleware.ts           # Route protection middleware
├── docs/                  # Documentation
│   ├── screenshots/       # UI screenshots with index
│   ├── USER_MANUAL.md     # Comprehensive user manual
│   └── Visual_User_Guide.pdf # Visual guide
└── public/                # Static assets
    ├── testfiles/         # Sample data
    ├── templates/         # Export templates
    └── branding/          # Logo and assets
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 + TypeScript + React 18
- **Authentication**: NextAuth.js v4.24.11 with JWT sessions
- **Database**: MongoDB 6.18+ with native driver
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts for interactive visualizations
- **Data Processing**: Custom analytics engine with TypeScript
- **State Management**: React hooks with optimized performance
- **PDF Generation**: Custom PDF export functionality
- **Security**: bcryptjs for password hashing, middleware-based route protection
- **Development**: ESLint + Prettier + TypeScript strict mode

## 📈 SLA Calculation Logic

The dashboard uses a comprehensive SLA calculation that handles:

- **Explicit Status**: 'Within SLA' and 'SLA Violated' values
- **Due Date Checking**: Automatic calculation based on `dueByTime` field
- **Status Consideration**: Pending tickets assumed compliant
- **Override Support**: Manual SLA adjustments through the UI
- **Historical Accuracy**: Consistent calculations across dashboard and reviews

## 🎨 UI Components

Built with modern, accessible components:

- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Interactive Charts**: Hover states and clickable elements
- **Modal Dialogs**: Overlay interfaces that preserve context
- **Form Controls**: Accessible dropdowns, inputs, and buttons
- **Loading States**: Smooth loading indicators and skeleton screens
- **Toast Notifications**: User feedback for actions and errors

## 🔧 Configuration

### Environment Variables

```bash
# MongoDB Database (required)
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=your-app"

# NextAuth.js Authentication (required)
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Application Customization
NEXT_PUBLIC_APP_NAME="Service Desk Tools Hub"
NEXT_PUBLIC_COMPANY_NAME="Taranto"

# Optional: Freshdesk Integration
NEXT_PUBLIC_FRESHDESK_DOMAIN="your-domain"
FRESHDESK_API_KEY="your-api-key"
NEXT_PUBLIC_FRESHDESK_SLA_FIELD_NAME="review_for_sla"
```

### Database Setup

The application uses MongoDB to store user accounts and permissions:

1. **Database Name**: `ServiceDesk` (automatically created)
2. **Collections**: 
   - `users` - User accounts, roles, and permissions
   - Sessions are handled by NextAuth.js (in-memory JWT)
3. **Indexes**: Automatic indexing on email field for performance
4. **Initial Data**: Admin user created on first login attempt

### Freshdesk Setup
To enable Freshdesk integration features:

1. **API Key**: Obtain your Freshdesk API key from Settings > API
2. **Domain**: Your Freshdesk subdomain (e.g., if your URL is `company.freshdesk.com`, use `company`)
3. **Custom Fields**: Ensure your Freshdesk has the required custom fields for SLA tracking
4. **SSL Configuration**: The application handles SSL certificate issues automatically for on-premise installations

### CSV Field Mapping
The application automatically maps common CSV field variations. See `/docs/field-mapping.md` for customization options.

## 📚 Documentation

- **User Guide**: `/docs/USER_MANUAL.md`
- **Screenshots**: `/docs/screenshots/`
- **API Reference**: `/docs/api/`
- **Development Guide**: `/docs/development.md`

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/smojox/service-desk-analytics-taranto/issues)
- **Documentation**: [User Manual](/docs/USER_MANUAL.md)
- **Email**: Contact your system administrator

## 🏆 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide React](https://lucide.dev/)

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**v2.0 Release** - August 2025 | Service Desk Tools Hub with Authentication

## 🔄 Version 2.0 Release Notes (Major Update)

### 🚨 **Breaking Changes**
- **Authentication Required**: All application access now requires user authentication
- **Route Changes**: Root page (/) redirects to /tools instead of direct analytics access
- **MongoDB Dependency**: Database setup required for user management
- **Environment Variables**: New required auth-related environment variables

### 🔐 **New Authentication System**
- **NextAuth.js Integration**: Professional authentication with JWT sessions
- **User Management**: Complete CRUD operations for user accounts
- **Role-based Access Control**: Admin, User, and Viewer roles with granular permissions
- **Secure Password Handling**: bcryptjs hashing with salt rounds
- **Route Protection**: Middleware-based access control for all application routes
- **Admin Dashboard**: Comprehensive user management interface
- **Session Management**: Secure 24-hour JWT sessions with automatic refresh

### 🏗️ **Application Restructure**
- **Tools Hub Landing Page**: New centralized dashboard for accessing all tools
- **Permission-Based Tool Access**: Tools appear enabled/disabled based on user permissions
- **Analytics as Widget**: Service Desk Analytics moved to /analytics route
- **Navigation Updates**: All internal navigation updated to support new structure

### 🛡️ **Security Enhancements**
- **Route Middleware**: Comprehensive route protection for all application pages
- **Admin Self-Protection**: Prevents admins from deleting or demoting themselves
- **Permission Validation**: API-level permission checking for all sensitive operations
- **Secure Defaults**: New users created with minimal permissions by default

## 🔄 Version 1.1 Release Notes (Previous Release)

### New Features (v2.0)
- **Complete Authentication System**: NextAuth.js with MongoDB user storage
- **User Management Interface**: Admin panel for creating and managing users
- **Role-based Permissions**: Granular access control for different application areas
- **Tools Hub Architecture**: Centralized landing page for all service desk tools
- **Route Protection**: Middleware-based access control for all application routes
- **Secure Session Management**: JWT-based authentication with automatic expiration

### Previous Features (v1.1)
- **PDF Page Selection**: Choose which pages to include in PDF exports with checkbox interface
- **Enhanced Ticket Analysis**: New dedicated pages for Open Incidents/Service Requests and Problem Records
- **Improved Chart Formatting**: Vertical date labels with MMM/YY format for better readability
- **Escalation Process Integration**: Automatic inclusion of escalation documentation in PDF exports
- **Pagination Support**: 15 tickets per page for detailed analysis sections
- **Appeal Code Management**: New tool for validating and generating appeal codes
- **Service Desk Tools Hub**: Centralized access to additional utilities
- **Freshdesk Integration**: Direct API integration for ticket updates and SLA management
- **Production Optimizations**: Cleaned up project structure and improved performance

### 🏗️ **User Roles and Permissions**

#### **Admin Role**
- Full application access including user management
- Can create, edit, and delete user accounts
- Can modify user roles and permissions
- Access to Admin Dashboard
- Cannot delete or demote their own account (security protection)

#### **User Role** 
- Access to Analytics and Appeal Codes tools
- Cannot access Admin Dashboard
- Standard operational permissions
- Can use all core application features

#### **Viewer Role**
- Read-only access to Analytics
- Cannot access Appeal Codes or Admin functions  
- Limited to viewing dashboards and reports
- Cannot modify data or export capabilities

#### **Permission Matrix**
```
Tool/Feature         | Admin | User | Viewer
---------------------|-------|------|-------
Analytics Dashboard  |   ✅   |  ✅   |   ✅
Appeal Code Tools    |   ✅   |  ✅   |   ❌
Admin Panel          |   ✅   |  ❌   |   ❌
User Management      |   ✅   |  ❌   |   ❌
Data Export          |   ✅   |  ✅   |   ✅
Freshdesk Integration|   ✅   |  ✅   |   ❌
```

### Improvements (v1.1)
- Removed SDM management text from executive summaries for cleaner presentation
- Replaced Performance Summary with Priority breakdown analysis
- Enhanced chart positioning and alignment across all PDF pages
- Improved filtering for company-specific data across all analysis pages
- Better handling of JIRA references in Problem Records
- Added comprehensive error handling for API integrations
- Enhanced security with proper SSL certificate handling