"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, TrendingUp, MessageCircle, Clock, Building, RefreshCw, CheckCircle, Pause, Play, Loader2, Calendar, Eye } from "lucide-react"
import { PriorityTrackerItem } from "@/lib/models/PriorityTracker"
import { CSITrackerItem } from "@/lib/models/CSITracker"
import PriorityTrackerModal from "@/components/priority-tracker-modal"
import CSITrackerModal from "@/components/csi-tracker-modal"

interface PersonalAssignments {
  priorityItems: PriorityTrackerItem[]
  csiItems: CSITrackerItem[]
  summary: {
    totalAssigned: number
    priorityCount: number
    csiCount: number
    onHoldCount: number
    csiNearCompletion: number
  }
}


export default function PersonalSummary() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<PersonalAssignments | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPriorityItem, setSelectedPriorityItem] = useState<PriorityTrackerItem | null>(null)
  const [selectedCSIItem, setSelectedCSIItem] = useState<CSITrackerItem | null>(null)
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false)
  const [isCSIModalOpen, setIsCSIModalOpen] = useState(false)

  useEffect(() => {
    if (session) {
      fetchAssignments()
    }
  }, [session])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/my-assignments')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'On Hold': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const getDaysAgo = (date: string | Date) => {
    const diffTime = new Date().getTime() - new Date(date).getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleViewItem = (item: PriorityTrackerItem | CSITrackerItem, type: 'priority' | 'csi') => {
    if (type === 'priority') {
      setSelectedPriorityItem(item as PriorityTrackerItem)
      setIsPriorityModalOpen(true)
    } else {
      setSelectedCSIItem(item as CSITrackerItem)
      setIsCSIModalOpen(true)
    }
  }

  const handleModalUpdate = () => {
    fetchAssignments()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!assignments || assignments.summary.totalAssigned === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No active assignments</p>
            <p className="text-sm text-gray-500">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">My Assignments</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAssignments}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-orange-50 p-2 rounded text-center">
              <div className="font-semibold text-orange-800">{assignments.summary.priorityCount}</div>
              <div className="text-orange-600">Priority</div>
            </div>
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="font-semibold text-blue-800">{assignments.summary.csiCount}</div>
              <div className="text-blue-600">CSI</div>
            </div>
          </div>
          {assignments.summary.onHoldCount > 0 && (
            <div className="bg-yellow-50 p-2 rounded text-center">
              <div className="text-yellow-800 text-sm">
                <Pause className="h-3 w-3 inline mr-1" />
                {assignments.summary.onHoldCount} on hold
              </div>
            </div>
          )}
          {assignments.summary.csiNearCompletion > 0 && (
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="text-green-800 text-sm">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                {assignments.summary.csiNearCompletion} near completion
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {/* Priority Items */}
              {assignments.priorityItems.map((item) => (
                <div key={`priority-${item._id}`} className="border rounded-lg p-3 bg-orange-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                      <span className="font-mono text-xs text-gray-600">{item.ref}</span>
                      <Badge className={getStatusColor(item.status)} variant="outline">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {getDaysAgo(item.createdAt)}d
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-1 line-clamp-2">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Building className="h-3 w-3" />
                      {item.companyName}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleViewItem(item, 'priority')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                  {item.comments.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MessageCircle className="h-3 w-3" />
                      {item.comments.length} comments
                    </div>
                  )}
                </div>
              ))}

              {assignments.priorityItems.length > 0 && assignments.csiItems.length > 0 && (
                <Separator className="my-2" />
              )}

              {/* CSI Items */}
              {assignments.csiItems.map((item) => (
                <div key={`csi-${item._id}`} className="border rounded-lg p-3 bg-blue-50/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="font-mono text-xs text-gray-600">{item.ref}</span>
                      <Badge className={getStatusColor(item.status)} variant="outline">
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {getDaysAgo(item.createdAt)}d
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-2 line-clamp-2">{item.summary}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={item.percentComplete} className="flex-1 h-2" />
                    <span className="text-xs font-medium">{item.percentComplete}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Building className="h-3 w-3" />
                      {item.companyName}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleViewItem(item, 'csi')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                  {item.comments.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <MessageCircle className="h-3 w-3" />
                      {item.comments.length} comments
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <PriorityTrackerModal
        item={selectedPriorityItem}
        isOpen={isPriorityModalOpen}
        onClose={() => {
          setIsPriorityModalOpen(false)
          setSelectedPriorityItem(null)
        }}
        onUpdate={handleModalUpdate}
      />

      <CSITrackerModal
        item={selectedCSIItem}
        isOpen={isCSIModalOpen}
        onClose={() => {
          setIsCSIModalOpen(false)
          setSelectedCSIItem(null)
        }}
        onUpdate={handleModalUpdate}
      />
    </>
  )
}