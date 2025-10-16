/**
 * Saved Query Model
 * Stores user-defined search queries for incident management
 */

import { MongoClient, Db, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const DB_NAME = 'ServiceDesk'
const COLLECTION_NAME = 'saved_queries'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db(DB_NAME)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export interface QueryFilters {
  status?: string[]
  priority?: string[]
  companyId?: string[]
  assignedToId?: string[]
  slaStatus?: string[]
  category?: string[]
  createdDateFrom?: string
  createdDateTo?: string
  dueDateFrom?: string
  dueDateTo?: string
  searchText?: string
}

export interface SavedQuery {
  _id?: ObjectId
  name: string
  description?: string
  filters: QueryFilters
  isGlobal: boolean
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
  usageCount: number
}

export class SavedQueryModel {
  /**
   * Get all saved queries for a user (personal + global)
   */
  static async getQueriesForUser(userId: string): Promise<SavedQuery[]> {
    const { db } = await connectToDatabase()
    const collection = db.collection<SavedQuery>(COLLECTION_NAME)

    const queries = await collection
      .find({
        $or: [
          { createdBy: userId },
          { isGlobal: true }
        ]
      })
      .sort({ isGlobal: -1, usageCount: -1, name: 1 })
      .toArray()

    return queries
  }

  /**
   * Get global queries
   */
  static async getGlobalQueries(): Promise<SavedQuery[]> {
    const { db } = await connectToDatabase()
    const collection = db.collection<SavedQuery>(COLLECTION_NAME)

    const queries = await collection
      .find({ isGlobal: true })
      .sort({ usageCount: -1, name: 1 })
      .toArray()

    return queries
  }

  /**
   * Get query by ID
   */
  static async getQueryById(queryId: string): Promise<SavedQuery | null> {
    const { db } = await connectToDatabase()
    const collection = db.collection<SavedQuery>(COLLECTION_NAME)

    const query = await collection.findOne({ _id: new ObjectId(queryId) })
    return query
  }

  /**
   * Create a new saved query
   */
  static async createQuery(data: {
    name: string
    description?: string
    filters: QueryFilters
    isGlobal: boolean
    createdBy: string
    createdByName: string
  }): Promise<SavedQuery> {
    const { db } = await connectToDatabase()
    const collection = db.collection<SavedQuery>(COLLECTION_NAME)

    const query: SavedQuery = {
      name: data.name,
      description: data.description,
      filters: data.filters,
      isGlobal: data.isGlobal,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }

    const result = await collection.insertOne(query)
    query._id = result.insertedId

    return query
  }

  /**
   * Update a saved query
   */
  static async updateQuery(
    queryId: string,
    updates: {
      name?: string
      description?: string
      filters?: QueryFilters
      isGlobal?: boolean
    }
  ): Promise<SavedQuery | null> {
    const { db } = await connectToDatabase()
    const collection = db.collection<SavedQuery>(COLLECTION_NAME)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(queryId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Delete a saved query
   */
  static async deleteQuery(queryId: string, userId: string): Promise<boolean> {
    const { db } = await connectToDatabase()
    const collection = db.collection<SavedQuery>(COLLECTION_NAME)

    // Only allow deletion of own queries
    const result = await collection.deleteOne({
      _id: new ObjectId(queryId),
      createdBy: userId
    })

    return result.deletedCount > 0
  }

  /**
   * Increment usage count
   */
  static async incrementUsage(queryId: string): Promise<void> {
    const { db } = await connectToDatabase()
    const collection = db.collection<SavedQuery>(COLLECTION_NAME)

    await collection.updateOne(
      { _id: new ObjectId(queryId) },
      { $inc: { usageCount: 1 } }
    )
  }
}
