import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserModel } from "@/lib/models/User"

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials")
        }

        try {
          // Skip MongoDB connection during build
          if (process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI) {
            return null
          }

          // Find user by email
          const user = await UserModel.findByEmail(credentials.email as string)
          
          if (!user) {
            throw new Error("Invalid credentials")
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated")
          }

          // Validate password
          const isValid = await UserModel.validatePassword(
            credentials.password as string,
            user.password
          )

          if (!isValid) {
            throw new Error("Invalid credentials")
          }

          // Update last login
          await UserModel.updateLastLogin(user._id!)

          return {
            id: user._id!.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always redirect to /tools after successful login
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/tools`
      }
      // Allow relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/tools`
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.permissions = token.permissions as any
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}