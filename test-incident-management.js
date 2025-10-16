/**
 * Test script for Incident Management module
 * This script will:
 * 1. Create a default admin user if needed
 * 2. Initialize SLA definitions
 * 3. Create a test company
 * 4. Create test incidents
 * 5. Test the API endpoints
 */

const { MongoClient, ObjectId } = require('mongodb')
const bcrypt = require('bcryptjs')

const MONGODB_URI = 'mongodb+srv://servicedeskadmin:sR7XVzA0aiio7MVo@smojox.pz9ru6j.mongodb.net/?retryWrites=true&w=majority&appName=smojox'
const DB_NAME = 'ServiceDesk'

async function main() {
  console.log('🚀 Starting Incident Management Module Test...\n')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db(DB_NAME)

    // Step 1: Create default admin user
    console.log('📝 Step 1: Creating admin user...')
    const usersCollection = db.collection('users')
    const adminExists = await usersCollection.findOne({ role: 'admin' })

    let adminUser
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      const result = await usersCollection.insertOne({
        email: 'admin@taranto.com',
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        permissions: {
          analytics: true,
          appealCodes: true,
          admin: true
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      adminUser = await usersCollection.findOne({ _id: result.insertedId })
      console.log('✅ Admin user created: admin@taranto.com / admin123')
    } else {
      adminUser = adminExists
      console.log('✅ Admin user already exists: admin@taranto.com')
    }
    console.log()

    // Step 2: Initialize SLA definitions
    console.log('📝 Step 2: Creating SLA definitions...')
    const slaCollection = db.collection('sla_definitions')

    // Check if default SLA exists
    let defaultSLA = await slaCollection.findOne({ isDefault: true })

    if (!defaultSLA) {
      const defaultSLAResult = await slaCollection.insertOne({
        name: 'Standard SLA',
        description: 'Standard service level agreement with baseline response times',
        tier: 3,
        criticalResponseHours: 1,
        highResponseHours: 4,
        mediumResponseHours: 8,
        lowResponseHours: 24,
        criticalResolutionHours: 4,
        highResolutionHours: 24,
        mediumResolutionHours: 72,
        lowResolutionHours: 168,
        useBusinessHoursOnly: false,
        autoEscalation: true,
        escalationThresholdPercent: 80,
        notificationSettings: {
          notifyOnCreate: true,
          notifyOnUpdate: true,
          notifyOnSLABreach: true,
          notifyOnEscalation: true
        },
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      defaultSLA = await slaCollection.findOne({ _id: defaultSLAResult.insertedId })
      console.log('✅ Created Standard SLA')
    } else {
      console.log('✅ Standard SLA already exists')
    }

    // Create Gold SLA
    let goldSLA = await slaCollection.findOne({ name: 'Gold SLA' })
    if (!goldSLA) {
      const goldSLAResult = await slaCollection.insertOne({
        name: 'Gold SLA',
        description: 'Premium support tier with fastest response times',
        tier: 1,
        criticalResponseHours: 0.5,
        highResponseHours: 2,
        mediumResponseHours: 4,
        lowResponseHours: 12,
        criticalResolutionHours: 2,
        highResolutionHours: 8,
        mediumResolutionHours: 24,
        lowResolutionHours: 72,
        useBusinessHoursOnly: false,
        autoEscalation: true,
        escalationThresholdPercent: 70,
        notificationSettings: {
          notifyOnCreate: true,
          notifyOnUpdate: true,
          notifyOnSLABreach: true,
          notifyOnEscalation: true
        },
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      goldSLA = await slaCollection.findOne({ _id: goldSLAResult.insertedId })
      console.log('✅ Created Gold SLA')
    } else {
      console.log('✅ Gold SLA already exists')
    }

    // Create Silver SLA
    let silverSLA = await slaCollection.findOne({ name: 'Silver SLA' })
    if (!silverSLA) {
      await slaCollection.insertOne({
        name: 'Silver SLA',
        description: 'Enhanced support tier with priority response',
        tier: 2,
        criticalResponseHours: 1,
        highResponseHours: 3,
        mediumResponseHours: 6,
        lowResponseHours: 18,
        criticalResolutionHours: 4,
        highResolutionHours: 16,
        mediumResolutionHours: 48,
        lowResolutionHours: 120,
        useBusinessHoursOnly: false,
        autoEscalation: true,
        escalationThresholdPercent: 75,
        notificationSettings: {
          notifyOnCreate: true,
          notifyOnUpdate: true,
          notifyOnSLABreach: true,
          notifyOnEscalation: true
        },
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ Created Silver SLA')
    } else {
      console.log('✅ Silver SLA already exists')
    }
    console.log()

    // Step 3: Create test companies
    console.log('📝 Step 3: Creating test companies...')
    const companiesCollection = db.collection('companies')

    let acmeCompany = await companiesCollection.findOne({ companyCode: 'ACME001' })
    if (!acmeCompany) {
      const acmeResult = await companiesCollection.insertOne({
        name: 'Acme Corporation',
        domain: 'acme.com',
        companyCode: 'ACME001',
        slaId: goldSLA._id,
        slaName: 'Gold SLA',
        portalEnabled: true,
        portalBranding: {
          logoUrl: '',
          primaryColor: '#2563eb',
          companyName: 'Acme Corporation'
        },
        contacts: [
          {
            name: 'John Smith',
            email: 'john.smith@acme.com',
            phone: '+1-555-0100',
            isPrimary: true
          }
        ],
        totalIncidents: 0,
        openIncidents: 0,
        slaComplianceRate: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      acmeCompany = await companiesCollection.findOne({ _id: acmeResult.insertedId })
      console.log('✅ Created Acme Corporation (Gold SLA)')
    } else {
      console.log('✅ Acme Corporation already exists')
    }

    let globalTechCompany = await companiesCollection.findOne({ companyCode: 'GLOB001' })
    if (!globalTechCompany) {
      const globalResult = await companiesCollection.insertOne({
        name: 'Global Tech Solutions',
        domain: 'globaltech.com',
        companyCode: 'GLOB001',
        slaId: defaultSLA._id,
        slaName: 'Standard SLA',
        portalEnabled: true,
        portalBranding: {
          logoUrl: '',
          primaryColor: '#059669',
          companyName: 'Global Tech Solutions'
        },
        contacts: [
          {
            name: 'Sarah Johnson',
            email: 'sarah.johnson@globaltech.com',
            phone: '+1-555-0200',
            isPrimary: true
          }
        ],
        totalIncidents: 0,
        openIncidents: 0,
        slaComplianceRate: 0,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      globalTechCompany = await companiesCollection.findOne({ _id: globalResult.insertedId })
      console.log('✅ Created Global Tech Solutions (Standard SLA)')
    } else {
      console.log('✅ Global Tech Solutions already exists')
    }
    console.log()

    // Step 4: Create test incidents
    console.log('📝 Step 4: Creating test incidents...')
    const incidentsCollection = db.collection('incidents')

    // Helper function to calculate priority
    const calculatePriority = (urgency, impact) => {
      const matrix = {
        'Critical': { 'Critical': 'Critical', 'High': 'Critical', 'Medium': 'High', 'Low': 'High' },
        'High': { 'Critical': 'Critical', 'High': 'High', 'Medium': 'High', 'Low': 'Medium' },
        'Medium': { 'Critical': 'High', 'High': 'High', 'Medium': 'Medium', 'Low': 'Low' },
        'Low': { 'Critical': 'High', 'High': 'Medium', 'Medium': 'Low', 'Low': 'Low' }
      }
      return matrix[urgency][impact]
    }

    // Helper function to calculate SLA times
    const calculateSLATimes = (createdAt, priority, sla) => {
      let resolutionHours, responseHours

      switch (priority) {
        case 'Critical':
          resolutionHours = sla.criticalResolutionHours
          responseHours = sla.criticalResponseHours
          break
        case 'High':
          resolutionHours = sla.highResolutionHours
          responseHours = sla.highResponseHours
          break
        case 'Medium':
          resolutionHours = sla.mediumResolutionHours
          responseHours = sla.mediumResponseHours
          break
        case 'Low':
          resolutionHours = sla.lowResolutionHours
          responseHours = sla.lowResponseHours
          break
      }

      const dueByTime = new Date(createdAt.getTime() + (resolutionHours * 60 * 60 * 1000))
      const responseByTime = new Date(createdAt.getTime() + (responseHours * 60 * 60 * 1000))

      return { dueByTime, responseByTime }
    }

    // Helper function to get next incident reference
    const getNextIncidentRef = async () => {
      const year = new Date().getFullYear()
      const prefix = `INC-${year}-`

      const lastIncident = await incidentsCollection.findOne(
        { ref: { $regex: `^${prefix}` } },
        { sort: { ref: -1 } }
      )

      if (lastIncident) {
        const lastNum = parseInt(lastIncident.ref.split('-')[2])
        return `${prefix}${String(lastNum + 1).padStart(4, '0')}`
      }

      return `${prefix}0001`
    }

    // Create critical incident for Acme
    const criticalRef = await getNextIncidentRef()
    const criticalCreatedAt = new Date()
    const criticalPriority = calculatePriority('Critical', 'Critical')
    const criticalSLA = calculateSLATimes(criticalCreatedAt, criticalPriority, goldSLA)

    const critical = await incidentsCollection.insertOne({
      ref: criticalRef,
      subject: 'Production database server down',
      description: 'The main production database server is completely unresponsive. All customer-facing applications are affected. This is impacting approximately 10,000 active users.',
      companyId: acmeCompany._id,
      companyName: acmeCompany.name,
      companyCode: acmeCompany.companyCode,
      priority: criticalPriority,
      urgency: 'Critical',
      impact: 'Critical',
      category: 'Technical',
      subcategory: 'Infrastructure',
      status: 'Open',
      slaId: goldSLA._id,
      slaName: goldSLA.name,
      dueByTime: criticalSLA.dueByTime,
      responseByTime: criticalSLA.responseByTime,
      slaStatus: 'Within SLA',
      createdAt: criticalCreatedAt,
      updatedAt: criticalCreatedAt,
      createdById: adminUser._id.toString(),
      createdByName: adminUser.name,
      assignedToId: adminUser._id.toString(),
      assignedToName: adminUser.name,
      customerUpdates: [],
      internalNotes: [],
      freshdeskTicketId: 'FD-12345',
      jiraIssueKey: 'SUP-789',
      tags: ['production', 'database', 'urgent']
    })
    console.log(`✅ Created Critical incident: ${criticalRef}`)

    // Create high priority incident for Acme
    const highRef = await getNextIncidentRef()
    const highCreatedAt = new Date()
    const highPriority = calculatePriority('High', 'High')
    const highSLA = calculateSLATimes(highCreatedAt, highPriority, goldSLA)

    await incidentsCollection.insertOne({
      ref: highRef,
      subject: 'Email integration failing for multiple users',
      description: 'Several users are reporting that their email integration is not syncing properly. Affects approximately 50 users in the sales department.',
      companyId: acmeCompany._id,
      companyName: acmeCompany.name,
      companyCode: acmeCompany.companyCode,
      priority: highPriority,
      urgency: 'High',
      impact: 'High',
      category: 'Technical',
      subcategory: 'Application',
      status: 'In Progress',
      slaId: goldSLA._id,
      slaName: goldSLA.name,
      dueByTime: highSLA.dueByTime,
      responseByTime: highSLA.responseByTime,
      slaStatus: 'Within SLA',
      createdAt: highCreatedAt,
      updatedAt: highCreatedAt,
      createdById: adminUser._id.toString(),
      createdByName: adminUser.name,
      assignedToId: adminUser._id.toString(),
      assignedToName: adminUser.name,
      customerUpdates: [
        {
          id: new ObjectId().toString(),
          content: 'We have identified the issue with the email integration. Our team is working on a fix.',
          addedAt: new Date(),
          addedById: adminUser._id.toString(),
          addedByName: adminUser.name,
          addedByType: 'agent',
          visibleToCustomer: true
        }
      ],
      internalNotes: [
        {
          id: new ObjectId().toString(),
          content: 'Issue appears to be with OAuth token refresh. Checking API logs.',
          addedAt: new Date(),
          addedById: adminUser._id.toString(),
          addedByName: adminUser.name,
          noteType: 'standard'
        }
      ],
      freshdeskTicketId: 'FD-12346',
      tags: ['email', 'integration', 'sales']
    })
    console.log(`✅ Created High priority incident: ${highRef}`)

    // Create medium priority incident for Global Tech
    const mediumRef = await getNextIncidentRef()
    const mediumCreatedAt = new Date()
    const mediumPriority = calculatePriority('Medium', 'Medium')
    const mediumSLA = calculateSLATimes(mediumCreatedAt, mediumPriority, defaultSLA)

    await incidentsCollection.insertOne({
      ref: mediumRef,
      subject: 'Report generation taking longer than expected',
      description: 'Monthly reports are taking 2-3 times longer to generate than usual. Not blocking work but causing delays.',
      companyId: globalTechCompany._id,
      companyName: globalTechCompany.name,
      companyCode: globalTechCompany.companyCode,
      priority: mediumPriority,
      urgency: 'Medium',
      impact: 'Medium',
      category: 'Technical',
      subcategory: 'Performance',
      status: 'Open',
      slaId: defaultSLA._id,
      slaName: defaultSLA.name,
      dueByTime: mediumSLA.dueByTime,
      responseByTime: mediumSLA.responseByTime,
      slaStatus: 'Within SLA',
      createdAt: mediumCreatedAt,
      updatedAt: mediumCreatedAt,
      createdById: adminUser._id.toString(),
      createdByName: adminUser.name,
      customerUpdates: [],
      internalNotes: [],
      tags: ['performance', 'reports']
    })
    console.log(`✅ Created Medium priority incident: ${mediumRef}`)

    // Create resolved incident
    const resolvedRef = await getNextIncidentRef()
    const resolvedCreatedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    const resolvedPriority = calculatePriority('High', 'Medium')
    const resolvedSLA = calculateSLATimes(resolvedCreatedAt, resolvedPriority, defaultSLA)

    await incidentsCollection.insertOne({
      ref: resolvedRef,
      subject: 'User unable to access reporting dashboard',
      description: 'A user reported they cannot access the reporting dashboard. Getting a 403 error.',
      companyId: globalTechCompany._id,
      companyName: globalTechCompany.name,
      companyCode: globalTechCompany.companyCode,
      priority: resolvedPriority,
      urgency: 'High',
      impact: 'Medium',
      category: 'Technical',
      subcategory: 'Access Control',
      status: 'Resolved',
      slaId: defaultSLA._id,
      slaName: defaultSLA.name,
      dueByTime: resolvedSLA.dueByTime,
      responseByTime: resolvedSLA.responseByTime,
      slaStatus: 'Within SLA',
      createdAt: resolvedCreatedAt,
      updatedAt: new Date(),
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      createdById: adminUser._id.toString(),
      createdByName: adminUser.name,
      assignedToId: adminUser._id.toString(),
      assignedToName: adminUser.name,
      resolution: 'User permissions were incorrectly configured. Updated user role to include reporting access.',
      customerUpdates: [
        {
          id: new ObjectId().toString(),
          content: 'We have resolved the issue. You should now be able to access the reporting dashboard.',
          addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          addedById: adminUser._id.toString(),
          addedByName: adminUser.name,
          addedByType: 'agent',
          visibleToCustomer: true
        }
      ],
      internalNotes: [
        {
          id: new ObjectId().toString(),
          content: 'Updated user permissions in admin panel.',
          addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          addedById: adminUser._id.toString(),
          addedByName: adminUser.name,
          noteType: 'resolution'
        }
      ],
      freshdeskTicketId: 'FD-12300',
      tags: ['access', 'permissions', 'resolved']
    })
    console.log(`✅ Created Resolved incident: ${resolvedRef}`)

    console.log()

    // Step 5: Update company statistics
    console.log('📝 Step 5: Updating company statistics...')

    const acmeIncidents = await incidentsCollection.find({ companyId: acmeCompany._id }).toArray()
    const acmeOpenIncidents = acmeIncidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length
    const acmeWithinSLA = acmeIncidents.filter(i => i.slaStatus === 'Within SLA').length
    const acmeComplianceRate = acmeIncidents.length > 0 ? (acmeWithinSLA / acmeIncidents.length) * 100 : 0

    await companiesCollection.updateOne(
      { _id: acmeCompany._id },
      {
        $set: {
          totalIncidents: acmeIncidents.length,
          openIncidents: acmeOpenIncidents,
          slaComplianceRate: acmeComplianceRate,
          updatedAt: new Date()
        }
      }
    )
    console.log(`✅ Updated Acme Corporation stats: ${acmeIncidents.length} total, ${acmeOpenIncidents} open, ${acmeComplianceRate.toFixed(1)}% SLA compliance`)

    const globalIncidents = await incidentsCollection.find({ companyId: globalTechCompany._id }).toArray()
    const globalOpenIncidents = globalIncidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length
    const globalWithinSLA = globalIncidents.filter(i => i.slaStatus === 'Within SLA').length
    const globalComplianceRate = globalIncidents.length > 0 ? (globalWithinSLA / globalIncidents.length) * 100 : 0

    await companiesCollection.updateOne(
      { _id: globalTechCompany._id },
      {
        $set: {
          totalIncidents: globalIncidents.length,
          openIncidents: globalOpenIncidents,
          slaComplianceRate: globalComplianceRate,
          updatedAt: new Date()
        }
      }
    )
    console.log(`✅ Updated Global Tech Solutions stats: ${globalIncidents.length} total, ${globalOpenIncidents} open, ${globalComplianceRate.toFixed(1)}% SLA compliance`)

    console.log()
    console.log('🎉 Test data created successfully!')
    console.log()
    console.log('📊 Summary:')
    console.log(`   - Admin user: admin@taranto.com / admin123`)
    console.log(`   - SLA definitions: 3 (Gold, Silver, Standard)`)
    console.log(`   - Companies: 2 (Acme Corporation, Global Tech Solutions)`)
    console.log(`   - Incidents: 4 (1 Critical, 1 High, 1 Medium, 1 Resolved)`)
    console.log()
    console.log('🌐 You can now:')
    console.log(`   1. Login at http://localhost:3000/login`)
    console.log(`   2. Go to Tools Hub: http://localhost:3000/tools`)
    console.log(`   3. Click on "Incident Management" widget`)
    console.log(`   4. Or directly visit: http://localhost:3000/incident-management`)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log()
    console.log('✅ Disconnected from MongoDB')
  }
}

main()
