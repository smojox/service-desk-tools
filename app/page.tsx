import { redirect } from 'next/navigation'

export default function HomePage() {
  // Server-side redirect to login page
  // Users will be redirected to tools after authentication
  redirect('/login')
}