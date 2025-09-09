import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export interface PriorityTrackerComment {
  _id?: ObjectId
  content: string
  authorId: ObjectId
  authorName: string
  createdAt: Date
}

export interface PriorityTrackerItem {
  _id?: ObjectId
  ref: string
  summary: string
  companyName: string
  status: 'Open' | 'Closed' | 'On Hold'
  assignedToId: ObjectId
  assignedToName: string
  linkedFreshdeskTickets: string[]
  linkedJiraTickets: string[]
  comments: PriorityTrackerComment[]
  createdAt: Date
  updatedAt: Date
  createdById: ObjectId
  createdByName: string
}

export interface CreatePriorityTrackerData {
  summary: string
  companyName: string
  assignedToId: string
  assignedToName: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
  createdById: string
  createdByName: string
}

export interface UpdatePriorityTrackerData {
  summary?: string
  companyName?: string
  status?: 'Open' | 'Closed' | 'On Hold'
  assignedToId?: string
  assignedToName?: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
}

export class PriorityTrackerModel {
  static async generateRef(): Promise<string> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const count = await collection.countDocuments()
    const currentYear = new Date().getFullYear()
    return `PT-${currentYear}-${String(count + 1).padStart(4, '0')}`
  }

  static async createItem(data: CreatePriorityTrackerData): Promise<PriorityTrackerItem> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const ref = await this.generateRef()
    const now = new Date()

    const newItem: Omit<PriorityTrackerItem, '_id'> = {
      ref,
      summary: data.summary,
      companyName: data.companyName,
      status: 'Open',
      assignedToId: new ObjectId(data.assignedToId),
      assignedToName: data.assignedToName,
      linkedFreshdeskTickets: data.linkedFreshdeskTickets || [],
      linkedJiraTickets: data.linkedJiraTickets || [],
      comments: [],
      createdAt: now,
      updatedAt: now,
      createdById: new ObjectId(data.createdById),
      createdByName: data.createdByName
    }

    const result = await collection.insertOne(newItem)
    const item = await collection.findOne({ _id: result.insertedId })
    
    if (!item) {
      throw new Error('Failed to create priority tracker item')
    }

    return item
  }

  static async getAllItems(): Promise<PriorityTrackerItem[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    return await collection.find({}).sort({ createdAt: -1 }).toArray()
  }

  static async getItemById(id: string | ObjectId): Promise<PriorityTrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getItemByRef(ref: string): Promise<PriorityTrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    return await collection.findOne({ ref })
  }

  static async updateItem(id: string | ObjectId, updateData: UpdatePriorityTrackerData): Promise<PriorityTrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    
    const updateDoc: any = {
      ...updateData,
      updatedAt: new Date()
    }

    if (updateData.assignedToId) {
      updateDoc.assignedToId = new ObjectId(updateData.assignedToId)
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
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    const result = await collection.deleteOne({ _id: objectId })

    return result.deletedCount === 1
  }

  static async addComment(
    itemId: string | ObjectId, 
    content: string, 
    authorId: string | ObjectId, 
    authorName: string
  ): Promise<PriorityTrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const objectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
    const authorObjectId = typeof authorId === 'string' ? new ObjectId(authorId) : authorId
    
    const comment: PriorityTrackerComment = {
      _id: new ObjectId(),
      content,
      authorId: authorObjectId,
      authorName,
      createdAt: new Date()
    }

    await collection.updateOne(
      { _id: objectId },
      { 
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      }
    )

    return await collection.findOne({ _id: objectId })
  }

  static async getItemsByStatus(status: 'Open' | 'Closed' | 'On Hold'): Promise<PriorityTrackerItem[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    return await collection.find({ status }).sort({ createdAt: -1 }).toArray()
  }

  static async getItemsByAssignee(assigneeId: string | ObjectId): Promise<PriorityTrackerItem[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const objectId = typeof assigneeId === 'string' ? new ObjectId(assigneeId) : assigneeId
    return await collection.find({ assignedToId: objectId }).sort({ createdAt: -1 }).toArray()
  }

  static async getStats(): Promise<{
    total: number
    open: number
    closed: number
    onHold: number
    byAssignee: Array<{ assignee: string, count: number }>
  }> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<PriorityTrackerItem>(COLLECTIONS.PRIORITY_TRACKER)

    const [total, open, closed, onHold, byAssignee] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: 'Open' }),
      collection.countDocuments({ status: 'Closed' }),
      collection.countDocuments({ status: 'On Hold' }),
      collection.aggregate([
        {
          $group: {
            _id: '$assignedToName',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            assignee: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]).toArray().then(results => results as Array<{ assignee: string, count: number }>)
    ])

    return {
      total,
      open,
      closed,
      onHold,
      byAssignee
    }
  }
}