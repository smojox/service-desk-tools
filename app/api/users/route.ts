import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { UserModel, CreateUserData } from '@/lib/models/User'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await UserModel.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.permissions.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, password, name, role, permissions } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate role
    if (!['admin', 'user', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Set default permissions based on role if not provided
    const userPermissions = permissions || {
      analytics: role !== 'viewer',
      appealCodes: role !== 'viewer', 
      admin: role === 'admin'
    }

    const userData: CreateUserData = {
      email,
      password,
      name,
      role,
      permissions: userPermissions
    }

    const user = await UserModel.createUser(userData)
    
    // Remove password from response
    const { password: _, ...userResponse } = user
    
    return NextResponse.json(userResponse, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    if (error.message === 'User already exists with this email') {
      return NextResponse.json({ error: 'User already exists with this email' }, { status: 409 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}