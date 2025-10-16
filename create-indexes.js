/**
 * Create database indexes for optimal performance
 */

const { MongoClient } = require('mongodb')

const MONGODB_URI = 'mongodb+srv://servicedeskadmin:sR7XVzA0aiio7MVo@smojox.pz9ru6j.mongodb.net/?retryWrites=true&w=majority&appName=smojox'
const DB_NAME = 'ServiceDesk'

async function main() {
  console.log('📊 Creating database indexes for optimal performance...\n')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db(DB_NAME)

    // Create indexes for incidents collection
    console.log('Creating indexes for incidents collection...')
    const incidents = db.collection('incidents')

    await incidents.createIndex({ ref: 1 }, { unique: true, name: 'idx_incidents_ref' })
    console.log('  ✅ Created unique index on ref')

    await incidents.createIndex({ companyId: 1 }, { name: 'idx_incidents_companyId' })
    console.log('  ✅ Created index on companyId')

    await incidents.createIndex({ status: 1 }, { name: 'idx_incidents_status' })
    console.log('  ✅ Created index on status')

    await incidents.createIndex({ priority: 1 }, { name: 'idx_incidents_priority' })
    console.log('  ✅ Created index on priority')

    await incidents.createIndex({ dueByTime: 1 }, { name: 'idx_incidents_dueByTime' })
    console.log('  ✅ Created index on dueByTime')

    await incidents.createIndex({ slaStatus: 1 }, { name: 'idx_incidents_slaStatus' })
    console.log('  ✅ Created index on slaStatus')

    await incidents.createIndex({ createdAt: -1 }, { name: 'idx_incidents_createdAt' })
    console.log('  ✅ Created index on createdAt (descending)')

    await incidents.createIndex({
      companyId: 1,
      status: 1,
      priority: 1
    }, { name: 'idx_incidents_compound' })
    console.log('  ✅ Created compound index on companyId + status + priority')

    console.log()

    // Create indexes for companies collection
    console.log('Creating indexes for companies collection...')
    const companies = db.collection('companies')

    await companies.createIndex({ companyCode: 1 }, { unique: true, name: 'idx_companies_code' })
    console.log('  ✅ Created unique index on companyCode')

    await companies.createIndex({ domain: 1 }, { name: 'idx_companies_domain' })
    console.log('  ✅ Created index on domain')

    await companies.createIndex({ active: 1 }, { name: 'idx_companies_active' })
    console.log('  ✅ Created index on active')

    console.log()

    // Create indexes for sla_definitions collection
    console.log('Creating indexes for sla_definitions collection...')
    const slaDefinitions = db.collection('sla_definitions')

    await slaDefinitions.createIndex({ name: 1 }, { unique: true, name: 'idx_sla_name' })
    console.log('  ✅ Created unique index on name')

    await slaDefinitions.createIndex({ tier: 1 }, { name: 'idx_sla_tier' })
    console.log('  ✅ Created index on tier')

    await slaDefinitions.createIndex({ isDefault: 1 }, { name: 'idx_sla_isDefault' })
    console.log('  ✅ Created index on isDefault')

    console.log()

    // Create indexes for portal_users collection
    console.log('Creating indexes for portal_users collection...')
    const portalUsers = db.collection('portal_users')

    await portalUsers.createIndex({ email: 1 }, { unique: true, name: 'idx_portal_users_email' })
    console.log('  ✅ Created unique index on email')

    await portalUsers.createIndex({ companyId: 1 }, { name: 'idx_portal_users_companyId' })
    console.log('  ✅ Created index on companyId')

    await portalUsers.createIndex({ verified: 1 }, { name: 'idx_portal_users_verified' })
    console.log('  ✅ Created index on verified')

    await portalUsers.createIndex({ magicLinkToken: 1 }, { name: 'idx_portal_users_token', sparse: true })
    console.log('  ✅ Created sparse index on magicLinkToken')

    console.log()

    // Create indexes for users collection
    console.log('Creating indexes for users collection...')
    const users = db.collection('users')

    await users.createIndex({ email: 1 }, { unique: true, name: 'idx_users_email' })
    console.log('  ✅ Created unique index on email')

    await users.createIndex({ role: 1 }, { name: 'idx_users_role' })
    console.log('  ✅ Created index on role')

    await users.createIndex({ isActive: 1 }, { name: 'idx_users_isActive' })
    console.log('  ✅ Created index on isActive')

    console.log()

    // List all indexes
    console.log('📋 Verifying indexes...')

    const incidentIndexes = await incidents.indexes()
    console.log(`\n  Incidents collection: ${incidentIndexes.length} indexes`)
    incidentIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    const companyIndexes = await companies.indexes()
    console.log(`\n  Companies collection: ${companyIndexes.length} indexes`)
    companyIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    const slaIndexes = await slaDefinitions.indexes()
    console.log(`\n  SLA Definitions collection: ${slaIndexes.length} indexes`)
    slaIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    const portalUserIndexes = await portalUsers.indexes()
    console.log(`\n  Portal Users collection: ${portalUserIndexes.length} indexes`)
    portalUserIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    const userIndexes = await users.indexes()
    console.log(`\n  Users collection: ${userIndexes.length} indexes`)
    userIndexes.forEach(idx => {
      console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}`)
    })

    console.log()
    console.log('🎉 All indexes created successfully!')
    console.log()
    console.log('💡 Benefits:')
    console.log('   - Faster incident lookups by ref, status, priority, and company')
    console.log('   - Improved query performance for SLA tracking')
    console.log('   - Optimized filtering and sorting operations')
    console.log('   - Better performance for dashboard statistics')

  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️  Some indexes already exist (this is normal)')
    } else {
      console.error('❌ Error:', error)
    }
  } finally {
    await client.close()
    console.log()
    console.log('✅ Disconnected from MongoDB')
  }
}

main()
