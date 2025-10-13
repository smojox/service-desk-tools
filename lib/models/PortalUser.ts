import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export interface EmailNotifications {
  onIncidentCreated: boolean
  onStatusChange: boolean
  onNewComment: boolean
  onResolution: boolean
}

export interface PortalUser {
  _id?: ObjectId

  // Basic Info
  name: string
  email: string
  phone?: string
  jobTitle?: string

  // Company Association
  companyId: ObjectId
  companyName: string

  // Authentication
  passwordHash?: string
  magicLinkToken?: string
  magicLinkExpiry?: Date
  lastLoginAt?: Date
  loginCount: number

  // Permissions
  role: 'user' | 'company_admin'
  canCreateIncidents: boolean
  canViewAllCompanyIncidents: boolean
  canAddComments: boolean

  // Preferences
  emailNotifications: EmailNotifications
  language: string
  timezone: string

  // Status
  active: boolean
  verified: boolean
  verificationToken?: string
  verificationExpiry?: Date

  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById?: ObjectId
  createdByName?: string
}

export interface CreatePortalUserData {
  name: string
  email: string
  phone?: string
  jobTitle?: string
  companyId: string
  companyName: string
  role?: 'user' | 'company_admin'
  password?: string
  sendWelcomeEmail?: boolean
  createdById?: string
  createdByName?: string
}

export interface UpdatePortalUserData {
  name?: string
  phone?: string
  jobTitle?: string
  role?: 'user' | 'company_admin'
  canCreateIncidents?: boolean
  canViewAllCompanyIncidents?: boolean
  canAddComments?: boolean
  emailNotifications?: EmailNotifications
  language?: string
  timezone?: string
  active?: boolean
}

export class PortalUserModel {
  static async createItem(data: CreatePortalUserData): Promise<{ user: PortalUser; magicLink?: string }> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    // Check if email already exists
    const existing = await collection.findOne({ email: data.email.toLowerCase() })
    if (existing) {
      throw new Error('Email already exists')
    }

    const now = new Date()
    let passwordHash: string | undefined

    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10)
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

    const newItem: Omit<PortalUser, '_id'> = {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      jobTitle: data.jobTitle,
      companyId: new ObjectId(data.companyId),
      companyName: data.companyName,
      passwordHash,
      lastLoginAt: undefined,
      loginCount: 0,
      role: data.role || 'user',
      canCreateIncidents: true,
      canViewAllCompanyIncidents: data.role === 'company_admin',
      canAddComments: true,
      emailNotifications: {
        onIncidentCreated: true,
        onStatusChange: true,
        onNewComment: true,
        onResolution: true
      },
      language: 'en',
      timezone: 'Europe/London',
      active: true,
      verified: false,
      verificationToken,
      verificationExpiry,
      createdAt: now,
      updatedAt: now,
      createdById: data.createdById ? new ObjectId(data.createdById) : undefined,
      createdByName: data.createdByName
    }

    const result = await collection.insertOne(newItem)
    const user = await collection.findOne({ _id: result.insertedId })

    if (!user) {
      throw new Error('Failed to create portal user')
    }

    let magicLink: string | undefined

    if (data.sendWelcomeEmail) {
      magicLink = await this.generateMagicLink(user._id!.toString())
    }

    return { user, magicLink }
  }

  static async getAllItems(query: { companyId?: string; active?: boolean; search?: string } = {}): Promise<PortalUser[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const filter: any = {}

    if (query.companyId) {
      filter.companyId = new ObjectId(query.companyId)
    }

    if (query.active !== undefined) {
      filter.active = query.active
    }

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ]
    }

    return await collection.find(filter).sort({ name: 1 }).toArray()
  }

  static async getItemById(id: string | ObjectId): Promise<PortalUser | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getItemByEmail(email: string): Promise<PortalUser | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    return await collection.findOne({ email: email.toLowerCase() })
  }

  static async updateItem(id: string | ObjectId, updateData: UpdatePortalUserData): Promise<PortalUser | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    const updateDoc: any = {
      ...updateData,
      updatedAt: new Date()
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
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id

    // Soft delete
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { active: false, updatedAt: new Date() } }
    )

    return result.modifiedCount === 1
  }

  static async generateMagicLink(userId: string): Promise<string> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const token = randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          magicLinkToken: token,
          magicLinkExpiry: expiry,
          updatedAt: new Date()
        }
      }
    )

    // In a real implementation, this would be the full URL
    // For now, return the token
    return token
  }

  static async verifyMagicLink(token: string): Promise<PortalUser | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const user = await collection.findOne({
      magicLinkToken: token,
      magicLinkExpiry: { $gt: new Date() },
      active: true
    })

    if (!user) {
      return null
    }

    // Clear the magic link token and update login info
    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          magicLinkToken: undefined,
          magicLinkExpiry: undefined,
          lastLoginAt: new Date(),
          verified: true,
          updatedAt: new Date()
        },
        $inc: { loginCount: 1 }
      }
    )

    return await collection.findOne({ _id: user._id })
  }

  static async verifyEmailToken(token: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const user = await collection.findOne({
      verificationToken: token,
      verificationExpiry: { $gt: new Date() }
    })

    if (!user) {
      return false
    }

    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          verified: true,
          verificationToken: undefined,
          verificationExpiry: undefined,
          updatedAt: new Date()
        }
      }
    )

    return true
  }

  static async validatePassword(email: string, password: string): Promise<PortalUser | null> {
    const user = await this.getItemByEmail(email)

    if (!user || !user.passwordHash || !user.active) {
      return null
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)

    if (!isValid) {
      return null
    }

    // Update login info
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        },
        $inc: { loginCount: 1 }
      }
    )

    return await collection.findOne({ _id: user._id })
  }

  static async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PortalUser>(COLLECTIONS.PORTAL_USERS)

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          passwordHash,
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount === 1
  }

  static async requestPasswordReset(email: string): Promise<string | null> {
    const user = await this.getItemByEmail(email)

    if (!user || !user.active) {
      return null
    }

    // Generate reset token (reuse magic link functionality)
    return await this.generateMagicLink(user._id!.toString())
  }
}
