import { ObjectId } from 'mongodb'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'

export interface ResourceAssignment {
  _id?: ObjectId
  title: string
  description?: string
  assignedToId: ObjectId
  assignedToName: string
  startDate: Date
  endDate: Date
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
  isAllDay: boolean
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  
  // Linked items
  linkedItemId?: ObjectId
  linkedItemType?: 'priority' | 'csi' | 'custom'
  linkedItemRef?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdById: ObjectId
  createdByName: string
  
  // Additional fields
  location?: string
  estimatedHours?: number
  actualHours?: number
  notes?: string
  tags?: string[]
}

export interface CreateResourceAssignmentData {
  title: string
  description?: string
  assignedToId: string
  assignedToName: string
  startDate: Date
  endDate: Date
  startTime?: string
  endTime?: string
  isAllDay: boolean
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  linkedItemId?: string
  linkedItemType?: 'priority' | 'csi' | 'custom'
  linkedItemRef?: string
  location?: string
  estimatedHours?: number
  notes?: string
  tags?: string[]
  createdById: string
  createdByName: string
}

export interface UpdateResourceAssignmentData {
  title?: string
  description?: string
  assignedToId?: string
  assignedToName?: string
  startDate?: Date
  endDate?: Date
  startTime?: string
  endTime?: string
  isAllDay?: boolean
  status?: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'
  priority?: 'Low' | 'Medium' | 'High' | 'Critical'
  location?: string
  estimatedHours?: number
  actualHours?: number
  notes?: string
  tags?: string[]
}

export class ResourcePlannerModel {
  static async createAssignment(data: CreateResourceAssignmentData): Promise<ResourceAssignment> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    const now = new Date()

    const newAssignment: Omit<ResourceAssignment, '_id'> = {
      title: data.title,
      description: data.description,
      assignedToId: new ObjectId(data.assignedToId),
      assignedToName: data.assignedToName,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      isAllDay: data.isAllDay,
      status: 'Scheduled',
      priority: data.priority,
      linkedItemId: data.linkedItemId ? new ObjectId(data.linkedItemId) : undefined,
      linkedItemType: data.linkedItemType,
      linkedItemRef: data.linkedItemRef,
      createdAt: now,
      updatedAt: now,
      createdById: new ObjectId(data.createdById),
      createdByName: data.createdByName,
      location: data.location,
      estimatedHours: data.estimatedHours,
      actualHours: 0,
      notes: data.notes,
      tags: data.tags || []
    }

    const result = await collection.insertOne(newAssignment)
    const assignment = await collection.findOne({ _id: result.insertedId })
    
    if (!assignment) {
      throw new Error('Failed to create resource assignment')
    }

    return assignment
  }

  static async getAllAssignments(): Promise<ResourceAssignment[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    return await collection.find({}).sort({ startDate: 1 }).toArray()
  }

  static async getAssignmentById(id: string | ObjectId): Promise<ResourceAssignment | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    return await collection.findOne({ _id: objectId })
  }

  static async getAssignmentsByDateRange(startDate: Date, endDate: Date): Promise<ResourceAssignment[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    return await collection.find({
      $or: [
        {
          startDate: { $gte: startDate, $lte: endDate }
        },
        {
          endDate: { $gte: startDate, $lte: endDate }
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ]
    }).sort({ startDate: 1 }).toArray()
  }

  static async getAssignmentsByUser(userId: string | ObjectId): Promise<ResourceAssignment[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId
    return await collection.find({ assignedToId: objectId }).sort({ startDate: 1 }).toArray()
  }

  static async getAssignmentsByStatus(status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled'): Promise<ResourceAssignment[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    return await collection.find({ status }).sort({ startDate: 1 }).toArray()
  }

  static async updateAssignment(id: string | ObjectId, updateData: UpdateResourceAssignmentData): Promise<ResourceAssignment | null> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

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

  static async deleteAssignment(id: string | ObjectId): Promise<boolean> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    const objectId = typeof id === 'string' ? new ObjectId(id) : id
    const result = await collection.deleteOne({ _id: objectId })

    return result.deletedCount === 1
  }

  static async getAssignmentsByLinkedItem(itemId: string | ObjectId, itemType: 'priority' | 'csi'): Promise<ResourceAssignment[]> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    const objectId = typeof itemId === 'string' ? new ObjectId(itemId) : itemId
    return await collection.find({ 
      linkedItemId: objectId, 
      linkedItemType: itemType 
    }).sort({ startDate: 1 }).toArray()
  }

  static async getStats(): Promise<{
    totalAssignments: number
    scheduled: number
    inProgress: number
    completed: number
    cancelled: number
    byUser: Array<{ user: string, count: number, hoursAllocated: number }>
    byPriority: Array<{ priority: string, count: number }>
    upcomingDeadlines: ResourceAssignment[]
  }> {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const collection = db.collection<ResourceAssignment>(COLLECTIONS.RESOURCE_PLANNER)

    const now = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(now.getDate() + 7)

    const [
      totalAssignments,
      scheduled,
      inProgress,
      completed,
      cancelled,
      byUser,
      byPriority,
      upcomingDeadlines
    ] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: 'Scheduled' }),
      collection.countDocuments({ status: 'In Progress' }),
      collection.countDocuments({ status: 'Completed' }),
      collection.countDocuments({ status: 'Cancelled' }),
      collection.aggregate([
        {
          $group: {
            _id: '$assignedToName',
            count: { $sum: 1 },
            hoursAllocated: { $sum: { $ifNull: ['$estimatedHours', 0] } }
          }
        },
        {
          $project: {
            user: '$_id',
            count: 1,
            hoursAllocated: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]).toArray().then(results => results as Array<{ user: string, count: number, hoursAllocated: number }>),
      collection.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            priority: '$_id',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]).toArray().then(results => results as Array<{ priority: string, count: number }>),
      collection.find({
        endDate: { $gte: now, $lte: nextWeek },
        status: { $in: ['Scheduled', 'In Progress'] }
      }).sort({ endDate: 1 }).limit(10).toArray()
    ])

    return {
      totalAssignments,
      scheduled,
      inProgress,
      completed,
      cancelled,
      byUser,
      byPriority,
      upcomingDeadlines
    }
  }
}