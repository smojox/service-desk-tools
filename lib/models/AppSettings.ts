/**
 * App Settings Model
 * Manages application-wide configuration including widget visibility
 */

import { MongoClient, Db, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const DB_NAME = 'ServiceDesk'
const COLLECTION_NAME = 'app_settings'

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

export interface WidgetConfig {
  id: string
  name: string
  enabled: boolean
  order: number
  requiresPermission?: string
}

export interface AppSettings {
  _id?: ObjectId
  settingsType: 'widget_config'
  widgets: WidgetConfig[]
  updatedAt: Date
  updatedBy?: string
}

export class AppSettingsModel {
  /**
   * Get widget configuration
   */
  static async getWidgetConfig(): Promise<WidgetConfig[]> {
    const { db } = await connectToDatabase()
    const collection = db.collection<AppSettings>(COLLECTION_NAME)

    const settings = await collection.findOne({ settingsType: 'widget_config' })

    if (!settings) {
      // Return default configuration
      return [
        { id: 'incident-management', name: 'Incident Management', enabled: true, order: 1 },
        { id: 'analytics', name: 'Service Desk Analytics', enabled: true, order: 2, requiresPermission: 'analytics' },
        { id: 'appeal-codes', name: 'Appeal Codes', enabled: true, order: 3, requiresPermission: 'appealCodes' },
        { id: 'jira', name: 'JIRA Support Assists', enabled: true, order: 4 },
        { id: 'support-dev', name: 'Support Dev Items', enabled: true, order: 5 },
        { id: 'priority-tracker', name: 'Priority Tracker', enabled: true, order: 6 },
        { id: 'csi-tracker', name: 'CSI Tracker', enabled: true, order: 7 },
        { id: 'resource-planner', name: 'Resource Planner', enabled: true, order: 8 }
      ]
    }

    return settings.widgets
  }

  /**
   * Update widget configuration
   */
  static async updateWidgetConfig(widgets: WidgetConfig[], updatedBy?: string): Promise<boolean> {
    const { db } = await connectToDatabase()
    const collection = db.collection<AppSettings>(COLLECTION_NAME)

    const result = await collection.updateOne(
      { settingsType: 'widget_config' },
      {
        $set: {
          widgets,
          updatedAt: new Date(),
          updatedBy
        }
      },
      { upsert: true }
    )

    return result.acknowledged
  }

  /**
   * Initialize default widget configuration
   */
  static async initializeDefaults(): Promise<void> {
    const { db } = await connectToDatabase()
    const collection = db.collection<AppSettings>(COLLECTION_NAME)

    const exists = await collection.findOne({ settingsType: 'widget_config' })

    if (!exists) {
      await collection.insertOne({
        settingsType: 'widget_config',
        widgets: [
          { id: 'incident-management', name: 'Incident Management', enabled: true, order: 1 },
          { id: 'analytics', name: 'Service Desk Analytics', enabled: true, order: 2, requiresPermission: 'analytics' },
          { id: 'appeal-codes', name: 'Appeal Codes', enabled: true, order: 3, requiresPermission: 'appealCodes' },
          { id: 'jira', name: 'JIRA Support Assists', enabled: true, order: 4 },
          { id: 'support-dev', name: 'Support Dev Items', enabled: true, order: 5 },
          { id: 'priority-tracker', name: 'Priority Tracker', enabled: true, order: 6 },
          { id: 'csi-tracker', name: 'CSI Tracker', enabled: true, order: 7 },
          { id: 'resource-planner', name: 'Resource Planner', enabled: true, order: 8 }
        ],
        updatedAt: new Date()
      })
    }
  }
}
