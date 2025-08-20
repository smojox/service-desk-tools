import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'user' | 'viewer'
      permissions: {
        analytics: boolean
        appealCodes: boolean
        admin: boolean
      }
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'admin' | 'user' | 'viewer'
    permissions: {
      analytics: boolean
      appealCodes: boolean
      admin: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: 'admin' | 'user' | 'viewer'
    permissions: {
      analytics: boolean
      appealCodes: boolean
      admin: boolean
    }
  }
}