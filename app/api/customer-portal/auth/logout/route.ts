import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the portal token cookie
    response.cookies.set('portal_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response
  } catch (error: any) {
    console.error('Error in portal logout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
