import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import clientPromise, { DB_NAME, COLLECTIONS } from '@/lib/mongodb'
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can run cleanup
    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const contactsCollection = db.collection<Contact>(COLLECTIONS.CONTACTS)

    // Aggregate to find duplicate emails
    const duplicates = await contactsCollection.aggregate([
      {
        $group: {
          _id: { email: '$email', companyId: '$companyId' },
          count: { $sum: 1 },
          contacts: { $push: { _id: '$_id', name: '$name', createdAt: '$createdAt', email: '$email' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()

    if (duplicates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No duplicate contacts found',
        deleted: 0,
        details: []
      })
    }

    const deletedContacts: any[] = []
    let totalDeleted = 0

    for (const duplicate of duplicates) {
      const email = duplicate._id.email
      const contacts = duplicate.contacts as Array<{ _id: ObjectId; name: string; createdAt: Date; email: string }>

      // Sort by creation date to keep the oldest
      contacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

      // Delete all but the first one
      const toDelete = contacts.slice(1)
      for (const contact of toDelete) {
        await contactsCollection.deleteOne({ _id: contact._id })
        totalDeleted++
        deletedContacts.push({
          id: contact._id.toString(),
          name: contact.name,
          email: contact.email,
          createdAt: contact.createdAt
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup complete! Deleted ${totalDeleted} duplicate contacts.`,
      deleted: totalDeleted,
      details: deletedContacts
    })
  } catch (error: any) {
    console.error('Error cleaning up duplicate contacts:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
