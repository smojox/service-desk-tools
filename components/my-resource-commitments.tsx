"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, User, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { format, isToday, isTomorrow, startOfDay, endOfDay } from "date-fns"
import { ResourceAssignment } from "@/lib/models/ResourcePlanner"

interface MyResourceCommitmentsProps {
  className?: string
}

export default function MyResourceCommitments({ className }: MyResourceCommitmentsProps) {
  const { data: session } = useSession()
  const [todaysCommitments, setTodaysCommitments] = useState<ResourceAssignment[]>([])
  const [upcomingCommitments, setUpcomingCommitments] = useState<ResourceAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchResourceCommitments = async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError("")
      
      const today = new Date()
      const startOfToday = startOfDay(today)
      const endOfToday = endOfDay(today)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 7) // Next 7 days

      const url = `/api/resource-planner?assignedToId=${session.user.id}&startDate=${startOfToday.toISOString()}&endDate=${tomorrow.toISOString()}`

      // Fetch assignments for the user within date range
      const response = await fetch(url)
      
      if (response.ok) {
        const assignments = await response.json()
        
        // Filter for today's commitments
        const today_commitments = assignments.filter((assignment: ResourceAssignment) => {
          const assignmentStart = new Date(assignment.startDate)
          const assignmentEnd = new Date(assignment.endDate)
          return (
            (assignmentStart <= endOfToday && assignmentEnd >= startOfToday) &&
            (assignment.status === 'Scheduled' || assignment.status === 'In Progress')
          )
        })

        // Filter for upcoming commitments (next 7 days, excluding today)
        const upcoming_commitments = assignments.filter((assignment: ResourceAssignment) => {
          const assignmentStart = new Date(assignment.startDate)
          return (
            assignmentStart > endOfToday &&
            (assignment.status === 'Scheduled' || assignment.status === 'In Progress')
          )
        }).slice(0, 3) // Limit to 3 upcoming items

        setTodaysCommitments(today_commitments)
        setUpcomingCommitments(upcoming_commitments)
      } else {
        setError('Failed to load resource commitments')
      }
    } catch (error) {
      setError('Error loading commitments')
      console.error('Error fetching resource commitments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResourceCommitments()
  }, [session])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <Clock className="h-3 w-3" />
      case 'Scheduled':
        return <CalendarDays className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatTimeRange = (assignment: ResourceAssignment) => {
    if (assignment.isAllDay) {
      return 'All Day'
    }
    if (assignment.startTime && assignment.endTime) {
      return `${assignment.startTime} - ${assignment.endTime}`
    }
    return 'No time specified'
  }

  if (loading) {
    return (
      <Card className={`border-gray-200 bg-white/90 backdrop-blur-sm ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-gray-200 bg-white/90 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-800 text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Due Today
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        ) : (
          <>
            {/* Today's Commitments */}
            <div>
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Today ({format(new Date(), 'MMM d')})
              </h4>
              {todaysCommitments.length === 0 ? (
                <p className="text-gray-700 text-sm bg-gray-100 p-3 rounded">
                  No commitments scheduled for today
                </p>
              ) : (
                <div className="space-y-2">
                  {todaysCommitments.map((commitment) => (
                    <div key={commitment._id?.toString()} className="bg-gray-50 p-3 rounded border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 text-sm">{commitment.title}</h5>
                        <div className="flex gap-1 ml-2">
                          <Badge variant="outline" className={`text-xs ${getStatusColor(commitment.status)}`}>
                            {getStatusIcon(commitment.status)}
                            <span className="ml-1">{commitment.status}</span>
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(commitment.priority)}`}>
                            {commitment.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeRange(commitment)}
                        </div>
                        {commitment.estimatedHours && (
                          <div className="text-gray-500">
                            Est. {commitment.estimatedHours}h
                          </div>
                        )}
                        {commitment.linkedItemRef && (
                          <div className="text-blue-600">
                            Linked: {commitment.linkedItemRef}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Commitments */}
            {upcomingCommitments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Upcoming (Next 7 days)
                </h4>
                <div className="space-y-2">
                  {upcomingCommitments.map((commitment) => (
                    <div key={commitment._id?.toString()} className="bg-gray-50/80 p-2 rounded border border-gray-200">
                      <div className="flex items-start justify-between mb-1">
                        <h5 className="font-medium text-gray-900 text-sm">{commitment.title}</h5>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(commitment.priority)}`}>
                          {commitment.priority}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {format(new Date(commitment.startDate), 'MMM d')} - {formatTimeRange(commitment)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
              onClick={() => window.open('/resource-planner', '_blank')}
            >
              View Full Resource Planner
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}