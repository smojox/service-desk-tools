/**
 * Script to clean up duplicate contacts
 *
 * This script finds contacts with duplicate email addresses and keeps only the first one,
 * deleting all subsequent duplicates.
 *
 * Usage: npx ts-node scripts/cleanup-duplicate-contacts.ts
 */

import clientPromise, { DB_NAME, COLLECTIONS } from '../lib/mongodb'
import { ObjectId } from 'mongodb'

interface Contact {
  _id?: ObjectId
  name: string
  email: string
  phone?: string
  companyId: ObjectId
  companyName: string
  createdAt: Date
}

async function cleanupDuplicateContacts() {
  try {
    console.log('Connecting to database...')
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const contactsCollection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    console.log('Finding duplicate contacts...')

    // Aggregate to find duplicate emails
    const duplicates = await contactsCollection.aggregate([
      {
        $group: {
          _id: { email: '$email', companyId: '$companyId' },
          count: { $sum: 1 },
          contacts: { $push: { _id: '$_id', name: '$name', createdAt: '$createdAt' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()

    if (duplicates.length === 0) {
      console.log('No duplicate contacts found!')
      return
    }

    console.log(`Found ${duplicates.length} sets of duplicate contacts:`)

    let totalDeleted = 0

    for (const duplicate of duplicates) {
      const email = duplicate._id.email
      const contacts = duplicate.contacts as Array<{ _id: ObjectId; name: string; createdAt: Date }>

      // Sort by creation date to keep the oldest
      contacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      console.log(`\n  Email: ${email}`)
      console.log(`  Total: ${contacts.length} contacts`)
      console.log(`  Keeping: ${contacts[0].name} (ID: ${contacts[0]._id}, Created: ${contacts[0].createdAt})`)

      // Delete all but the first one
      const toDelete = contacts.slice(1)
      for (const contact of toDelete) {
        console.log(`  Deleting: ${contact.name} (ID: ${contact._id}, Created: ${contact.createdAt})`)
        await contactsCollection.deleteOne({ _id: contact._id })
        totalDeleted++
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate contacts.`)
  } catch (error) {
    console.error('Error cleaning up duplicate contacts:', error)
    throw error
  }
}

// Run the cleanup
cleanupDuplicateContacts()
  .then(() => {
    console.log('\nScript completed successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nScript failed:', error)
    process.exit(1)
  })
