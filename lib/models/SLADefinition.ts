import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export interface DefaultBusinessHours {
  timezone: string
  monday: { start: string; end: string }
  tuesday: { start: string; end: string }
  wednesday: { start: string; end: string }
  thursday: { start: string; end: string }
  friday: { start: string; end: string }
  saturday?: { start: string; end: string }
  sunday?: { start: string; end: string }
}

export interface NotificationRules {
  notifyAt50Percent: boolean
  notifyAt80Percent: boolean
  notifyOnBreach: boolean
  emailAddresses: string[]
}

export interface SLADefinition {
  _id?: ObjectId

  // Basic Info
  name: string
  description: string
  tier: number

  // Response Time SLAs (in hours)
  criticalResponseHours: number
  highResponseHours: number
  mediumResponseHours: number
  lowResponseHours: number

  // Resolution Time SLAs (in hours)
  criticalResolutionHours: number
  highResolutionHours: number
  mediumResolutionHours: number
  lowResolutionHours: number

  // Business Hours
  useBusinessHoursOnly: boolean
  defaultBusinessHours: DefaultBusinessHours

  // Features
  autoEscalation: boolean
  escalationThresholdPercent: number
  notificationRules: NotificationRules

  // Pricing (optional)
  monthlyCost?: number
  perIncidentCost?: number

  // Status
  active: boolean
  isDefault: boolean

  // Metadata
  createdAt: Date
  updatedAt: Date
}

export interface CreateSLADefinitionData {
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
  defaultBusinessHours?: DefaultBusinessHours
  autoEscalation: boolean
  escalationThresholdPercent: number
  notificationRules?: NotificationRules
  monthlyCost?: number
  perIncidentCost?: number
  isDefault?: boolean
}

export interface UpdateSLADefinitionData {
  name?: string
  description?: string
  tier?: number
  criticalResponseHours?: number
  highResponseHours?: number
  mediumResponseHours?: number
  lowResponseHours?: number
  criticalResolutionHours?: number
  highResolutionHours?: number
  mediumResolutionHours?: number
  lowResolutionHours?: number
  useBusinessHoursOnly?: boolean
  defaultBusinessHours?: DefaultBusinessHours
  autoEscalation?: boolean
  escalationThresholdPercent?: number
  notificationRules?: NotificationRules
  monthlyCost?: number
  perIncidentCost?: number
  active?: boolean
  isDefault?: boolean
}

export class SLADefinitionModel {
  static async createItem(data: CreateSLADefinitionData): Promise<SLADefinition> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<SLADefinition>(COLLECTIONS.SLA_DEFINITIONS)

    const now = new Date()

    // Default business hours if not provided
    const defaultBusinessHours: DefaultBusinessHours = data.defaultBusinessHours || {
      timezone: 'Europe/London',
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' }
    }

    const notificationRules: NotificationRules = data.notificationRules || {
      notifyAt50Percent: false,
      notifyAt80Percent: true,
      notifyOnBreach: true,
      emailAddresses: []
    }

    const newItem: Omit<SLADefinition, '_id'> = {
      name: data.name,
      description: data.description,
      tier: data.tier,
      criticalResponseHours: data.criticalResponseHours,
      highResponseHours: data.highResponseHours,
      mediumResponseHours: data.mediumResponseHours,
      lowResponseHours: data.lowResponseHours,
      criticalResolutionHours: data.criticalResolutionHours,
      highResolutionHours: data.highResolutionHours,
      mediumResolutionHours: data.mediumResolutionHours,
      lowResolutionHours: data.lowResolutionHours,
      useBusinessHoursOnly: data.useBusinessHoursOnly,
      defaultBusinessHours,
      autoEscalation: data.autoEscalation,
      escalationThresholdPercent: data.escalationThresholdPercent,
      notificationRules,
      monthlyCost: data.monthlyCost,
      perIncidentCost: data.perIncidentCost,
      active: true,
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now
    }

    // If this is set as default, unset any existing defaults
    if (newItem.isDefault) {
      await collection.updateMany(
        { isDefault: true },
        { $set: { isDefault: false, updatedAt: now } }
      )
    }

    const result = await collection.insertOne(newItem)
    const item = await collection.findOne({ _id: result.insertedId })

    if (!item) {
      throw new Error('Failed to create SLA definition')
    }

    return item
  }

  static async getAllItems(): Promise<SLADefinition[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<SLADefinition>(COLLECTIONS.SLA_DEFINITIONS)

    return await collection.find({ active: true }).sort({ tier: 1 }).toArray()
  }

  static async getItemById(id: string | ObjectId): Promise<SLADefinition | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<SLADefinition>(COLLECTIONS.SLA_DEFINITIONS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getDefaultSLA(): Promise<SLADefinition | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<SLADefinition>(COLLECTIONS.SLA_DEFINITIONS)

    return await collection.findOne({ isDefault: true, active: true })
  }

  static async updateItem(id: string | ObjectId, updateData: UpdateSLADefinitionData): Promise<SLADefinition | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<SLADefinition>(COLLECTIONS.SLA_DEFINITIONS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    const now = new Date()

    // If setting as default, unset any existing defaults
    if (updateData.isDefault) {
      await collection.updateMany(
        { isDefault: true, _id: { $ne: objectId } },
        { $set: { isDefault: false, updatedAt: now } }
      )
    }

    const updateDoc: any = {
      ...updateData,
      updatedAt: now
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
    const collection = db.collection<SLADefinition>(COLLECTIONS.SLA_DEFINITIONS)
    const companyCollection = db.collection(COLLECTIONS.COMPANIES)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    // Check if any companies are using this SLA
    const companiesUsingThisSLA = await companyCollection.countDocuments({ slaId: objectId })

    if (companiesUsingThisSLA > 0) {
      throw new Error(`Cannot delete SLA: ${companiesUsingThisSLA} companies are using it`)
    }

    // Soft delete
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { active: false, updatedAt: new Date() } }
    )

    return result.modifiedCount === 1
  }

  static async ensureDefaultSLA(): Promise<void> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<SLADefinition>(COLLECTIONS.SLA_DEFINITIONS)

    // Check if any default exists
    const existingDefault = await collection.findOne({ isDefault: true, active: true })

    if (!existingDefault) {
      // Check if "Standard SLA" already exists (but not set as default)
      const existingStandardSLA = await collection.findOne({ name: 'Standard SLA' })

      if (existingStandardSLA) {
        // Update the existing one to be the default
        const now = new Date()
        await collection.updateOne(
          { _id: existingStandardSLA._id },
          {
            $set: {
              isDefault: true,
              active: true,
              updatedAt: now
            }
          }
        )
      } else {
        // Create a new standard default SLA
        const now = new Date()
        const standardSLA: Omit<SLADefinition, '_id'> = {
          name: 'Standard SLA',
          description: 'Default SLA tier for all companies',
          tier: 3,
          criticalResponseHours: 1,
          highResponseHours: 4,
          mediumResponseHours: 8,
          lowResponseHours: 24,
          criticalResolutionHours: 4,
          highResolutionHours: 24,
          mediumResolutionHours: 72,
          lowResolutionHours: 168,
          useBusinessHoursOnly: false,
          defaultBusinessHours: {
            timezone: 'Europe/London',
            monday: { start: '09:00', end: '17:00' },
            tuesday: { start: '09:00', end: '17:00' },
            wednesday: { start: '09:00', end: '17:00' },
            thursday: { start: '09:00', end: '17:00' },
            friday: { start: '09:00', end: '17:00' }
          },
          autoEscalation: true,
          escalationThresholdPercent: 80,
          notificationRules: {
            notifyAt50Percent: false,
            notifyAt80Percent: true,
            notifyOnBreach: true,
            emailAddresses: []
          },
          active: true,
          isDefault: true,
          createdAt: now,
          updatedAt: now
        }

        await collection.insertOne(standardSLA)
      }
    }
  }
}
