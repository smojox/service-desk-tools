import { NextResponse } from 'next/server'
import { UserModel } from '@/lib/models/User'

export async function POST() {
  try {
    const admin = await UserModel.createDefaultAdmin()
    
    if (admin) {
      return NextResponse.json({ 
        message: 'Default admin user created successfully',
        email: admin.email 
      })
    } else {
      return NextResponse.json({ 
        message: 'Admin user already exists' 
      })
    }
  } catch (error) {
    console.error('Error initializing admin:', error)
    return NextResponse.json(
      { error: 'Failed to initialize admin user' },
      { status: 500 }
    )
  }
}