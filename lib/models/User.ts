import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  permissions: {
    analytics: boolean
    appealCodes: boolean
    admin: boolean
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}

export interface CreateUserData {
  email: string
  password: string
  name: string
  role: 'admin' | 'user' | 'viewer'
  permissions: {
    analytics: boolean
    appealCodes: boolean
    admin: boolean
  }
}

export class UserModel {
  static async createUser(userData: CreateUserData): Promise<User> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection<User>(COLLECTIONS.USERS)

    // Check if user already exists
    const existingUser = await users.findOne({ email: userData.email })
    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const newUser: Omit<User, '_id'> = {
      ...userData,
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await users.insertOne(newUser)
    const user = await users.findOne({ _id: result.insertedId })
    
    if (!user) {
      throw new Error('Failed to create user')
    }

    return user
  }

  static async findByEmail(email: string): Promise<User | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection<User>(COLLECTIONS.USERS)

    return await users.findOne({ email })
  }

  static async findById(id: string | ObjectId): Promise<User | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection<User>(COLLECTIONS.USERS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await users.findOne({ _id: objectId })
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }

  static async getAllUsers(): Promise<User[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection<User>(COLLECTIONS.USERS)

    return await users.find({}, { 
      sort: { createdAt: -1 },
      projection: { password: 0 } // Exclude password from results
    }).toArray()
  }

  static async updateUser(id: string | ObjectId, updateData: Partial<User>): Promise<User | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection<User>(COLLECTIONS.USERS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    
    const updateDoc: Partial<User> = {
      ...updateData,
      updatedAt: new Date()
    }

    // If password is being updated, hash it
    if (updateData.password) {
      updateDoc.password = await bcrypt.hash(updateData.password, 12)
    }

    await users.updateOne(
      { _id: objectId },
      { $set: updateDoc }
    )

    return await users.findOne({ _id: objectId }, { projection: { password: 0 } })
  }

  static async deleteUser(id: string | ObjectId): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection<User>(COLLECTIONS.USERS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    const result = await users.deleteOne({ _id: objectId })

    return result.deletedCount === 1
  }

  static async updateLastLogin(id: string | ObjectId): Promise<void> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const users = db.collection<User>(COLLECTIONS.USERS)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    await users.updateOne(
      { _id: objectId },
      { $set: { lastLogin: new Date(), updatedAt: new Date() } }
    )
  }

  static async createDefaultAdmin(): Promise<User | null> {
    try {
      // Check if any admin users exist
      const client = await clientPromise
      const db = client.db(DB_NAME)
      const users = db.collection<User>(COLLECTIONS.USERS)
      
      const adminExists = await users.findOne({ role: 'admin' })
      
      if (adminExists) {
        console.log('Admin user already exists')
        return null
      }

      // Create default admin user
      const defaultAdmin = await this.createUser({
        email: 'admin@taranto.com',
        password: 'admin123', // This should be changed on first login
        name: 'System Administrator',
        role: 'admin',
        permissions: {
          analytics: true,
          appealCodes: true,
          admin: true
        }
      })

      console.log('Default admin user created:', defaultAdmin.email)
      return defaultAdmin
    } catch (error) {
      console.error('Error creating default admin:', error)
      return null
    }
  }
}