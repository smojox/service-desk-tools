import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export interface BusinessHours {
  timezone: string
  monday?: { start: string; end: string }
  tuesday?: { start: string; end: string }
  wednesday?: { start: string; end: string }
  thursday?: { start: string; end: string }
  friday?: { start: string; end: string }
  saturday?: { start: string; end: string }
  sunday?: { start: string; end: string }
  holidays: Date[]
}

export interface PortalBranding {
  logoUrl?: string
  primaryColor?: string
  companyName?: string
}

export interface SLAOverrides {
  criticalResponseHours?: number
  criticalResolutionHours?: number
  highResponseHours?: number
  highResolutionHours?: number
  mediumResponseHours?: number
  mediumResolutionHours?: number
  lowResponseHours?: number
  lowResolutionHours?: number
}

export interface Company {
  _id?: ObjectId

  // Basic Info
  name: string
  domain: string
  additionalDomains: string[]
  companyCode: string

  // Contact Info
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  billingContactEmail?: string

  // SLA Configuration
  slaId: ObjectId
  slaName: string
  customSlaOverrides?: SLAOverrides
  businessHours?: BusinessHours

  // Portal Settings
  portalEnabled: boolean
  portalBranding?: PortalBranding
  allowedPortalUsers: string[]

  // Features
  allowAttachments: boolean
  maxAttachmentSize: number
  requireApproval: boolean
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

export interface CreateCompanyData {
  name: string
  domain: string
  additionalDomains?: string[]
  companyCode: string
  slaId: string
  slaName: string
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  portalEnabled: boolean
  allowedPortalUsers?: string[]
  businessHours?: BusinessHours
  createdById: string
  createdByName: string
}

export interface UpdateCompanyData {
  name?: string
  domain?: string
  additionalDomains?: string[]
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
  billingContactEmail?: string
  slaId?: string
  slaName?: string
  customSlaOverrides?: SLAOverrides
  businessHours?: BusinessHours
  portalEnabled?: boolean
  portalBranding?: PortalBranding
  allowedPortalUsers?: string[]
  allowAttachments?: boolean
  maxAttachmentSize?: number
  requireApproval?: boolean
  autoAssignmentEnabled?: boolean
  defaultAssigneeId?: string
  defaultTeamId?: string
  active?: boolean
  suspendedReason?: string
}

export class CompanyModel {
  static async createItem(data: CreateCompanyData): Promise<Company> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Company>(COLLECTIONS.COMPANIES)

    // Check if company code already exists
    const existing = await collection.findOne({ companyCode: data.companyCode })
    if (existing) {
      throw new Error('Company code already exists')
    }

    const now = new Date()

    const newItem: Omit<Company, '_id'> = {
      name: data.name,
      domain: data.domain,
      additionalDomains: data.additionalDomains || [],
      companyCode: data.companyCode,
      primaryContactName: data.primaryContactName,
      primaryContactEmail: data.primaryContactEmail,
      primaryContactPhone: data.primaryContactPhone,
      slaId: new ObjectId(data.slaId),
      slaName: data.slaName,
      businessHours: data.businessHours,
      portalEnabled: data.portalEnabled,
      allowedPortalUsers: data.allowedPortalUsers || [`*@${data.domain}`],
      allowAttachments: true,
      maxAttachmentSize: 10,
      requireApproval: false,
      autoAssignmentEnabled: false,
      totalIncidents: 0,
      openIncidents: 0,
      slaComplianceRate: 0,
      avgResolutionTimeHours: 0,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdById: new ObjectId(data.createdById),
      createdByName: data.createdByName
    }

    const result = await collection.insertOne(newItem)
    const item = await collection.findOne({ _id: result.insertedId })

    if (!item) {
      throw new Error('Failed to create company')
    }

    return item
  }

  static async getAllItems(query: { active?: boolean; search?: string; page?: number; limit?: number } = {}): Promise<{ items: Company[]; total: number }> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Company>(COLLECTIONS.COMPANIES)

    const filter: any = {}

    if (query.active !== undefined) {
      filter.active = query.active
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { companyCode: { $regex: query.search, $options: 'i' } },
        { domain: { $regex: query.search, $options: 'i' } }
      ]
    }

    const page = query.page || 1
    const limit = query.limit || 50
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      collection.find(filter).sort({ name: 1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter)
    ])

    return { items, total }
  }

  static async getItemById(id: string | ObjectId): Promise<Company | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Company>(COLLECTIONS.COMPANIES)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getItemByCode(companyCode: string): Promise<Company | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Company>(COLLECTIONS.COMPANIES)

    return await collection.findOne({ companyCode })
  }

  static async getItemByDomain(domain: string): Promise<Company | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Company>(COLLECTIONS.COMPANIES)

    return await collection.findOne({
      $or: [
        { domain },
        { additionalDomains: domain }
      ]
    })
  }

  static async updateItem(id: string | ObjectId, updateData: UpdateCompanyData): Promise<Company | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Company>(COLLECTIONS.COMPANIES)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    const updateDoc: any = {
      ...updateData,
      updatedAt: new Date()
    }

    if (updateData.slaId) {
      updateDoc.slaId = new ObjectId(updateData.slaId)
    }

    if (updateData.defaultAssigneeId) {
      updateDoc.defaultAssigneeId = new ObjectId(updateData.defaultAssigneeId)
    }

    if (updateData.defaultTeamId) {
      updateDoc.defaultTeamId = new ObjectId(updateData.defaultTeamId)
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
    const collection = db.collection<Company>(COLLECTIONS.COMPANIES)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    // Soft delete
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { active: false, updatedAt: new Date() } }
    )

    return result.modifiedCount === 1
  }

  static async updateStatistics(companyId: string | ObjectId): Promise<void> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const companyCollection = db.collection<Company>(COLLECTIONS.COMPANIES)
    const incidentCollection = db.collection(COLLECTIONS.INCIDENTS)

    const objectId = typeof companyId === 'string' ? new ObjectId(companyId) : companyId

    const [totalIncidents, openIncidents, slaStats, avgResolutionTime] = await Promise.all([
      incidentCollection.countDocuments({ companyId: objectId }),
      incidentCollection.countDocuments({
        companyId: objectId,
        status: { $in: ['New', 'Acknowledged', 'In Progress', 'On Hold', 'Awaiting Customer'] }
      }),
      incidentCollection.aggregate([
        { $match: { companyId: objectId } },
        { $group: { _id: '$slaStatus', count: { $sum: 1 } } }
      ]).toArray(),
      incidentCollection.aggregate([
        {
          $match: {
            companyId: objectId,
            status: { $in: ['Resolved', 'Closed'] },
            resolvedAt: { $exists: true }
          }
        },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ['$resolvedAt', '$createdAt'] },
                3600000 // Convert to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$resolutionTime' }
          }
        }
      ]).toArray()
    ])

    const slaStatsMap: any = {}
    slaStats.forEach((s: any) => slaStatsMap[s._id] = s.count)

    const withinSLA = slaStatsMap['Within SLA'] || 0
    const complianceRate = totalIncidents > 0 ? ((withinSLA / totalIncidents) * 100) : 0
    const avgResolutionTimeHours = avgResolutionTime[0]?.avgTime || 0

    await companyCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          totalIncidents,
          openIncidents,
          slaComplianceRate: parseFloat(complianceRate.toFixed(2)),
          avgResolutionTimeHours: parseFloat(avgResolutionTimeHours.toFixed(2)),
          updatedAt: new Date()
        }
      }
    )
  }

  static async getSLAReport(
    companyId: string | ObjectId,
    fromDate?: string,
    toDate?: string
  ): Promise<any> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const incidentCollection = db.collection(COLLECTIONS.INCIDENTS)

    const objectId = typeof companyId === 'string' ? new ObjectId(companyId) : companyId
    const company = await this.getItemById(objectId)

    if (!company) {
      throw new Error('Company not found')
    }

    const filter: any = { companyId: objectId }

    if (fromDate || toDate) {
      filter.createdAt = {}
      if (fromDate) filter.createdAt.$gte = new Date(fromDate)
      if (toDate) filter.createdAt.$lte = new Date(toDate)
    }

    const [totalIncidents, slaStats, byPriority, breachedIncidents] = await Promise.all([
      incidentCollection.countDocuments(filter),
      incidentCollection.aggregate([
        { $match: filter },
        { $group: { _id: '$slaStatus', count: { $sum: 1 } } }
      ]).toArray(),
      incidentCollection.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$priority',
            total: { $sum: 1 },
            avgResolutionHours: {
              $avg: {
                $cond: [
                  { $in: ['$status', ['Resolved', 'Closed']] },
                  {
                    $divide: [
                      { $subtract: ['$resolvedAt', '$createdAt'] },
                      3600000
                    ]
                  },
                  null
                ]
              }
            },
            slaBreached: {
              $sum: {
                $cond: [{ $eq: ['$slaStatus', 'Breached'] }, 1, 0]
              }
            }
          }
        }
      ]).toArray(),
      incidentCollection.find({
        ...filter,
        slaStatus: 'Breached'
      }).limit(20).toArray()
    ])

    const slaStatsMap: any = {}
    slaStats.forEach((s: any) => slaStatsMap[s._id] = s.count)

    const withinSLA = slaStatsMap['Within SLA'] || 0
    const breached = slaStatsMap['Breached'] || 0
    const complianceRate = totalIncidents > 0 ? ((withinSLA / totalIncidents) * 100) : 0

    const byPriorityMap: any = {}
    byPriority.forEach((p: any) => {
      byPriorityMap[p._id] = {
        total: p.total,
        avgResolutionHours: p.avgResolutionHours ? parseFloat(p.avgResolutionHours.toFixed(2)) : 0,
        slaBreached: p.slaBreached
      }
    })

    return {
      companyName: company.name,
      period: {
        from: fromDate ? new Date(fromDate) : null,
        to: toDate ? new Date(toDate) : null
      },
      totalIncidents,
      slaCompliance: {
        withinSLA,
        breached,
        complianceRate: parseFloat(complianceRate.toFixed(2))
      },
      byPriority: byPriorityMap,
      breachedIncidents: breachedIncidents.map((inc: any) => ({
        ref: inc.ref,
        subject: inc.subject,
        priority: inc.priority,
        breachDurationHours: inc.resolvedAt
          ? ((inc.resolvedAt.getTime() - inc.dueByTime.getTime()) / 3600000).toFixed(2)
          : ((new Date().getTime() - inc.dueByTime.getTime()) / 3600000).toFixed(2)
      }))
    }
  }
}
