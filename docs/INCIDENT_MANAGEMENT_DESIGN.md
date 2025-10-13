# Incident Management Module - Technical Design Document

**Version:** 1.0
**Date:** October 2025
**Author:** Service Desk Tools Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema](#database-schema)
4. [API Specifications](#api-specifications)
5. [User Interface Design](#user-interface-design)
6. [Customer Portal](#customer-portal)
7. [Security & Authentication](#security--authentication)
8. [SLA Management](#sla-management)
9. [Integration Points](#integration-points)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Testing Strategy](#testing-strategy)

---

## 1. Executive Summary

### Purpose
The Incident Management module provides a comprehensive solution for tracking and managing customer incidents with built-in SLA monitoring, multi-company support, and a customer-facing portal for self-service incident submission and tracking.

### Key Features
- **Multi-Company Support**: Isolated incident tracking per company with customizable SLA tiers
- **Customer Portal**: Public-facing web interface for customers to raise and track incidents
- **SLA Management**: Automated SLA tracking, escalation alerts, and compliance reporting
- **Priority Matrix**: Urgency × Impact calculation for intelligent prioritization
- **Dual Note System**: Internal notes (staff only) and customer-facing updates
- **Integration**: Links to Freshdesk tickets, JIRA issues, and CSV import capability
- **Analytics**: Real-time dashboards, trend analysis, and compliance reports

### Success Criteria
- Seamless integration with existing Service Desk Tools Hub
- Customer portal with < 2 second load time
- 99.9% SLA calculation accuracy
- Support for 100+ companies with isolated data access
- Mobile-responsive design for both internal and customer portals

---

## 2. Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Service Desk Tools Hub                    │
│                         (app/tools)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┬──────────────────────┐
        │                               │                      │
┌───────▼────────┐            ┌─────────▼────────┐   ┌────────▼────────┐
│ Internal Widget│            │  Full Page App   │   │ Customer Portal │
│   (Component)  │            │   (/incident-    │   │  (/customer-    │
│                │            │    management)   │   │   portal)       │
└───────┬────────┘            └─────────┬────────┘   └────────┬────────┘
        │                               │                      │
        └───────────────┬───────────────┴──────────────────────┘
                        │
                ┌───────▼────────┐
                │   API Routes   │
                │   (/api/       │
                │   incident-    │
                │   management)  │
                └───────┬────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌─────────▼────────┐
│ MongoDB Models │            │  External APIs   │
│  - Incidents   │            │  - Freshdesk     │
│  - Companies   │            │  - JIRA          │
│  - Portal Users│            │  - Email SMTP    │
└────────────────┘            └──────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Backend**: Next.js API Routes + MongoDB
- **Authentication**:
  - Internal: NextAuth.js (existing)
  - Customer Portal: JWT tokens or magic links
- **UI Components**: Tailwind CSS + shadcn/ui
- **Database**: MongoDB 6.18+
- **Email**: Nodemailer (for notifications)

### Design Patterns
Following existing patterns from Priority Tracker and CSI Tracker:
- MongoDB models with ObjectId references
- RESTful API routes with session authentication
- React component composition with shadcn/ui
- Modal-based detail views
- Real-time stats calculations
- Comment threading system

---

## 3. Database Schema

### 3.1 Collections

#### `incidents` Collection

```typescript
interface Incident {
  _id: ObjectId
  ref: string                      // Auto-generated: "INC-2025-0001"

  // Core Details
  subject: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority       // Auto-calculated from urgency × impact
  urgency: UrgencyLevel            // Low | Medium | High | Critical
  impact: ImpactLevel              // Low | Medium | High | Critical
  category: string                 // e.g., "Technical", "Access", "Performance"
  subcategory?: string

  // Company & User Info
  companyId: ObjectId              // Reference to companies collection
  companyName: string              // Denormalized for performance
  reportedById: ObjectId           // Portal user or internal user
  reportedByName: string
  reportedByEmail: string
  reportedByType: 'customer' | 'internal'

  // Assignment
  assignedToId?: ObjectId          // Internal user
  assignedToName?: string
  teamId?: ObjectId                // For team-based routing
  teamName?: string

  // SLA Tracking
  slaId: ObjectId                  // Reference to company's SLA definition
  slaName: string                  // e.g., "Gold SLA", "Standard SLA"
  dueByTime: Date                  // Calculated based on SLA + priority
  responseByTime: Date             // First response deadline
  slaStatus: 'Within SLA' | 'At Risk' | 'Breached'
  breachReason?: string            // If breached, reason for record

  // Resolution
  resolutionNotes?: string         // Customer-facing resolution
  internalResolutionNotes?: string // Internal only
  resolvedAt?: Date
  resolvedById?: ObjectId
  resolvedByName?: string
  closedAt?: Date
  closedById?: ObjectId
  closedByName?: string

  // Integrations
  linkedFreshdeskTickets: string[]
  linkedJiraTickets: string[]
  linkedIncidentRefs: string[]     // Related incidents

  // Customer Communication
  customerUpdates: CustomerUpdate[]
  internalNotes: InternalNote[]

  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById: ObjectId
  createdByName: string

  // Attachments (future enhancement)
  attachmentIds?: ObjectId[]

  // Analytics
  viewCount: number
  reopenCount: number
  escalationLevel: number          // 0 = none, 1 = L1, 2 = L2, etc.
}

enum IncidentStatus {
  New = 'New',
  Acknowledged = 'Acknowledged',
  InProgress = 'In Progress',
  OnHold = 'On Hold',
  AwaitingCustomer = 'Awaiting Customer',
  Resolved = 'Resolved',
  Closed = 'Closed',
  Cancelled = 'Cancelled'
}

enum IncidentPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

enum UrgencyLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

enum ImpactLevel {
  Low = 'Low',          // Single user
  Medium = 'Medium',    // Multiple users
  High = 'High',        // Department/location
  Critical = 'Critical' // Company-wide/business-critical
}

interface CustomerUpdate {
  _id: ObjectId
  content: string
  authorId: ObjectId
  authorName: string
  authorType: 'customer' | 'agent'
  createdAt: Date
  visibleToCustomer: boolean
  emailSent: boolean
}

interface InternalNote {
  _id: ObjectId
  content: string
  authorId: ObjectId
  authorName: string
  createdAt: Date
  noteType: 'standard' | 'escalation' | 'resolution'
}
```

#### `companies` Collection

```typescript
interface Company {
  _id: ObjectId

  // Basic Info
  name: string
  domain: string                   // Primary email domain
  additionalDomains: string[]      // Additional verified domains
  companyCode: string              // Unique identifier

  // Contact Info
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  billingContactEmail?: string

  // SLA Configuration
  slaId: ObjectId                  // Reference to SLA tier
  slaName: string                  // Denormalized
  customSlaOverrides?: {           // Company-specific SLA overrides
    criticalResponseHours?: number
    criticalResolutionHours?: number
    highResponseHours?: number
    highResolutionHours?: number
    mediumResponseHours?: number
    mediumResolutionHours?: number
    lowResponseHours?: number
    lowResolutionHours?: number
  }
  businessHours?: {                // For SLA calculations
    timezone: string               // e.g., "Europe/London"
    monday: { start: string, end: string }
    tuesday: { start: string, end: string }
    wednesday: { start: string, end: string }
    thursday: { start: string, end: string }
    friday: { start: string, end: string }
    saturday?: { start: string, end: string }
    sunday?: { start: string, end: string }
    holidays: Date[]               // Company-specific holidays
  }

  // Portal Settings
  portalEnabled: boolean
  portalBranding?: {
    logoUrl?: string
    primaryColor?: string
    companyName?: string           // Display name for portal
  }
  allowedPortalUsers: string[]     // Email patterns: ["*@company.com"]

  // Features
  allowAttachments: boolean
  maxAttachmentSize: number        // In MB
  requireApproval: boolean         // Incidents need approval before assignment
  autoAssignmentEnabled: boolean
  defaultAssigneeId?: ObjectId
  defaultTeamId?: ObjectId

  // Analytics
  totalIncidents: number
  openIncidents: number
  slaComplianceRate: number
  avgResolutionTimeHours: number

  // Status
  active: boolean
  suspendedReason?: string

  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById: ObjectId
  createdByName: string
}
```

#### `sla_definitions` Collection

```typescript
interface SLADefinition {
  _id: ObjectId

  // Basic Info
  name: string                     // "Gold", "Silver", "Bronze", "Standard"
  description: string
  tier: number                     // 1 = highest, 5 = lowest

  // Response Time SLAs (in hours)
  criticalResponseHours: number    // e.g., 1
  highResponseHours: number        // e.g., 4
  mediumResponseHours: number      // e.g., 8
  lowResponseHours: number         // e.g., 24

  // Resolution Time SLAs (in hours)
  criticalResolutionHours: number  // e.g., 4
  highResolutionHours: number      // e.g., 24
  mediumResolutionHours: number    // e.g., 72
  lowResolutionHours: number       // e.g., 168

  // Business Hours
  useBusinessHoursOnly: boolean    // If true, only count business hours
  defaultBusinessHours: {
    timezone: string
    monday: { start: string, end: string }
    tuesday: { start: string, end: string }
    wednesday: { start: string, end: string }
    thursday: { start: string, end: string }
    friday: { start: string, end: string }
    saturday?: { start: string, end: string }
    sunday?: { start: string, end: string }
  }

  // Features
  autoEscalation: boolean
  escalationThresholdPercent: number  // e.g., 80% of SLA = escalate
  notificationRules: {
    notifyAt50Percent: boolean
    notifyAt80Percent: boolean
    notifyOnBreach: boolean
    emailAddresses: string[]
  }

  // Pricing (optional, for future billing)
  monthlyCost?: number
  perIncidentCost?: number

  // Status
  active: boolean
  isDefault: boolean               // Default for new companies

  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

#### `portal_users` Collection

```typescript
interface PortalUser {
  _id: ObjectId

  // Basic Info
  name: string
  email: string
  phone?: string
  jobTitle?: string

  // Company Association
  companyId: ObjectId
  companyName: string              // Denormalized

  // Authentication
  passwordHash?: string            // If using password auth
  magicLinkToken?: string          // If using magic link auth
  magicLinkExpiry?: Date
  lastLoginAt?: Date
  loginCount: number

  // Permissions
  role: 'user' | 'company_admin'   // Admin can manage other portal users
  canCreateIncidents: boolean
  canViewAllCompanyIncidents: boolean  // Or only their own
  canAddComments: boolean

  // Preferences
  emailNotifications: {
    onIncidentCreated: boolean
    onStatusChange: boolean
    onNewComment: boolean
    onResolution: boolean
  }
  language: string                 // "en", "fr", etc.
  timezone: string

  // Status
  active: boolean
  verified: boolean                // Email verified
  verificationToken?: string
  verificationExpiry?: Date

  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById?: ObjectId           // Who created this portal user
  createdByName?: string
}
```

#### `incident_templates` Collection (Optional)

```typescript
interface IncidentTemplate {
  _id: ObjectId
  name: string
  description: string
  category: string
  subcategory?: string
  defaultUrgency: UrgencyLevel
  defaultImpact: ImpactLevel
  templateFields: {
    fieldName: string
    fieldType: 'text' | 'textarea' | 'select' | 'multiselect'
    required: boolean
    options?: string[]
    defaultValue?: string
  }[]
  companyIds: ObjectId[]           // Which companies can use this template
  availableInPortal: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}
```

### 3.2 Indexes

```javascript
// incidents collection
db.incidents.createIndex({ ref: 1 }, { unique: true })
db.incidents.createIndex({ companyId: 1, status: 1 })
db.incidents.createIndex({ assignedToId: 1, status: 1 })
db.incidents.createIndex({ reportedById: 1 })
db.incidents.createIndex({ dueByTime: 1, status: 1 })
db.incidents.createIndex({ createdAt: -1 })
db.incidents.createIndex({ "linkedFreshdeskTickets": 1 })
db.incidents.createIndex({ "linkedJiraTickets": 1 })

// companies collection
db.companies.createIndex({ companyCode: 1 }, { unique: true })
db.companies.createIndex({ domain: 1 })
db.companies.createIndex({ name: 1 })
db.companies.createIndex({ active: 1 })

// portal_users collection
db.portal_users.createIndex({ email: 1 }, { unique: true })
db.portal_users.createIndex({ companyId: 1, active: 1 })
db.portal_users.createIndex({ magicLinkToken: 1 })
db.portal_users.createIndex({ verificationToken: 1 })

// sla_definitions collection
db.sla_definitions.createIndex({ name: 1 })
db.sla_definitions.createIndex({ active: 1, isDefault: 1 })
```

---

## 4. API Specifications

### 4.1 Internal API Routes (Authenticated)

**Base Path:** `/api/incident-management`

#### Incidents

```typescript
// GET /api/incident-management/incidents
// Get all incidents (with filtering)
interface GetIncidentsQuery {
  companyId?: string
  status?: IncidentStatus | IncidentStatus[]
  priority?: IncidentPriority | IncidentPriority[]
  assignedToId?: string
  reportedById?: string
  fromDate?: string
  toDate?: string
  search?: string              // Search in subject/description
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'dueByTime' | 'priority'
  sortOrder?: 'asc' | 'desc'
}

Response: {
  incidents: Incident[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// POST /api/incident-management/incidents
// Create new incident
interface CreateIncidentRequest {
  subject: string
  description: string
  companyId: string
  reportedByEmail?: string      // If creating on behalf of customer
  urgency: UrgencyLevel
  impact: ImpactLevel
  category: string
  subcategory?: string
  assignedToId?: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
}

Response: {
  incident: Incident
}

// GET /api/incident-management/incidents/:id
// Get incident details
Response: {
  incident: Incident
}

// PUT /api/incident-management/incidents/:id
// Update incident
interface UpdateIncidentRequest {
  subject?: string
  description?: string
  status?: IncidentStatus
  urgency?: UrgencyLevel
  impact?: ImpactLevel
  category?: string
  subcategory?: string
  assignedToId?: string
  resolutionNotes?: string
  internalResolutionNotes?: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
}

Response: {
  incident: Incident
}

// DELETE /api/incident-management/incidents/:id
// Delete (soft delete) incident
Response: {
  success: boolean
}

// POST /api/incident-management/incidents/:id/comments
// Add comment to incident
interface AddCommentRequest {
  content: string
  visibleToCustomer: boolean
  noteType?: 'standard' | 'escalation' | 'resolution'
}

Response: {
  incident: Incident
}

// POST /api/incident-management/incidents/:id/reopen
// Reopen a closed/resolved incident
Response: {
  incident: Incident
}

// POST /api/incident-management/incidents/:id/escalate
// Manually escalate incident
interface EscalateRequest {
  reason: string
  escalateTo?: string          // User ID or team ID
}

Response: {
  incident: Incident
}

// GET /api/incident-management/incidents/stats
// Get statistics
interface StatsQuery {
  companyId?: string
  fromDate?: string
  toDate?: string
}

Response: {
  total: number
  byStatus: Record<IncidentStatus, number>
  byPriority: Record<IncidentPriority, number>
  byCompany: Array<{ companyName: string, count: number }>
  byAssignee: Array<{ assigneeName: string, count: number }>
  slaCompliance: {
    withinSLA: number
    atRisk: number
    breached: number
    complianceRate: number
  }
  avgResolutionTimeHours: number
  avgResponseTimeHours: number
}

// POST /api/incident-management/incidents/bulk-assign
// Bulk assign incidents
interface BulkAssignRequest {
  incidentIds: string[]
  assignedToId: string
}

Response: {
  updated: number
  success: boolean
}
```

#### Companies

```typescript
// GET /api/incident-management/companies
// Get all companies
interface GetCompaniesQuery {
  active?: boolean
  search?: string
  page?: number
  limit?: number
}

Response: {
  companies: Company[]
  pagination: { total: number, page: number, limit: number, totalPages: number }
}

// POST /api/incident-management/companies
// Create company
interface CreateCompanyRequest {
  name: string
  domain: string
  additionalDomains?: string[]
  companyCode: string
  slaId: string
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  portalEnabled: boolean
  businessHours?: Company['businessHours']
}

Response: {
  company: Company
}

// GET /api/incident-management/companies/:id
// Get company details
Response: {
  company: Company
  recentIncidents: Incident[]
}

// PUT /api/incident-management/companies/:id
// Update company
interface UpdateCompanyRequest {
  // All fields from CreateCompanyRequest are optional
  active?: boolean
  suspendedReason?: string
}

Response: {
  company: Company
}

// DELETE /api/incident-management/companies/:id
// Delete company (soft delete, marks as inactive)
Response: {
  success: boolean
}

// GET /api/incident-management/companies/:id/sla-report
// Get SLA compliance report for company
interface SLAReportQuery {
  fromDate?: string
  toDate?: string
}

Response: {
  companyName: string
  period: { from: Date, to: Date }
  totalIncidents: number
  slaCompliance: {
    withinSLA: number
    breached: number
    complianceRate: number
  }
  byPriority: Record<IncidentPriority, {
    total: number
    avgResolutionHours: number
    slaBreached: number
  }>
  breachedIncidents: Array<{
    ref: string
    subject: string
    priority: IncidentPriority
    breachDurationHours: number
  }>
}
```

#### SLA Definitions

```typescript
// GET /api/incident-management/sla-definitions
// Get all SLA definitions
Response: {
  slaDefinitions: SLADefinition[]
}

// POST /api/incident-management/sla-definitions
// Create SLA definition
interface CreateSLARequest {
  name: string
  description: string
  tier: number
  criticalResponseHours: number
  highResponseHours: number
  mediumResponseHours: number
  lowResponseHours: number
  criticalResolutionHours: number
  highResolutionHours: number
  mediumResolutionHours: number
  lowResolutionHours: number
  useBusinessHoursOnly: boolean
  defaultBusinessHours?: SLADefinition['defaultBusinessHours']
  autoEscalation: boolean
  escalationThresholdPercent: number
}

Response: {
  slaDefinition: SLADefinition
}

// PUT /api/incident-management/sla-definitions/:id
// Update SLA definition
Response: {
  slaDefinition: SLADefinition
}

// DELETE /api/incident-management/sla-definitions/:id
// Delete SLA definition (only if no companies use it)
Response: {
  success: boolean
}
```

#### Portal Users

```typescript
// GET /api/incident-management/portal-users
// Get portal users
interface GetPortalUsersQuery {
  companyId?: string
  active?: boolean
  search?: string
}

Response: {
  portalUsers: PortalUser[]
}

// POST /api/incident-management/portal-users
// Create portal user
interface CreatePortalUserRequest {
  name: string
  email: string
  phone?: string
  companyId: string
  role: 'user' | 'company_admin'
  sendWelcomeEmail: boolean
}

Response: {
  portalUser: PortalUser
  magicLink?: string           // If sendWelcomeEmail is true
}

// PUT /api/incident-management/portal-users/:id
// Update portal user
Response: {
  portalUser: PortalUser
}

// DELETE /api/incident-management/portal-users/:id
// Delete portal user (soft delete)
Response: {
  success: boolean
}

// POST /api/incident-management/portal-users/:id/reset-password
// Send password reset link
Response: {
  success: boolean
  message: string
}
```

### 4.2 Customer Portal API Routes (Public/Token Auth)

**Base Path:** `/api/customer-portal`

```typescript
// POST /api/customer-portal/auth/login
// Login with email (send magic link)
interface LoginRequest {
  email: string
}

Response: {
  success: boolean
  message: string              // "Magic link sent to your email"
}

// POST /api/customer-portal/auth/verify
// Verify magic link token
interface VerifyRequest {
  token: string
}

Response: {
  success: boolean
  token: string                // JWT token for subsequent requests
  user: {
    id: string
    name: string
    email: string
    companyName: string
  }
}

// GET /api/customer-portal/incidents
// Get customer's incidents (token auth required)
interface GetCustomerIncidentsQuery {
  status?: IncidentStatus[]
  page?: number
  limit?: number
}

Response: {
  incidents: Array<{
    ref: string
    subject: string
    status: IncidentStatus
    priority: IncidentPriority
    createdAt: Date
    dueByTime: Date
    slaStatus: string
    lastUpdateAt: Date
    hasUnreadUpdates: boolean
  }>
  pagination: { total: number, page: number, limit: number, totalPages: number }
}

// GET /api/customer-portal/incidents/:ref
// Get incident details by reference (e.g., "INC-2025-0001")
Response: {
  incident: {
    ref: string
    subject: string
    description: string
    status: IncidentStatus
    priority: IncidentPriority
    category: string
    createdAt: Date
    updatedAt: Date
    dueByTime: Date
    slaStatus: string
    resolutionNotes?: string
    customerUpdates: CustomerUpdate[]  // Only customer-visible updates
  }
}

// POST /api/customer-portal/incidents
// Create new incident from portal
interface CreatePortalIncidentRequest {
  subject: string
  description: string
  urgency: UrgencyLevel
  impact: ImpactLevel
  category: string
  contactPhone?: string
}

Response: {
  incident: {
    ref: string
    subject: string
    status: IncidentStatus
    createdAt: Date
  }
  message: string              // "Incident created successfully"
}

// POST /api/customer-portal/incidents/:ref/comments
// Add comment to incident
interface AddPortalCommentRequest {
  content: string
}

Response: {
  success: boolean
  comment: CustomerUpdate
}

// GET /api/customer-portal/profile
// Get customer profile
Response: {
  user: PortalUser
  company: {
    name: string
    slaName: string
  }
}

// PUT /api/customer-portal/profile
// Update profile
interface UpdatePortalProfileRequest {
  name?: string
  phone?: string
  emailNotifications?: PortalUser['emailNotifications']
}

Response: {
  user: PortalUser
}
```

---

## 5. User Interface Design

### 5.1 Internal Widget (`components/incident-management-widget.tsx`)

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Incident Management                               [+ New]    │
├─────────────────────────────────────────────────────────────┤
│ [Overview] [All Incidents] [Companies] [SLA Config]         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  OVERVIEW TAB:                                               │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │  Total   │   Open   │ At Risk  │ Breached │   SLA    │  │
│  │   156    │    42    │    8     │    3     │  94.2%   │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                              │
│  High Priority Incidents                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ INC-2025-0042                      [Critical] [Open]  │  │
│  │ Database connection timeout                           │  │
│  │ Acme Corp • John Smith • Due in 2h                   │  │
│  │                                            [View >]   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ INC-2025-0038                         [High] [Open]  │  │
│  │ Users unable to login                                │  │
│  │ Tech Solutions • Sarah Jones • Due in 6h            │  │
│  │                                            [View >]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  SLA At Risk                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ INC-2025-0035 • Print server offline • 85% of SLA   │  │
│  │ INC-2025-0029 • Report not generating • 92% of SLA  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### All Incidents Tab
```
┌─────────────────────────────────────────────────────────────┐
│ Filters: [Company ▼] [Status ▼] [Priority ▼] [Assignee ▼] │
│          [Date Range] [Search...]                           │
├─────────────────────────────────────────────────────────────┤
│ Ref       │Subject           │Company│Priority│Status│SLA  │
├───────────┼──────────────────┼───────┼────────┼──────┼─────┤
│INC-2025-42│Database timeout  │Acme   │Critical│Open  │🔴At │
│INC-2025-41│Email not sending │TechCo │High    │InProg│🟢OK │
│INC-2025-40│Slow performance  │WidgetA│Medium  │Ack   │🟢OK │
│...                                                          │
└─────────────────────────────────────────────────────────────┘
```

#### Incident Detail Modal
```
┌─────────────────────────────────────────────────────────────┐
│ INC-2025-0042                             [Status: Open ▼] │
│ Database connection timeout - Acme Corp                    │
├─────────────────────────────────────────────────────────────┤
│ Details                                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Description:                                            ││
│ │ Users are experiencing intermittent database connection ││
│ │ timeouts when accessing the customer portal...          ││
│ │                                                          ││
│ │ Priority: Critical  Urgency: High  Impact: High        ││
│ │ Category: Technical > Database                          ││
│ │ Reported: Oct 13, 2025 10:30 AM by john@acme.com      ││
│ │ Assigned: Sarah Smith                                   ││
│ │ Due By: Oct 13, 2025 2:30 PM (in 2h 15m) 🔴           ││
│ │ SLA: Gold SLA (4h resolution)                          ││
│ │                                                          ││
│ │ Linked Tickets:                                         ││
│ │ [FD: 12345] [JIRA: SUP-789]                           ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [Customer Updates] [Internal Notes] [History]              │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Sarah Smith (Agent) • 15 minutes ago                   ││
│ │ We've identified the issue as a connection pool        ││
│ │ exhaustion. Working on increasing the pool size.       ││
│ │ ☑ Visible to customer                                  ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ John Doe (Customer) • 30 minutes ago                   ││
│ │ This is affecting all our users, very urgent.          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Add Update:                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Write your update here...]                            ││
│ │                                                          ││
│ └─────────────────────────────────────────────────────────┘│
│ ☑ Visible to customer  ☐ Internal note only               │
│                                                             │
│ [Escalate] [Reassign] [Link Ticket] [Close]      [Update] │
└─────────────────────────────────────────────────────────────┘
```

#### Companies Tab
```
┌─────────────────────────────────────────────────────────────┐
│ Companies                                       [+ Add New]  │
├─────────────────────────────────────────────────────────────┤
│ [Search companies...]                    [Active ▼] [All ▼] │
├─────────────────────────────────────────────────────────────┤
│ Company      │Open│SLA │SLA Tier│Portal│Contact          │ │
├──────────────┼────┼────┼────────┼──────┼─────────────────┤ │
│ Acme Corp    │ 8  │94% │Gold    │ ✓    │john@acme.com    │ │
│ Tech Solutions│ 3  │98% │Standard│ ✓    │admin@tech.com   │ │
│ Widget Corp  │ 12 │87% │Silver  │ ✗    │support@widget.co│ │
│...                                                          │
└─────────────────────────────────────────────────────────────┘
```

#### SLA Configuration Tab
```
┌─────────────────────────────────────────────────────────────┐
│ SLA Definitions                                [+ New SLA]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Gold SLA                                         [Edit] [▶] │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Response Times:                                         ││
│ │ Critical: 1h  High: 4h  Medium: 8h  Low: 24h          ││
│ │                                                          ││
│ │ Resolution Times:                                       ││
│ │ Critical: 4h  High: 24h  Medium: 72h  Low: 168h       ││
│ │                                                          ││
│ │ Business Hours: Mon-Fri 9:00-17:00 (GMT)              ││
│ │ Auto-escalation: ✓ at 80% of SLA                      ││
│ │                                                          ││
│ │ Companies: 15 companies • 42 active incidents          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ Standard SLA                                     [Edit] [▶] │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ... (collapsed)                                         ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Full Page Application (`app/incident-management/page.tsx`)

Similar to the widget but with:
- Full-screen layout
- Enhanced filtering and search
- Bulk operations toolbar
- Advanced analytics dashboard
- CSV import/export functionality
- Company management interface
- Portal user management

### 5.3 Tools Hub Widget Card

```
┌─────────────────────────────────────────────────────┐
│              🎫 Incident Management                  │
│                                                     │
│  Comprehensive incident tracking with SLA           │
│  monitoring and customer portal access              │
│                                                     │
│  [Open Incident Management]                         │
└─────────────────────────────────────────────────────┘
```

---

## 6. Customer Portal

### 6.1 Portal Pages

#### Landing/Login Page (`/customer-portal`)

```
┌─────────────────────────────────────────────────────────────┐
│                    [Company Logo]                           │
│                                                             │
│              Customer Support Portal                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  Enter your email to access your incidents          │  │
│  │                                                      │  │
│  │  Email: [____________________________]               │  │
│  │                                                      │  │
│  │         [Send Magic Link]                           │  │
│  │                                                      │  │
│  │  We'll send you a secure link to access your       │  │
│  │  incidents. No password required.                   │  │
│  │                                                      │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Need help? Contact your IT support team                   │
└─────────────────────────────────────────────────────────────┘
```

#### Dashboard (`/customer-portal/dashboard`)

```
┌─────────────────────────────────────────────────────────────┐
│ [Company Logo]  John Doe • Acme Corp          [Logout]      │
├─────────────────────────────────────────────────────────────┤
│ [My Incidents] [Create New] [Profile]                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  My Open Incidents                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ INC-2025-0042                      Critical • Open    │  │
│  │ Database connection timeout                           │  │
│  │ Created: Oct 13, 10:30 AM                            │  │
│  │ Status: Being investigated by support team           │  │
│  │ Due: Oct 13, 2:30 PM                                 │  │
│  │                                            [View >]   │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ INC-2025-0038                            High • Open  │  │
│  │ Users unable to login                                │  │
│  │ Created: Oct 12, 3:45 PM                             │  │
│  │ Status: Waiting for your response                    │  │
│  │ Due: Oct 13, 3:45 PM                                 │  │
│  │                                            [View >]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [+ Create New Incident]                                    │
│                                                              │
│  Recently Resolved                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ INC-2025-0035 • Print server offline • Resolved      │  │
│  │ INC-2025-0029 • Report not generating • Resolved     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Incident Detail Page (`/customer-portal/incident/[ref]`)

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back to My Incidents]                        [Logout]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  INC-2025-0042                                              │
│  Database connection timeout                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Status: Open • Priority: Critical                   │   │
│  │ Created: Oct 13, 2025 10:30 AM                      │   │
│  │ Expected Resolution: Oct 13, 2025 2:30 PM           │   │
│  │                                                      │   │
│  │ Description:                                         │   │
│  │ Users are experiencing intermittent database        │   │
│  │ connection timeouts when accessing the customer     │   │
│  │ portal. This is affecting approximately 50 users.   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Updates                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Support Team • 15 minutes ago                       │   │
│  │ We've identified the issue as a connection pool     │   │
│  │ exhaustion. We're working on increasing the pool    │   │
│  │ size and expect to have this resolved within the    │   │
│  │ next hour.                                           │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ You • 30 minutes ago                                │   │
│  │ This is affecting all our users, very urgent. Please│   │
│  │ prioritize.                                          │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ System • 45 minutes ago                             │   │
│  │ Incident created and assigned to support team.      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Add Comment                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [Type your message here...]                         │   │
│  │                                                      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Send Update]                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Create Incident Page (`/customer-portal/create`)

```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]                                        [Logout]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Create New Incident                                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Subject *                                            │   │
│  │ [_____________________________________________]      │   │
│  │                                                      │   │
│  │ Description *                                        │   │
│  │ [_____________________________________________]      │   │
│  │ [_____________________________________________]      │   │
│  │ [_____________________________________________]      │   │
│  │ [_____________________________________________]      │   │
│  │                                                      │   │
│  │ Category *                                           │   │
│  │ [Technical ▼]                                        │   │
│  │                                                      │   │
│  │ How urgent is this? *                                │   │
│  │ ○ Low - Can wait                                     │   │
│  │ ○ Medium - Noticeable issue                          │   │
│  │ ● High - Impacting work                              │   │
│  │ ○ Critical - Business stopped                        │   │
│  │                                                      │   │
│  │ How many users are affected? *                       │   │
│  │ ○ Just me                                            │   │
│  │ ● Multiple users in my team                          │   │
│  │ ○ Entire department                                  │   │
│  │ ○ Company-wide                                       │   │
│  │                                                      │   │
│  │ Contact Phone (optional)                             │   │
│  │ [_____________________________________________]      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Cancel]                           [Create Incident]       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Portal Features

- **Magic Link Authentication**: No passwords, secure token-based login
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Incidents update automatically when staff respond
- **Email Notifications**: Optional notifications for status changes
- **Multi-language Support**: Configurable language preferences
- **Company Branding**: Custom logo and colors per company
- **Mobile App Ready**: API-first design allows future mobile app

---

## 7. Security & Authentication

### 7.1 Internal Users (NextAuth.js)

- **Existing System**: Use current NextAuth.js authentication
- **Permissions**: Add new permission `incidentManagement: boolean` to User model
- **Roles**:
  - **Admin**: Full access, company management, SLA configuration
  - **Agent**: Create, view, update incidents; no company/SLA management
  - **Manager**: View-only access to reports and analytics

### 7.2 Portal Users (Token-based)

#### Magic Link Flow
```
1. User enters email
2. System validates email belongs to registered company domain
3. Generate secure token (UUID v4 + timestamp)
4. Send email with magic link: /customer-portal/auth/verify?token=xxx
5. User clicks link
6. System verifies token (valid, not expired, not used)
7. Generate JWT token with 24-hour expiry
8. Set secure HTTP-only cookie
9. Redirect to dashboard
```

#### JWT Token Structure
```javascript
{
  userId: "portal_user_id",
  companyId: "company_id",
  email: "user@company.com",
  role: "user",
  exp: timestamp,
  iat: timestamp
}
```

#### Security Measures
- **Rate Limiting**: 5 magic link requests per hour per email
- **Token Expiry**: Magic links valid for 15 minutes
- **JWT Expiry**: 24 hours, refresh on activity
- **HTTPS Only**: All customer portal traffic
- **CORS**: Restricted to known domains
- **SQL Injection**: Use MongoDB parameterized queries
- **XSS Protection**: Sanitize all user inputs
- **CSRF**: CSRF tokens for state-changing operations
- **Data Isolation**: Strict company-level data separation

### 7.3 Data Access Control

#### Internal Users
```typescript
// Agents can only see incidents assigned to them or their team
// Managers/Admins can see all incidents

function canViewIncident(user: InternalUser, incident: Incident): boolean {
  if (user.permissions.admin) return true
  if (user.role === 'Manager') return true
  if (incident.assignedToId?.toString() === user.id) return true
  if (incident.teamId && user.teamIds?.includes(incident.teamId)) return true
  return false
}
```

#### Portal Users
```typescript
// Portal users can only see their company's incidents
// If canViewAllCompanyIncidents is false, only see their own

function canViewIncident(portalUser: PortalUser, incident: Incident): boolean {
  if (incident.companyId.toString() !== portalUser.companyId.toString()) {
    return false
  }
  if (portalUser.canViewAllCompanyIncidents) return true
  return incident.reportedById.toString() === portalUser._id.toString()
}
```

---

## 8. SLA Management

### 8.1 SLA Calculation Algorithm

```typescript
interface SLACalculationParams {
  incident: Incident
  slaDefinition: SLADefinition
  company: Company
  businessHours: BusinessHours
}

function calculateSLADueTime(params: SLACalculationParams): Date {
  const { incident, slaDefinition, company, businessHours } = params

  // 1. Determine SLA hours based on priority
  let slaHours: number
  switch (incident.priority) {
    case 'Critical':
      slaHours = company.customSlaOverrides?.criticalResolutionHours
                 ?? slaDefinition.criticalResolutionHours
      break
    case 'High':
      slaHours = company.customSlaOverrides?.highResolutionHours
                 ?? slaDefinition.highResolutionHours
      break
    case 'Medium':
      slaHours = company.customSlaOverrides?.mediumResolutionHours
                 ?? slaDefinition.mediumResolutionHours
      break
    case 'Low':
      slaHours = company.customSlaOverrides?.lowResolutionHours
                 ?? slaDefinition.lowResolutionHours
      break
  }

  // 2. Calculate due time
  const startTime = incident.createdAt

  if (slaDefinition.useBusinessHoursOnly) {
    return calculateBusinessHoursDueTime(
      startTime,
      slaHours,
      businessHours
    )
  } else {
    // Simple calendar time
    return new Date(startTime.getTime() + (slaHours * 60 * 60 * 1000))
  }
}

function calculateBusinessHoursDueTime(
  startTime: Date,
  slaHours: number,
  businessHours: BusinessHours
): Date {
  let remainingMinutes = slaHours * 60
  let currentTime = new Date(startTime)

  while (remainingMinutes > 0) {
    // Skip to next business period if currently outside business hours
    if (!isBusinessHour(currentTime, businessHours)) {
      currentTime = nextBusinessHourStart(currentTime, businessHours)
      continue
    }

    // Calculate minutes until end of current business period
    const businessPeriodEnd = businessHourEnd(currentTime, businessHours)
    const minutesUntilEnd = (businessPeriodEnd.getTime() - currentTime.getTime()) / 60000

    if (minutesUntilEnd >= remainingMinutes) {
      // SLA expires within current business period
      currentTime = new Date(currentTime.getTime() + (remainingMinutes * 60000))
      remainingMinutes = 0
    } else {
      // Continue to next business period
      remainingMinutes -= minutesUntilEnd
      currentTime = nextBusinessHourStart(businessPeriodEnd, businessHours)
    }
  }

  return currentTime
}

function determineSLAStatus(incident: Incident): SLAStatus {
  if (incident.status === 'Resolved' || incident.status === 'Closed') {
    // Check if resolved within SLA
    const resolvedTime = incident.resolvedAt || incident.closedAt
    return resolvedTime! <= incident.dueByTime ? 'Within SLA' : 'Breached'
  }

  const now = new Date()
  const timeRemaining = incident.dueByTime.getTime() - now.getTime()
  const totalSlaTime = incident.dueByTime.getTime() - incident.createdAt.getTime()
  const percentRemaining = (timeRemaining / totalSlaTime) * 100

  if (timeRemaining <= 0) {
    return 'Breached'
  } else if (percentRemaining < 20) {
    return 'At Risk'
  } else {
    return 'Within SLA'
  }
}
```

### 8.2 SLA Escalation Rules

```typescript
interface EscalationRule {
  triggerCondition: 'sla_threshold' | 'no_response' | 'customer_escalation'
  thresholdPercent?: number        // e.g., 80 = escalate at 80% of SLA
  noResponseHours?: number
  actions: {
    notifyEmails: string[]
    notifyUsers: ObjectId[]
    autoReassign?: boolean
    reassignToId?: ObjectId
    increasePriority?: boolean
    addInternalNote: string
  }
}

// Example: Auto-escalate critical incidents at 80% SLA
const criticalEscalationRule: EscalationRule = {
  triggerCondition: 'sla_threshold',
  thresholdPercent: 80,
  actions: {
    notifyEmails: ['managers@company.com', 'oncall@company.com'],
    notifyUsers: [managerId1, managerId2],
    addInternalNote: 'Auto-escalated: Critical incident approaching SLA breach'
  }
}

// Cron job runs every 5 minutes to check escalation rules
async function checkEscalations() {
  const openIncidents = await IncidentModel.getItemsByStatus(['New', 'Acknowledged', 'In Progress'])

  for (const incident of openIncidents) {
    const slaPercent = calculateSLAPercentageUsed(incident)

    if (slaPercent >= 80 && !incident.escalationLevel) {
      await escalateIncident(incident, 'sla_threshold')
    }

    if (slaPercent >= 95 && incident.escalationLevel === 1) {
      await escalateIncident(incident, 'sla_threshold', 2)
    }
  }
}
```

### 8.3 Priority Matrix

```typescript
// Priority = f(Urgency, Impact)
// Matrix determines final priority based on urgency and impact combination

const PRIORITY_MATRIX: Record<UrgencyLevel, Record<ImpactLevel, IncidentPriority>> = {
  'Critical': {
    'Critical': 'Critical',     // Critical urgency + Critical impact = Critical priority
    'High': 'Critical',
    'Medium': 'High',
    'Low': 'High'
  },
  'High': {
    'Critical': 'Critical',
    'High': 'High',
    'Medium': 'High',
    'Low': 'Medium'
  },
  'Medium': {
    'Critical': 'High',
    'High': 'High',
    'Medium': 'Medium',
    'Low': 'Medium'
  },
  'Low': {
    'Critical': 'High',
    'High': 'Medium',
    'Medium': 'Medium',
    'Low': 'Low'
  }
}

function calculatePriority(urgency: UrgencyLevel, impact: ImpactLevel): IncidentPriority {
  return PRIORITY_MATRIX[urgency][impact]
}
```

---

## 9. Integration Points

### 9.1 Freshdesk Integration

#### Linking Incidents to Freshdesk Tickets

```typescript
// User can manually link Freshdesk ticket IDs
// System fetches ticket details via Freshdesk API for display

interface FreshdeskTicketLink {
  ticketId: string
  subject: string
  status: string
  priority: string
  url: string
}

async function linkFreshdeskTicket(incidentId: string, freshdeskTicketId: string) {
  const incident = await IncidentModel.getItemById(incidentId)
  const freshdeskDetails = await freshdeskClient.getTicket(freshdeskTicketId)

  incident.linkedFreshdeskTickets.push(freshdeskTicketId)
  await IncidentModel.updateItem(incidentId, incident)

  // Add internal note
  await IncidentModel.addComment(
    incidentId,
    `Linked to Freshdesk ticket ${freshdeskTicketId}: ${freshdeskDetails.subject}`,
    'system',
    'internal'
  )
}
```

### 9.2 JIRA Integration

Similar pattern to Freshdesk, using JIRA REST API to fetch issue details.

### 9.3 CSV Import

#### Import from Service Desk Analytics CSV

```typescript
// Map CSV fields from existing analytics module to incidents
interface CSVImportMapping {
  ref: 'ticketId'              // Map ticketId → ref
  subject: 'subject'
  description: 'resolution'    // Or custom field
  companyName: 'companyName'
  reportedByEmail: 'email'
  priority: 'priority'         // Map: Urgent→Critical, etc.
  status: 'status'             // Map: Open→New, Resolved→Resolved, etc.
  createdAt: 'createdTime'
  linkedFreshdeskTickets: 'ticketId'  // Link back to original FD ticket
}

async function importFromCSV(csvFile: File, companyId: string) {
  const parsedData = parseCSV(csvFile)
  const company = await CompanyModel.getById(companyId)

  for (const row of parsedData) {
    // Check if incident already exists (by ref or Freshdesk ticket ID)
    const existing = await IncidentModel.getByRef(row.ticketId)
    if (existing) continue

    // Map and create incident
    const incidentData = {
      subject: row.subject,
      description: row.resolution || row.subject,
      companyId: companyId,
      companyName: company.name,
      urgency: mapPriorityToUrgency(row.priority),
      impact: 'Medium',  // Default
      category: row.type || 'Technical',
      status: mapStatus(row.status),
      reportedByEmail: row.email,
      createdAt: new Date(row.createdTime),
      linkedFreshdeskTickets: [row.ticketId]
    }

    await IncidentModel.createItem(incidentData)
  }
}
```

### 9.4 Email Notifications

```typescript
interface EmailNotificationConfig {
  enabled: boolean
  smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  from: string
  templates: {
    incidentCreated: EmailTemplate
    incidentUpdated: EmailTemplate
    incidentResolved: EmailTemplate
    slaWarning: EmailTemplate
    slaBreach: EmailTemplate
  }
}

interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
}

// Example: Send email when incident is created
async function sendIncidentCreatedEmail(incident: Incident, portalUser: PortalUser) {
  if (!portalUser.emailNotifications.onIncidentCreated) return

  const template = emailConfig.templates.incidentCreated
  const subject = template.subject.replace('{ref}', incident.ref)
  const body = template.htmlBody
    .replace('{ref}', incident.ref)
    .replace('{subject}', incident.subject)
    .replace('{dueBy}', formatDate(incident.dueByTime))
    .replace('{portalLink}', `https://portal.company.com/incident/${incident.ref}`)

  await emailClient.send({
    to: portalUser.email,
    from: emailConfig.from,
    subject,
    html: body
  })
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Design document review and approval
- [ ] Create database models (`lib/models/IncidentManagement.ts`, etc.)
- [ ] Set up MongoDB collections and indexes
- [ ] Create API route structure (`/api/incident-management/*`)
- [ ] Implement basic CRUD operations for incidents
- [ ] Create basic internal widget component structure

### Phase 2: Core Functionality (Weeks 3-4)
- [ ] Implement SLA calculation engine
- [ ] Build priority matrix logic
- [ ] Create incident detail modal
- [ ] Implement comment/update system (dual notes)
- [ ] Add company management interface
- [ ] Build SLA definition management

### Phase 3: Customer Portal (Weeks 5-6)
- [ ] Create portal authentication system (magic links)
- [ ] Build customer portal pages (dashboard, detail, create)
- [ ] Implement customer portal API routes
- [ ] Add portal user management
- [ ] Create portal branding system

### Phase 4: Integrations (Week 7)
- [ ] Freshdesk ticket linking
- [ ] JIRA issue linking
- [ ] CSV import functionality
- [ ] Email notification system (SMTP)
- [ ] Webhook support for real-time updates

### Phase 5: Analytics & Reporting (Week 8)
- [ ] Build statistics dashboard
- [ ] Create SLA compliance reports
- [ ] Add trend analysis charts
- [ ] Implement company performance reports
- [ ] Build export functionality (PDF, Excel)

### Phase 6: Polish & Testing (Weeks 9-10)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Security audit
- [ ] Comprehensive testing (unit, integration, E2E)
- [ ] Documentation (user manual, API docs)
- [ ] Training materials

### Phase 7: Deployment (Week 11)
- [ ] Staging environment deployment
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Monitoring and alerting setup
- [ ] Post-launch support

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// Example: SLA calculation tests
describe('SLA Calculation', () => {
  test('calculates correct due time for critical priority', () => {
    const incident = createMockIncident({ priority: 'Critical' })
    const sla = createMockSLA({ criticalResolutionHours: 4 })

    const dueTime = calculateSLADueTime({ incident, sla })

    expect(dueTime.getTime() - incident.createdAt.getTime())
      .toBe(4 * 60 * 60 * 1000)  // 4 hours
  })

  test('respects business hours in SLA calculation', () => {
    const incident = createMockIncident({
      createdAt: new Date('2025-10-13T17:00:00Z')  // 5 PM Friday
    })
    const sla = createMockSLA({
      useBusinessHoursOnly: true,
      highResolutionHours: 8
    })

    const dueTime = calculateSLADueTime({ incident, sla })

    // Should skip weekend and resume Monday 9 AM
    expect(dueTime.getDay()).toBe(1)  // Monday
  })

  test('calculates priority from urgency and impact matrix', () => {
    expect(calculatePriority('High', 'Critical')).toBe('Critical')
    expect(calculatePriority('Medium', 'Medium')).toBe('Medium')
    expect(calculatePriority('Low', 'Low')).toBe('Low')
  })
})
```

### 11.2 Integration Tests

```typescript
// Example: API route tests
describe('POST /api/incident-management/incidents', () => {
  test('creates incident with valid data', async () => {
    const response = await fetch('/api/incident-management/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Test incident',
        description: 'Test description',
        companyId: testCompanyId,
        urgency: 'High',
        impact: 'High'
      })
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.incident.ref).toMatch(/^INC-\d{4}-\d{4}$/)
    expect(data.incident.priority).toBe('High')
  })

  test('returns 401 when not authenticated', async () => {
    const response = await fetch('/api/incident-management/incidents', {
      method: 'POST'
    })

    expect(response.status).toBe(401)
  })
})
```

### 11.3 E2E Tests

```typescript
// Example: Customer portal E2E test (using Playwright)
test('customer can create and view incident', async ({ page }) => {
  // Login via magic link
  await page.goto('/customer-portal')
  await page.fill('input[type="email"]', 'test@acme.com')
  await page.click('button:has-text("Send Magic Link")')

  // Simulate clicking magic link (in test env, bypass email)
  const magicLink = await getMagicLinkFromDB('test@acme.com')
  await page.goto(magicLink)

  // Create incident
  await page.click('a:has-text("Create New")')
  await page.fill('input[name="subject"]', 'Test incident')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.selectOption('select[name="category"]', 'Technical')
  await page.check('input[value="High"]')  // Urgency
  await page.check('input[value="Multiple"]')  // Impact
  await page.click('button:has-text("Create Incident")')

  // Verify incident created
  await expect(page.locator('text=Incident created successfully')).toBeVisible()
  await expect(page.locator('text=/INC-\\d{4}-\\d{4}/')).toBeVisible()

  // View incident details
  const incidentRef = await page.locator('[data-testid="incident-ref"]').textContent()
  await page.click(`a:has-text("${incidentRef}")`)
  await expect(page.locator('h1:has-text("Test incident")')).toBeVisible()
})
```

### 11.4 Performance Tests

- **Load Testing**: Simulate 100 concurrent users creating incidents
- **SLA Calculation Performance**: Ensure < 100ms calculation time for 10,000 incidents
- **Portal Page Load**: Ensure < 2s initial load time
- **API Response Times**: Ensure < 500ms for all API routes

### 11.5 Security Tests

- **Authentication Bypass**: Attempt to access portal without valid token
- **Data Isolation**: Verify Company A cannot see Company B's incidents
- **SQL Injection**: Test all input fields with malicious payloads
- **XSS**: Test comment fields with script injection attempts
- **CSRF**: Verify CSRF protection on state-changing operations
- **Rate Limiting**: Verify magic link rate limiting works

---

## Appendices

### A. Reference Numbers Format

```
Incident Reference: INC-{YEAR}-{SEQUENCE}
Examples: INC-2025-0001, INC-2025-0042, INC-2025-1234
```

### B. Status Workflow

```
New → Acknowledged → In Progress → Resolved → Closed
                   ↓
                 On Hold → In Progress
                   ↓
             Awaiting Customer → In Progress
```

### C. Email Templates

#### Incident Created
```
Subject: [INC-{ref}] Your incident has been created

Hi {customerName},

Thank you for submitting your incident. We've received your request and assigned it to our support team.

Incident Reference: {ref}
Subject: {subject}
Priority: {priority}
Expected Resolution: {dueByTime}

You can track the progress of your incident at:
{portalLink}

Our team will respond soon.

Best regards,
{companyName} Support Team
```

### D. API Rate Limits

```
Internal API: 1000 requests/hour per user
Customer Portal API: 100 requests/hour per IP
Magic Link Requests: 5 requests/hour per email
```

### E. Database Sizing Estimates

Assuming:
- 100 companies
- Average 50 incidents/company/month
- 5 comments per incident
- 2-year retention

```
Incidents: 100 × 50 × 24 = 120,000 documents × 5KB ≈ 600 MB
Comments: 120,000 × 5 = 600,000 comments × 1KB ≈ 600 MB
Companies: 100 × 10KB ≈ 1 MB
Portal Users: 500 × 5KB ≈ 2.5 MB
Total: ~1.2 GB

With indexes and overhead: ~2 GB
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 13, 2025 | Service Desk Tools Team | Initial design document |

---

**End of Document**
