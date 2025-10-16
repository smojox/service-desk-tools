import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { ContactModel, UpdateContactData } from '@/lib/models/Contact'
import { PortalUserModel } from '@/lib/models/PortalUser'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const contact = await ContactModel.getItemById(resolvedParams.id)

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const resolvedParams = await params

    const updateData: UpdateContactData = { ...body }

    const contact = await ContactModel.updateItem(resolvedParams.id, updateData)

    if (!contact) {
      return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
    }

    // If portal access is enabled and password is provided, update/create portal user
    if (body.portalAccess && body.portalPassword) {
      try {
        // Check if portal user exists
        const existingPortalUser = await PortalUserModel.getItemByEmail(contact.email)

        if (existingPortalUser) {
          // Update password for existing portal user
          await PortalUserModel.resetPassword(existingPortalUser._id!.toString(), body.portalPassword)
        } else {
          // Create new portal user if doesn't exist
          await PortalUserModel.createItem({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            jobTitle: contact.jobTitle,
            companyId: contact.companyId.toString(),
            companyName: contact.companyName,
            password: body.portalPassword,
            role: 'user',
            createdById: session.user.id,
            createdByName: session.user.name
          })
        }
      } catch (portalError: any) {
        console.error('Error updating portal user:', portalError)
        // Continue even if portal user update fails
      }
    }

    return NextResponse.json({ contact })
  } catch (error: any) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.permissions?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const success = await ContactModel.deleteItem(resolvedParams.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
