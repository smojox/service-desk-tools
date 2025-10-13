import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export type IncidentStatus =
  | 'New'
  | 'Acknowledged'
  | 'In Progress'
  | 'On Hold'
  | 'Awaiting Customer'
  | 'Resolved'
  | 'Closed'
  | 'Cancelled'

export type IncidentPriority = 'Low' | 'Medium' | 'High' | 'Critical'
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type ImpactLevel = 'Low' | 'Medium' | 'High' | 'Critical'
export type SLAStatus = 'Within SLA' | 'At Risk' | 'Breached'

export interface CustomerUpdate {
  _id?: ObjectId
  content: string
  authorId: ObjectId
  authorName: string
  authorType: 'customer' | 'agent'
  createdAt: Date
  visibleToCustomer: boolean
  emailSent: boolean
}

export interface InternalNote {
  _id?: ObjectId
  content: string
  authorId: ObjectId
  authorName: string
  createdAt: Date
  noteType: 'standard' | 'escalation' | 'resolution'
}

export interface Incident {
  _id?: ObjectId
  ref: string

  // Core Details
  subject: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority
  urgency: UrgencyLevel
  impact: ImpactLevel
  category: string
  subcategory?: string

  // Company & User Info
  companyId: ObjectId
  companyName: string
  reportedById: ObjectId
  reportedByName: string
  reportedByEmail: string
  reportedByType: 'customer' | 'internal'

  // Assignment
  assignedToId?: ObjectId
  assignedToName?: string
  teamId?: ObjectId
  teamName?: string

  // SLA Tracking
  slaId: ObjectId
  slaName: string
  dueByTime: Date
  responseByTime: Date
  slaStatus: SLAStatus
  breachReason?: string

  // Resolution
  resolutionNotes?: string
  internalResolutionNotes?: string
  resolvedAt?: Date
  resolvedById?: ObjectId
  resolvedByName?: string
  closedAt?: Date
  closedById?: ObjectId
  closedByName?: string

  // Integrations
  linkedFreshdeskTickets: string[]
  linkedJiraTickets: string[]
  linkedIncidentRefs: string[]

  // Customer Communication
  customerUpdates: CustomerUpdate[]
  internalNotes: InternalNote[]

  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById: ObjectId
  createdByName: string

  // Analytics
  viewCount: number
  reopenCount: number
  escalationLevel: number
}

export interface CreateIncidentData {
  subject: string
  description: string
  companyId: string
  reportedByEmail?: string
  reportedByName?: string
  reportedByType?: 'customer' | 'internal'
  urgency: UrgencyLevel
  impact: ImpactLevel
  category: string
  subcategory?: string
  assignedToId?: string
  assignedToName?: string
  teamId?: string
  teamName?: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
  createdById: string
  createdByName: string
}

export interface UpdateIncidentData {
  subject?: string
  description?: string
  status?: IncidentStatus
  urgency?: UrgencyLevel
  impact?: ImpactLevel
  category?: string
  subcategory?: string
  assignedToId?: string
  assignedToName?: string
  teamId?: string
  teamName?: string
  resolutionNotes?: string
  internalResolutionNotes?: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
  linkedIncidentRefs?: string[]
}

export interface GetIncidentsQuery {
  companyId?: string
  status?: IncidentStatus | IncidentStatus[]
  priority?: IncidentPriority | IncidentPriority[]
  assignedToId?: string
  reportedById?: string
  fromDate?: string
  toDate?: string
  search?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'dueByTime' | 'priority' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

// Priority Matrix: Priority = f(Urgency, Impact)
const PRIORITY_MATRIX: Record<UrgencyLevel, Record<ImpactLevel, IncidentPriority>> = {
  'Critical': {
    'Critical': 'Critical',
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

export function calculatePriority(urgency: UrgencyLevel, impact: ImpactLevel): IncidentPriority {
  return PRIORITY_MATRIX[urgency][impact]
}

export class IncidentModel {
  static async generateRef(): Promise<string> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const count = await collection.countDocuments()
    const currentYear = new Date().getFullYear()
    return `INC-${currentYear}-${String(count + 1).padStart(4, '0')}`
  }

  static async createItem(data: CreateIncidentData, slaDefinition: any, company: any): Promise<Incident> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const ref = await this.generateRef()
    const now = new Date()
    const priority = calculatePriority(data.urgency, data.impact)

    // Calculate SLA due times
    const { dueByTime, responseByTime } = this.calculateSLATimes(
      now,
      priority,
      slaDefinition,
      company
    )

    const newItem: Omit<Incident, '_id'> = {
      ref,
      subject: data.subject,
      description: data.description,
      status: 'New',
      priority,
      urgency: data.urgency,
      impact: data.impact,
      category: data.category,
      subcategory: data.subcategory,
      companyId: new ObjectId(data.companyId),
      companyName: company.name,
      reportedById: new ObjectId(data.createdById),
      reportedByName: data.reportedByName || data.createdByName,
      reportedByEmail: data.reportedByEmail || '',
      reportedByType: data.reportedByType || 'internal',
      assignedToId: data.assignedToId ? new ObjectId(data.assignedToId) : undefined,
      assignedToName: data.assignedToName,
      teamId: data.teamId ? new ObjectId(data.teamId) : undefined,
      teamName: data.teamName,
      slaId: slaDefinition._id,
      slaName: slaDefinition.name,
      dueByTime,
      responseByTime,
      slaStatus: 'Within SLA',
      linkedFreshdeskTickets: data.linkedFreshdeskTickets || [],
      linkedJiraTickets: data.linkedJiraTickets || [],
      linkedIncidentRefs: [],
      customerUpdates: [],
      internalNotes: [],
      createdAt: now,
      updatedAt: now,
      createdById: new ObjectId(data.createdById),
      createdByName: data.createdByName,
      viewCount: 0,
      reopenCount: 0,
      escalationLevel: 0
    }

    const result = await collection.insertOne(newItem)
    const item = await collection.findOne({ _id: result.insertedId })

    if (!item) {
      throw new Error('Failed to create incident')
    }

    return item
  }

  static calculateSLATimes(
    createdAt: Date,
    priority: IncidentPriority,
    slaDefinition: any,
    company: any
  ): { dueByTime: Date; responseByTime: Date } {
    // Get SLA hours based on priority (check company overrides first)
    let resolutionHours: number
    let responseHours: number

    const overrides = company.customSlaOverrides || {}

    switch (priority) {
      case 'Critical':
        resolutionHours = overrides.criticalResolutionHours ?? slaDefinition.criticalResolutionHours
        responseHours = overrides.criticalResponseHours ?? slaDefinition.criticalResponseHours
        break
      case 'High':
        resolutionHours = overrides.highResolutionHours ?? slaDefinition.highResolutionHours
        responseHours = overrides.highResponseHours ?? slaDefinition.highResponseHours
        break
      case 'Medium':
        resolutionHours = overrides.mediumResolutionHours ?? slaDefinition.mediumResolutionHours
        responseHours = overrides.mediumResponseHours ?? slaDefinition.mediumResponseHours
        break
      case 'Low':
        resolutionHours = overrides.lowResolutionHours ?? slaDefinition.lowResolutionHours
        responseHours = overrides.lowResponseHours ?? slaDefinition.lowResponseHours
        break
    }

    // Simple calendar time calculation (business hours support can be added later)
    const dueByTime = new Date(createdAt.getTime() + (resolutionHours * 60 * 60 * 1000))
    const responseByTime = new Date(createdAt.getTime() + (responseHours * 60 * 60 * 1000))

    return { dueByTime, responseByTime }
  }

  static async getAllItems(query: GetIncidentsQuery = {}): Promise<{ items: Incident[]; total: number }> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    // Build filter
    const filter: any = {}

    if (query.companyId) {
      filter.companyId = new ObjectId(query.companyId)
    }

    if (query.status) {
      filter.status = Array.isArray(query.status) ? { $in: query.status } : query.status
    }

    if (query.priority) {
      filter.priority = Array.isArray(query.priority) ? { $in: query.priority } : query.priority
    }

    if (query.assignedToId) {
      filter.assignedToId = new ObjectId(query.assignedToId)
    }

    if (query.reportedById) {
      filter.reportedById = new ObjectId(query.reportedById)
    }

    if (query.fromDate || query.toDate) {
      filter.createdAt = {}
      if (query.fromDate) filter.createdAt.$gte = new Date(query.fromDate)
      if (query.toDate) filter.createdAt.$lte = new Date(query.toDate)
    }

    if (query.search) {
      filter.$or = [
        { ref: { $regex: query.search, $options: 'i' } },
        { subject: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ]
    }

    // Pagination
    const page = query.page || 1
    const limit = query.limit || 50
    const skip = (page - 1) * limit

    // Sorting
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1
    const sort: any = { [sortBy]: sortOrder }

    const [items, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter)
    ])

    return { items, total }
  }

  static async getItemById(id: string | ObjectId): Promise<Incident | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getItemByRef(ref: string): Promise<Incident | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    return await collection.findOne({ ref })
  }

  static async updateItem(id: string | ObjectId, updateData: UpdateIncidentData): Promise<Incident | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    const updateDoc: any = {
      ...updateData,
      updatedAt: new Date()
    }

    // Recalculate priority if urgency or impact changed
    if (updateData.urgency || updateData.impact) {
      const incident = await this.getItemById(objectId)
      if (incident) {
        const newUrgency = updateData.urgency || incident.urgency
        const newImpact = updateData.impact || incident.impact
        updateDoc.priority = calculatePriority(newUrgency, newImpact)
      }
    }

    if (updateData.assignedToId) {
      updateDoc.assignedToId = new ObjectId(updateData.assignedToId)
    }

    if (updateData.teamId) {
      updateDoc.teamId = new ObjectId(updateData.teamId)
    }

    // Handle status changes
    if (updateData.status === 'Resolved' && !updateDoc.resolvedAt) {
      updateDoc.resolvedAt = new Date()
    }

    if (updateData.status === 'Closed' && !updateDoc.closedAt) {
      updateDoc.closedAt = new Date()
    }

    await collection.updateOne(
      { _id: objectId },
      { $set: updateDoc }
    )

    return await collection.findOne({ _id: objectId })
  }

  static async deleteItem(id: string | ObjectId): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    // Soft delete by setting status to Cancelled
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { status: 'Cancelled', updatedAt: new Date() } }
    )

    return result.modifiedCount === 1
  }

  static async addCustomerUpdate(
    itemId: string | ObjectId,
    content: string,
    authorId: string | ObjectId,
    authorName: string,
    authorType: 'customer' | 'agent',
    visibleToCustomer: boolean = true
  ): Promise<Incident | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const objectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
    const authorObjectId = typeof authorId === 'string' ? new ObjectId(authorId) : authorId

    const update: CustomerUpdate = {
      _id: new ObjectId(),
      content,
      authorId: authorObjectId,
      authorName,
      authorType,
      createdAt: new Date(),
      visibleToCustomer,
      emailSent: false
    }

    await collection.updateOne(
      { _id: objectId },
      {
        $push: { customerUpdates: update },
        $set: { updatedAt: new Date() }
      }
    )

    return await collection.findOne({ _id: objectId })
  }

  static async addInternalNote(
    itemId: string | ObjectId,
    content: string,
    authorId: string | ObjectId,
    authorName: string,
    noteType: 'standard' | 'escalation' | 'resolution' = 'standard'
  ): Promise<Incident | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const objectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
    const authorObjectId = typeof authorId === 'string' ? new ObjectId(authorId) : authorId

    const note: InternalNote = {
      _id: new ObjectId(),
      content,
      authorId: authorObjectId,
      authorName,
      createdAt: new Date(),
      noteType
    }

    await collection.updateOne(
      { _id: objectId },
      {
        $push: { internalNotes: note },
        $set: { updatedAt: new Date() }
      }
    )

    return await collection.findOne({ _id: objectId })
  }

  static async reopenIncident(
    id: string | ObjectId,
    reopenedById: string | ObjectId,
    reopenedByName: string,
    reason: string
  ): Promise<Incident | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    const incident = await this.getItemById(objectId)
    if (!incident) return null

    await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: 'In Progress',
          updatedAt: new Date(),
          resolvedAt: undefined,
          closedAt: undefined
        },
        $inc: { reopenCount: 1 }
      }
    )

    // Add internal note
    await this.addInternalNote(objectId, `Incident reopened: ${reason}`, reopenedById, reopenedByName)

    return await collection.findOne({ _id: objectId })
  }

  static async escalateIncident(
    id: string | ObjectId,
    reason: string,
    escalatedById: string | ObjectId,
    escalatedByName: string,
    escalateTo?: string
  ): Promise<Incident | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    const updateDoc: any = {
      updatedAt: new Date(),
      $inc: { escalationLevel: 1 }
    }

    if (escalateTo) {
      updateDoc.assignedToId = new ObjectId(escalateTo)
    }

    await collection.updateOne(
      { _id: objectId },
      updateDoc
    )

    // Add internal note
    await this.addInternalNote(
      objectId,
      `Incident escalated: ${reason}`,
      escalatedById,
      escalatedByName,
      'escalation'
    )

    return await collection.findOne({ _id: objectId })
  }

  static async getStats(companyId?: string, fromDate?: string, toDate?: string): Promise<any> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const filter: any = {}
    if (companyId) filter.companyId = new ObjectId(companyId)
    if (fromDate || toDate) {
      filter.createdAt = {}
      if (fromDate) filter.createdAt.$gte = new Date(fromDate)
      if (toDate) filter.createdAt.$lte = new Date(toDate)
    }

    const [
      total,
      byStatus,
      byPriority,
      byCompany,
      byAssignee,
      slaStats
    ] = await Promise.all([
      collection.countDocuments(filter),
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]).toArray(),
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$companyName', count: { $sum: 1 } } },
        { $project: { companyName: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]).toArray(),
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$assignedToName', count: { $sum: 1 } } },
        { $project: { assigneeName: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]).toArray(),
      collection.aggregate([
        { $match: filter },
        { $group: { _id: '$slaStatus', count: { $sum: 1 } } }
      ]).toArray()
    ])

    const byStatusMap: any = {}
    byStatus.forEach((s: any) => byStatusMap[s._id] = s.count)

    const byPriorityMap: any = {}
    byPriority.forEach((p: any) => byPriorityMap[p._id] = p.count)

    const slaStatsMap: any = {}
    slaStats.forEach((s: any) => slaStatsMap[s._id] = s.count)

    const withinSLA = slaStatsMap['Within SLA'] || 0
    const atRisk = slaStatsMap['At Risk'] || 0
    const breached = slaStatsMap['Breached'] || 0
    const complianceRate = total > 0 ? ((withinSLA / total) * 100).toFixed(2) : 0

    return {
      total,
      byStatus: byStatusMap,
      byPriority: byPriorityMap,
      byCompany,
      byAssignee,
      slaCompliance: {
        withinSLA,
        atRisk,
        breached,
        complianceRate: parseFloat(complianceRate as string)
      }
    }
  }

  static async updateSLAStatuses(): Promise<void> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const openStatuses: IncidentStatus[] = ['New', 'Acknowledged', 'In Progress', 'On Hold', 'Awaiting Customer']
    const incidents = await collection.find({
      status: { $in: openStatuses }
    }).toArray()

    const now = new Date()

    for (const incident of incidents) {
      const timeRemaining = incident.dueByTime.getTime() - now.getTime()
      const totalSlaTime = incident.dueByTime.getTime() - incident.createdAt.getTime()
      const percentRemaining = (timeRemaining / totalSlaTime) * 100

      let newStatus: SLAStatus
      if (timeRemaining <= 0) {
        newStatus = 'Breached'
      } else if (percentRemaining < 20) {
        newStatus = 'At Risk'
      } else {
        newStatus = 'Within SLA'
      }

      if (newStatus !== incident.slaStatus) {
        await collection.updateOne(
          { _id: incident._id },
          { $set: { slaStatus: newStatus, updatedAt: new Date() } }
        )
      }
    }
  }
}
