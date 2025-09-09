import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export interface CSITrackerComment {
  _id?: ObjectId
  content: string
  authorId: ObjectId
  authorName: string
  createdAt: Date
}

export interface CSITrackerItem {
  _id?: ObjectId
  ref: string
  summary: string
  companyName: string
  status: 'Open' | 'Closed' | 'On Hold'
  percentComplete: number // 0-100
  assignedToId: ObjectId
  assignedToName: string
  linkedFreshdeskTickets: string[]
  linkedJiraTickets: string[]
  comments: CSITrackerComment[]
  createdAt: Date
  updatedAt: Date
  createdById: ObjectId
  createdByName: string
  targetCompletionDate?: Date
  category: 'Process Improvement' | 'Technology Enhancement' | 'Training Initiative' | 'Quality Improvement' | 'Cost Reduction' | 'Other'
}

export interface CreateCSITrackerData {
  summary: string
  companyName: string
  assignedToId: string
  assignedToName: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
  createdById: string
  createdByName: string
  targetCompletionDate?: Date
  category: 'Process Improvement' | 'Technology Enhancement' | 'Training Initiative' | 'Quality Improvement' | 'Cost Reduction' | 'Other'
}

export interface UpdateCSITrackerData {
  summary?: string
  companyName?: string
  status?: 'Open' | 'Closed' | 'On Hold'
  percentComplete?: number
  assignedToId?: string
  assignedToName?: string
  linkedFreshdeskTickets?: string[]
  linkedJiraTickets?: string[]
  targetCompletionDate?: Date
  category?: 'Process Improvement' | 'Technology Enhancement' | 'Training Initiative' | 'Quality Improvement' | 'Cost Reduction' | 'Other'
}

export class CSITrackerModel {
  static async generateRef(): Promise<string> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const count = await collection.countDocuments()
    const currentYear = new Date().getFullYear()
    return `CSI-${currentYear}-${String(count + 1).padStart(4, '0')}`
  }

  static async createItem(data: CreateCSITrackerData): Promise<CSITrackerItem> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const ref = await this.generateRef()
    const now = new Date()

    const newItem: Omit<CSITrackerItem, '_id'> = {
      ref,
      summary: data.summary,
      companyName: data.companyName,
      status: 'Open',
      percentComplete: 0,
      assignedToId: new ObjectId(data.assignedToId),
      assignedToName: data.assignedToName,
      linkedFreshdeskTickets: data.linkedFreshdeskTickets || [],
      linkedJiraTickets: data.linkedJiraTickets || [],
      comments: [],
      createdAt: now,
      updatedAt: now,
      createdById: new ObjectId(data.createdById),
      createdByName: data.createdByName,
      targetCompletionDate: data.targetCompletionDate,
      category: data.category
    }

    const result = await collection.insertOne(newItem)
    const item = await collection.findOne({ _id: result.insertedId })
    
    if (!item) {
      throw new Error('Failed to create CSI tracker item')
    }

    return item
  }

  static async getAllItems(): Promise<CSITrackerItem[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    return await collection.find({}).sort({ createdAt: -1 }).toArray()
  }

  static async getItemById(id: string | ObjectId): Promise<CSITrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getItemByRef(ref: string): Promise<CSITrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    return await collection.findOne({ ref })
  }

  static async updateItem(id: string | ObjectId, updateData: UpdateCSITrackerData): Promise<CSITrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    
    const updateDoc: any = {
      ...updateData,
      updatedAt: new Date()
    }

    if (updateData.assignedToId) {
      updateDoc.assignedToId = new ObjectId(updateData.assignedToId)
    }

    // Auto-close when 100% complete
    if (updateData.percentComplete === 100) {
      updateDoc.status = 'Closed'
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
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    const result = await collection.deleteOne({ _id: objectId })

    return result.deletedCount === 1
  }

  static async addComment(
    itemId: string | ObjectId, 
    content: string, 
    authorId: string | ObjectId, 
    authorName: string
  ): Promise<CSITrackerItem | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const objectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
    const authorObjectId = typeof authorId === 'string' ? new ObjectId(authorId) : authorId
    
    const comment: CSITrackerComment = {
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

  static async getItemsByStatus(status: 'Open' | 'Closed' | 'On Hold'): Promise<CSITrackerItem[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    return await collection.find({ status }).sort({ createdAt: -1 }).toArray()
  }

  static async getItemsByAssignee(assigneeId: string | ObjectId): Promise<CSITrackerItem[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const objectId = typeof assigneeId === 'string' ? new ObjectId(assigneeId) : assigneeId
    return await collection.find({ assignedToId: objectId }).sort({ createdAt: -1 }).toArray()
  }

  static async getItemsByCategory(category: string): Promise<CSITrackerItem[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    return await collection.find({ category: category as any }).sort({ createdAt: -1 }).toArray()
  }

  static async getStats(): Promise<{
    total: number
    open: number
    closed: number
    onHold: number
    averageProgress: number
    byAssignee: Array<{ assignee: string, count: number }>
    byCategory: Array<{ category: string, count: number }>
    nearCompletion: number // Items > 80% complete
  }> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<CSITrackerItem>(COLLECTIONS.CSI_TRACKER)

    const [total, open, closed, onHold, nearCompletion, byAssignee, byCategory, avgProgress] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: 'Open' }),
      collection.countDocuments({ status: 'Closed' }),
      collection.countDocuments({ status: 'On Hold' }),
      collection.countDocuments({ percentComplete: { $gte: 80 }, status: { $ne: 'Closed' } }),
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
      ]).toArray().then(results => results as Array<{ assignee: string, count: number }>),
      collection.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            category: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]).toArray().then(results => results as Array<{ category: string, count: number }>),
      collection.aggregate([
        {
          $group: {
            _id: null,
            avgProgress: { $avg: '$percentComplete' }
          }
        }
      ]).toArray()
    ])

    const averageProgress = avgProgress.length > 0 ? Math.round(avgProgress[0].avgProgress || 0) : 0

    return {
      total,
      open,
      closed,
      onHold,
      averageProgress,
      byAssignee,
      byCategory,
      nearCompletion
    }
  }
}