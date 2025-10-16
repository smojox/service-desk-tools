/**
 * Initialize Widget Configuration
 * Creates default widget visibility settings in the database
 */

const { MongoClient } = require('mongodb')

const MONGODB_URI = 'mongodb+srv://servicedeskadmin:sR7XVzA0aiio7MVo@smojox.pz9ru6j.mongodb.net/?retryWrites=true&w=majority&appName=smojox'
const DB_NAME = 'ServiceDesk'

async function main() {
  console.log('🎨 Initializing widget configuration...\n')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db(DB_NAME)
    const collection = db.collection('app_settings')

    // Check if widget config already exists
    const existing = await collection.findOne({ settingsType: 'widget_config' })

    if (existing) {
      console.log('⚠️  Widget configuration already exists')
      console.log('\nCurrent configuration:')
      existing.widgets.forEach(widget => {
        const status = widget.enabled ? '✅ Visible' : '❌ Hidden'
        console.log(`   ${status} - ${widget.name}`)
      })
    } else {
      // Create default configuration
      const defaultWidgets = [
        { id: 'incident-management', name: 'Incident Management', enabled: true, order: 1 },
        { id: 'analytics', name: 'Service Desk Analytics', enabled: true, order: 2, requiresPermission: 'analytics' },
        { id: 'appeal-codes', name: 'Appeal Codes', enabled: true, order: 3, requiresPermission: 'appealCodes' },
        { id: 'jira', name: 'JIRA Support Assists', enabled: true, order: 4 },
        { id: 'support-dev', name: 'Support Dev Items', enabled: true, order: 5 },
        { id: 'priority-tracker', name: 'Priority Tracker', enabled: true, order: 6 },
        { id: 'csi-tracker', name: 'CSI Tracker', enabled: true, order: 7 },
        { id: 'resource-planner', name: 'Resource Planner', enabled: true, order: 8 }
      ]

      await collection.insertOne({
        settingsType: 'widget_config',
        widgets: defaultWidgets,
        updatedAt: new Date()
      })

      console.log('✅ Default widget configuration created\n')
      console.log('Widgets initialized:')
      defaultWidgets.forEach(widget => {
        const status = widget.enabled ? '✅ Visible' : '❌ Hidden'
        const permission = widget.requiresPermission ? ` (requires ${widget.requiresPermission})` : ''
        console.log(`   ${status} - ${widget.name}${permission}`)
      })
    }

    console.log('\n💡 Widget configuration can be managed from the Admin Panel')
    console.log('   Navigate to: http://localhost:3000/admin → Widget Configuration tab')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

main()
