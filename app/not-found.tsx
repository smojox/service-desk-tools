import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-400 via-cyan-500 to-green-400 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Page Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link href="/login">
                <Home className="mr-2 h-4 w-4" />
                Go to Login
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tools">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to Tools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}