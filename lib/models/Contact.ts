import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export interface Contact {
  _id?: ObjectId

  // Basic Info
  name: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string

  // Company Association
  companyId: ObjectId
  companyName: string

  // Access & Permissions
  portalAccess: boolean
  canLogIncidents: boolean
  receiveNotifications: boolean

  // Contact Preferences
  preferredLanguage?: string
  timezone?: string

  // Status
  active: boolean

  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById: ObjectId
  createdByName: string
  lastIncidentAt?: Date
  totalIncidentsLogged: number
}

export interface CreateContactData {
  name: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  companyId: string
  companyName: string
  portalAccess?: boolean
  canLogIncidents?: boolean
  receiveNotifications?: boolean
  preferredLanguage?: string
  timezone?: string
  createdById: string
  createdByName: string
}

export interface UpdateContactData {
  name?: string
  email?: string
  phone?: string
  jobTitle?: string
  department?: string
  companyId?: string
  companyName?: string
  portalAccess?: boolean
  canLogIncidents?: boolean
  receiveNotifications?: boolean
  preferredLanguage?: string
  timezone?: string
  active?: boolean
}

export class ContactModel {
  static async createItem(data: CreateContactData): Promise<Contact> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    // Check if contact email already exists for this company
    const existing = await collection.findOne({
      email: data.email.toLowerCase(),
      companyId: new ObjectId(data.companyId)
    })
    if (existing) {
      throw new Error('Contact with this email already exists for this company')
    }

    const now = new Date()

    const newItem: Omit<Contact, '_id'> = {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      jobTitle: data.jobTitle,
      department: data.department,
      companyId: new ObjectId(data.companyId),
      companyName: data.companyName,
      portalAccess: data.portalAccess ?? true,
      canLogIncidents: data.canLogIncidents ?? true,
      receiveNotifications: data.receiveNotifications ?? true,
      preferredLanguage: data.preferredLanguage || 'en',
      timezone: data.timezone || 'UTC',
      active: true,
      totalIncidentsLogged: 0,
      createdAt: now,
      updatedAt: now,
      createdById: new ObjectId(data.createdById),
      createdByName: data.createdByName
    }

    const result = await collection.insertOne(newItem)
    const item = await collection.findOne({ _id: result.insertedId })

    if (!item) {
      throw new Error('Failed to create contact')
    }

    return item
  }

  static async getAllItems(query: {
    active?: boolean
    companyId?: string
    search?: string
    page?: number
    limit?: number
  } = {}): Promise<{ items: Contact[]; total: number }> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    const filter: any = {}

    if (query.active !== undefined) {
      filter.active = query.active
    }

    if (query.companyId) {
      filter.companyId = new ObjectId(query.companyId)
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
        { companyName: { $regex: query.search, $options: 'i' } },
        { department: { $regex: query.search, $options: 'i' } }
      ]
    }

    const page = query.page || 1
    const limit = query.limit || 50
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      collection.find(filter).sort({ companyName: 1, name: 1 }).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter)
    ])

    return { items, total }
  }

  static async getItemById(id: string | ObjectId): Promise<Contact | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getItemByEmail(email: string, companyId?: string): Promise<Contact | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    const filter: any = { email: email.toLowerCase() }
    if (companyId) {
      filter.companyId = new ObjectId(companyId)
    }

    return await collection.findOne(filter)
  }

  static async updateItem(id: string | ObjectId, updateData: UpdateContactData): Promise<Contact | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    const updateDoc: any = {
      ...updateData,
      updatedAt: new Date()
    }

    if (updateData.email) {
      updateDoc.email = updateData.email.toLowerCase()
    }

    if (updateData.companyId) {
      updateDoc.companyId = new ObjectId(updateData.companyId)
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
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    // Soft delete
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { active: false, updatedAt: new Date() } }
    )

    return result.modifiedCount === 1
  }

  static async incrementIncidentCount(id: string | ObjectId): Promise<void> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    await collection.updateOne(
      { _id: objectId },
      {
        $inc: { totalIncidentsLogged: 1 },
        $set: { lastIncidentAt: new Date(), updatedAt: new Date() }
      }
    )
  }

  static async getContactsByCompany(companyId: string): Promise<Contact[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    return await collection
      .find({ companyId: new ObjectId(companyId), active: true })
      .sort({ name: 1 })
      .toArray()
  }
}
