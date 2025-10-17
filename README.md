# 🎫 Taranto Service Desk Management System v2.1

[![Release](https://img.shields.io/badge/release-v2.1-00ABC8.svg)](https://github.com/smojox/service-desk-analytics-taranto/releases/tag/v2.1)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-4.24-purple.svg)](https://next-auth.js.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.18-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-00ABC8.svg)](https://tailwindcss.com/)

A modern, full-featured service desk management system built for Taranto. Complete incident lifecycle management with customer portal, SLA tracking, multi-company support, and powerful analytics. Built with the Taranto brand identity featuring turquoise, green, and professional design throughout.

## 🎯 Key Features

### 🎫 **Complete Incident Management**
- **Full Ticket Lifecycle**: Create, view, update, and resolve incidents with comprehensive tracking
- **Multi-company Support**: Manage incidents across multiple companies with isolated data
- **SLA Tracking**: Automated SLA monitoring with pause/resume when tickets go on hold
- **Priority Matrix**: Flexible priority calculation based on urgency and impact
- **Status Workflow**: Complete incident lifecycle from New → Resolved → Closed
- **Rich Comments**: Customer updates and internal notes with full conversation history
- **Assignment Management**: Assign incidents to team members with notification support
- **Search & Filter**: Advanced filtering by status, priority, company, assignee, SLA status
- **Saved Queries**: Save and share common filter combinations for quick access
- **Batch Operations**: Update multiple incidents simultaneously

### 🌐 **Customer Portal**
- **Self-Service Portal**: Secure portal for customers to view and manage their incidents
- **Password Authentication**: Robust login system with per-contact credentials
- **Incident Viewing**: Customers see only their company's incidents with full details
- **Comment System**: Two-way communication between customers and support staff
- **Status Tracking**: Real-time status updates with color-coded Taranto badges
- **Incident Creation**: Portal users can create new incidents with full form validation
- **Company Isolation**: Automatic data filtering ensures customers only see their own data
- **Responsive Design**: Mobile-friendly interface for on-the-go access

### 📊 **Dashboard & Analytics**
- **Real-time Statistics**: Live incident counts, SLA compliance, priority breakdown
- **Visual KPIs**: Color-coded metrics with Taranto brand colors (turquoise, green, orange, red)
- **Interactive Charts**: Status breakdown, priority distribution, company volumes
- **High Priority Alerts**: Dedicated section for critical and high-priority incidents
- **Top Companies**: Track incident volume by customer company
- **SLA Performance**: Within SLA, At Risk, and Breached incident tracking
- **Trend Analysis**: Month-over-month performance tracking

### 🏢 **Company & Contact Management**
- **Company Profiles**: Manage customer companies with SLA definitions
- **SLA Configuration**: Assign different SLA policies per company
- **Contact Management**: Maintain customer contact records with portal access control
- **Portal Enablement**: Enable/disable customer portal per company
- **Compliance Tracking**: Monitor SLA compliance rates by company
- **Primary Contacts**: Designate primary contacts for each company

### 📈 **Advanced Analytics & Reporting** (Legacy)
- **CSV Data Import**: Upload historical service desk data for analysis
- **Monthly Reviews**: Detailed performance breakdowns by company and SDM
- **Interactive Charts**: Monthly ticket volume trends with 7-month historical view
- **Professional Exports**: PDF reports with charts, metrics, and professional formatting
- **Excel Exports**: Detailed monthly review data for further analysis

### 🔧 **Additional Tools**
- **Appeal Code Management**: Validate and generate appeal codes for parking/enforcement notices
- **Freshdesk Integration**: Real-time integration with Freshdesk API for ticket management
- **Tools Hub**: Centralized access to additional service desk utilities

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
- **User Management**: Admin users can create and manage staff user accounts
- **Role Assignment**: Configure user roles (Admin, User, Viewer) and permissions
- **Secure Access**: All tools require authentication and appropriate permissions

### 2. **Incident Management** (Primary Function)
- **Dashboard**: View all incidents with real-time statistics and filtering
- **Create Incidents**: Quick incident creation with full form validation
- **View/Edit Incidents**: Click any incident to view details and make updates
- **Status Management**: Update status, priority, assignee, and other fields
- **Comments & Notes**: Add customer updates (visible in portal) or internal notes (staff only)
- **SLA Tracking**: Monitor SLA compliance with automatic calculations
- **Search & Filter**: Advanced filtering by status, priority, company, assignee, SLA
- **Saved Queries**: Save filter combinations for quick access

### 3. **Customer Portal Management**
- **Company Setup**: Create companies and assign SLA definitions
- **Contact Management**: Add customer contacts with portal access
- **Portal Credentials**: Set passwords for contacts to access customer portal
- **Access Control**: Enable/disable portal access per company and per contact
- **Incident Permissions**: Control which contacts can create incidents vs. view only

### 4. **Customer Portal (Customer-Facing)**
- **Portal Login**: Customers log in at `/customer-portal` with their credentials
- **View Incidents**: See all incidents for their company with full details
- **Add Comments**: Submit comments and updates on their tickets
- **Create Incidents**: Portal-enabled contacts can create new incidents
- **Status Tracking**: Monitor incident progress with color-coded status badges

### 5. **Additional Tools**
- **Service Desk Analytics**: Upload CSV data for historical analysis and reporting
- **Appeal Code Management**: Validate and generate parking/enforcement appeal codes
- **Admin Panel**: User management and system configuration

## 📊 Data Model

The incident management system uses MongoDB to store all incident data:

### Incident Schema
- **ref**: Auto-generated reference number (e.g., INC-0001234)
- **subject**: Incident title/summary
- **description**: Detailed description of the issue
- **status**: Current status (new, acknowledged, in_progress, on_hold, waiting_customer, waiting_vendor, resolved, cancelled, closed)
- **priority**: Calculated priority (critical, high, medium, low)
- **urgency**: Customer-specified urgency level
- **impact**: Business impact level
- **category**: Incident category (Hardware, Software, Network, etc.)
- **subcategory**: Optional subcategory for detailed classification

### Company & Contact Management
- **companyId**: Reference to customer company
- **companyName**: Company name for display
- **reportedByName**: Contact who reported the incident
- **reportedByEmail**: Contact email address
- **assignedToId**: Staff user assigned to incident
- **assignedToName**: Assigned staff member name

### SLA & Performance Tracking
- **slaName**: SLA definition name (e.g., "Standard 8x5", "Premium 24x7")
- **responseByTime**: SLA response deadline
- **dueByTime**: SLA resolution deadline
- **slaStatus**: Current SLA status (within_sla, at_risk, breached)
- **onHoldTime**: Duration ticket was on hold (excluded from SLA)

### Collaboration & History
- **customerUpdates**: Array of public updates visible in customer portal
- **internalNotes**: Array of private notes visible only to staff
- **linkedFreshdeskTickets**: Integration with external Freshdesk tickets
- **linkedJiraTickets**: Integration with JIRA issues
- **viewCount**: Number of times incident was viewed
- **reopenCount**: Number of times incident was reopened
- **escalationLevel**: Current escalation level

> 💾 **Database**: All data stored in MongoDB with automatic indexing and validation

## 🏗️ Project Structure

```
taranto-service-desk/
├── app/                     # Next.js app directory
│   ├── page.tsx            # Root page (redirects to incident-management)
│   ├── incident-management/ # Primary incident management dashboard
│   ├── customer-portal/    # Customer-facing portal
│   │   ├── page.tsx       # Portal login page
│   │   ├── dashboard/     # Customer incident list
│   │   ├── create/        # Customer incident creation
│   │   └── incident/[ref]/ # Customer incident detail view
│   ├── login/              # Staff authentication login page
│   ├── admin/              # Admin user management panel
│   ├── analytics/          # Historical analytics dashboard (legacy)
│   ├── appeal-codes/       # Appeal code management tool
│   └── api/               # API routes
│       ├── auth/          # NextAuth.js authentication
│       ├── users/         # User management API
│       ├── incident-management/ # Incident CRUD operations
│       │   ├── incidents/ # Incident endpoints
│       │   ├── companies/ # Company management
│       │   ├── contacts/  # Contact management
│       │   └── sla-definitions/ # SLA configuration
│       ├── customer-portal/ # Customer portal API
│       │   ├── auth/      # Customer authentication
│       │   └── incidents/ # Customer incident access
│       └── freshdesk/     # Freshdesk API integration (optional)
├── components/             # React components
│   ├── ui/                # Base UI components (shadcn/ui)
│   ├── incident-management-widget.tsx # Main incident dashboard
│   ├── app-sidebar.tsx    # Navigation sidebar with Taranto branding
│   ├── charts/            # Chart components (Recharts)
│   └── modals/            # Modal dialogs
├── lib/                   # Core utilities
│   ├── models/            # MongoDB models
│   │   ├── User.ts       # Staff user accounts
│   │   ├── Incident.ts   # Incident schema
│   │   ├── Company.ts    # Company/customer schema
│   │   ├── Contact.ts    # Customer contact schema
│   │   └── SLADefinition.ts # SLA policy schema
│   ├── auth-config.ts     # NextAuth.js configuration
│   ├── mongodb.ts         # MongoDB connection client
│   └── utils.ts           # Shared utilities
├── middleware.ts           # Route protection middleware
├── Taranto-UI/            # Taranto brand design system
│   └── taranto-setup-instructions.md
└── public/                # Static assets
    ├── logo.png           # Taranto logo
    └── testfiles/         # Sample data (legacy)
```

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 + TypeScript + React 18
- **Authentication**: NextAuth.js v4.24.11 with JWT sessions
- **Database**: MongoDB 6.18+ with native driver
- **Styling**: Tailwind CSS + shadcn/ui components + **Taranto UI Branding**
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

## 🎨 UI Components & Branding

Built with modern, accessible components and Taranto brand identity:

### **Taranto UI Design System**
- **Brand Colors**: Turquoise (#00ABC8) primary, Green (#80BC00), Orange (#f05423), Red (#dc2626), Grey (#4d4d4f)
- **Typography**: Poppins for headings, Roboto for body text
- **Consistent Styling**: Custom utility classes for buttons, inputs, cards, and badges
- **Color-coded Status**: Visual status indicators using brand colors throughout the application
- **Professional Aesthetics**: Clean, modern interface aligned with Taranto brand guidelines

### **Component Features**
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Interactive Charts**: Hover states and clickable elements with Taranto color scheme
- **Modal Dialogs**: Overlay interfaces that preserve context
- **Form Controls**: Accessible dropdowns, inputs, and buttons with Taranto styling
- **Loading States**: Smooth loading indicators and skeleton screens
- **Toast Notifications**: User feedback for actions and errors
- **Branded Badges**: Status, priority, and SLA badges with Taranto colors

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

**v2.1 Release** - January 2025 | Taranto Service Desk Management System with Incident Management & Customer Portal

## 🔄 Version 2.1 Release Notes (Latest Update)

### 🎨 **Taranto UI Branding (v2.1)**
- **Complete Brand Identity**: Full application rebrand with Taranto color scheme and typography
- **Custom Design System**: Taranto-specific utility classes for consistent styling
- **Color Palette**: Turquoise, Green, Orange, Red, and Grey brand colors throughout
- **Typography Update**: Poppins for headings, Roboto for body text via Google Fonts
- **Status Color Coding**: Consistent color-coded statuses, priorities, and SLA indicators
- **Customer Portal Branding**: Full Taranto styling applied to customer-facing portal
- **Incident Management**: Updated dashboard with Taranto colors and components
- **Login Experience**: Branded login pages with Taranto gradient backgrounds
- **Sidebar Navigation**: Turquoise/green gradient header with brand colors for menu items

### 🎯 **Customer Portal Features (v2.1)**
- **Password Authentication**: Secure login system for portal users
- **Incident Viewing**: Customers can view their incidents with full details
- **Comment System**: Customers can add comments and updates to their tickets
- **Status Tracking**: Real-time status updates with color-coded badges
- **Company Isolation**: Secure data isolation per company
- **Contact Management**: Portal access control via contact records
- **Responsive Design**: Mobile-friendly customer portal interface

### 🎫 **Incident Management System (v2.1)**
- **Full CRUD Operations**: Create, read, update, and delete incidents
- **SLA Tracking**: Automated SLA monitoring with pause/resume on hold status
- **Company Management**: Multi-company support with SLA definitions per company
- **Contact Integration**: Link incidents to company contacts
- **Status Workflow**: Complete incident lifecycle management
- **Priority & Urgency Matrix**: Flexible priority calculation
- **Internal Notes**: Private notes visible only to staff
- **Customer Updates**: Public updates visible in customer portal
- **Saved Queries**: Save and share common filter combinations

## 🔄 Version 2.0 Release Notes (Previous Major Update)

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