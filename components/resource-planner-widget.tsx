"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { CalendarDays, Plus, Eye, Clock, User, Building, AlertCircle, CheckCircle, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, GripVertical, AlertTriangle, TrendingUp } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns"
import { ResourceAssignment } from "@/lib/models/ResourcePlanner"
import { User as UserType } from "@/lib/models/User"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  Active,
  Over,
} from "@dnd-kit/core"
import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/core"

interface ResourcePlannerStats {
  totalAssignments: number
  scheduled: number
  inProgress: number
  completed: number
  cancelled: number
  byUser: Array<{ user: string, count: number, hoursAllocated: number }>
  byPriority: Array<{ priority: string, count: number }>
  upcomingDeadlines: ResourceAssignment[]
}

interface LinkedItems {
  priority: Array<{
    _id: string
    ref: string
    summary: string
    assignedToName: string
    companyName: string
    type: 'priority'
  }>
  csi: Array<{
    _id: string
    ref: string
    summary: string
    assignedToName: string
    companyName: string
    percentComplete: number
    type: 'csi'
  }>
}

interface DragData {
  item: LinkedItems['priority'][0] | LinkedItems['csi'][0]
  type: 'priority' | 'csi'
}

type CalendarView = 'month' | 'week' | 'day'

// Draggable item component
function DraggableItem({ item, type }: { item: LinkedItems['priority'][0] | LinkedItems['csi'][0], type: 'priority' | 'csi' }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `${type}-${item._id}`,
    data: {
      item,
      type,
    } as DragData
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${
        type === 'priority' 
          ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' 
          : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-gray-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {type === 'priority' ? (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            )}
            <Badge variant="outline" className="text-xs">
              {item.ref}
            </Badge>
          </div>
          <p className="font-medium text-sm truncate">{item.summary}</p>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">{item.assignedToName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">{item.companyName}</span>
          </div>
          {'percentComplete' in item && (
            <div className="mt-1">
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                {item.percentComplete}% Complete
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Droppable calendar day component
function DroppableCalendarDay({ 
  day, 
  isCurrentMonth, 
  assignments, 
  onDayClick,
  getPriorityColor 
}: { 
  day: Date
  isCurrentMonth: boolean
  assignments: ResourceAssignment[]
  onDayClick: (assignment: ResourceAssignment) => void
  getPriorityColor: (priority: string) => string
}) {
  const {
    isOver,
    setNodeRef
  } = useDroppable({
    id: day.toISOString(),
    data: {
      date: day,
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 p-1 border border-gray-200 transition-colors ${
        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
      } ${isToday(day) ? 'ring-2 ring-blue-500' : ''} ${
        isOver ? 'bg-green-50 border-green-300' : ''
      }`}
    >
      <div className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} ${isToday(day) ? 'font-bold' : ''}`}>
        {format(day, 'd')}
      </div>
      <div className="space-y-1 mt-1">
        {assignments.slice(0, 3).map(assignment => (
          <div
            key={assignment._id?.toString()}
            className={`px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 ${getPriorityColor(assignment.priority)}`}
            onClick={() => onDayClick(assignment)}
          >
            <div className="font-medium truncate">{assignment.title}</div>
            <div className="text-xs opacity-75">{assignment.assignedToName}</div>
          </div>
        ))}
        {assignments.length > 3 && (
          <div className="text-xs text-gray-500 text-center">
            +{assignments.length - 3} more
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResourcePlannerWidget() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([])
  const [stats, setStats] = useState<ResourcePlannerStats | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [linkedItems, setLinkedItems] = useState<LinkedItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [selectedAssignment, setSelectedAssignment] = useState<ResourceAssignment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDragAssignmentModalOpen, setIsDragAssignmentModalOpen] = useState(false)
  const [draggedItem, setDraggedItem] = useState<DragData | null>(null)
  const [dropDate, setDropDate] = useState<Date | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const [assignmentForm, setAssignmentForm] = useState({
    assignedToId: "",
    assignedToName: "",
    startDate: new Date(),
    endDate: new Date(),
    startTime: "",
    endTime: "",
    isAllDay: false,
    priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
    location: "",
    estimatedHours: "",
    notes: ""
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    fetchData()
    fetchLinkedItems()
  }, [selectedDate, calendarView])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      let startDate: Date
      let endDate: Date
      
      if (calendarView === 'month') {
        startDate = startOfMonth(selectedDate)
        endDate = endOfMonth(selectedDate)
      } else if (calendarView === 'week') {
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 })
        endDate = endOfWeek(selectedDate, { weekStartsOn: 1 })
      } else {
        startDate = selectedDate
        endDate = selectedDate
      }

      const [assignmentsRes, statsRes, usersRes] = await Promise.all([
        fetch(`/api/resource-planner?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch('/api/resource-planner/stats'),
        fetch('/api/users')
      ])

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLinkedItems = async () => {
    try {
      const response = await fetch('/api/resource-planner/linked-items')
      if (response.ok) {
        const data = await response.json()
        setLinkedItems(data)
      }
    } catch (error) {
      console.error('Error fetching linked items:', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)

    if (!over || !active.data.current) return

    const dragData = active.data.current as DragData
    const dropDateData = new Date(over.id as string)

    setDraggedItem(dragData)
    setDropDate(dropDateData)
    
    // Pre-fill form with dragged item data
    setAssignmentForm(prev => ({
      ...prev,
      startDate: dropDateData,
      endDate: dropDateData,
      assignedToId: "",
      assignedToName: dragData.item.assignedToName,
      isAllDay: true
    }))
    
    setIsDragAssignmentModalOpen(true)
  }

  const handleCreateDragAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!draggedItem || !dropDate) return

    const selectedUser = users.find(u => u._id?.toString() === assignmentForm.assignedToId)
    if (!selectedUser) return

    const payload = {
      title: draggedItem.item.summary,
      description: `Assignment for ${draggedItem.type.toUpperCase()} item: ${draggedItem.item.ref}`,
      assignedToId: assignmentForm.assignedToId,
      assignedToName: selectedUser.name,
      startDate: assignmentForm.startDate.toISOString(),
      endDate: assignmentForm.endDate.toISOString(),
      startTime: assignmentForm.startTime || undefined,
      endTime: assignmentForm.endTime || undefined,
      isAllDay: assignmentForm.isAllDay,
      priority: assignmentForm.priority,
      linkedItemId: draggedItem.item._id,
      linkedItemType: draggedItem.type,
      linkedItemRef: draggedItem.item.ref,
      location: assignmentForm.location || undefined,
      estimatedHours: assignmentForm.estimatedHours ? parseFloat(assignmentForm.estimatedHours) : undefined,
      notes: assignmentForm.notes || undefined
    }

    try {
      const response = await fetch('/api/resource-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsDragAssignmentModalOpen(false)
        resetAssignmentForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const resetAssignmentForm = () => {
    setAssignmentForm({
      assignedToId: "",
      assignedToName: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "",
      endTime: "",
      isAllDay: false,
      priority: "Medium",
      location: "",
      estimatedHours: "",
      notes: ""
    })
    setDraggedItem(null)
    setDropDate(null)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Medium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (time?: string) => {
    if (!time) return ''
    return time
  }

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM dd, yyyy')
  }

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(assignment => {
      const startDate = new Date(assignment.startDate)
      const endDate = new Date(assignment.endDate)
      return date >= startDate && date <= endDate
    })
  }

  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (calendarView === 'month') {
      setSelectedDate(direction === 'next' ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1))
    } else if (calendarView === 'week') {
      setSelectedDate(direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1))
    } else {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : subDays(selectedDate, 1))
    }
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Header */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map(day => {
          const dayAssignments = getAssignmentsForDate(day)
          const isCurrentMonth = day >= monthStart && day <= monthEnd
          
          return (
            <DroppableCalendarDay
              key={day.toISOString()}
              day={day}
              isCurrentMonth={isCurrentMonth}
              assignments={dayAssignments}
              onDayClick={(assignment) => {
                setSelectedAssignment(assignment)
                setIsDetailModalOpen(true)
              }}
              getPriorityColor={getPriorityColor}
            />
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map(day => {
          const dayAssignments = getAssignmentsForDate(day)
          
          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={`text-center p-2 rounded ${isToday(day) ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500">{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>
              <DroppableCalendarDay
                day={day}
                isCurrentMonth={true}
                assignments={dayAssignments}
                onDayClick={(assignment) => {
                  setSelectedAssignment(assignment)
                  setIsDetailModalOpen(true)
                }}
                getPriorityColor={getPriorityColor}
              />
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with draggable items */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GripVertical className="h-5 w-5" />
                Drag & Drop Items
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag Priority or CSI items onto calendar dates to schedule assignments
              </p>
            </CardHeader>
            <CardContent>
              {linkedItems && (
                <div className="space-y-4">
                  {linkedItems.priority.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        Priority Items ({linkedItems.priority.length})
                      </h4>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {linkedItems.priority.map((item) => (
                            <DraggableItem key={`priority-${item._id}`} item={item} type="priority" />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {linkedItems.csi.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        CSI Items ({linkedItems.csi.length})
                      </h4>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {linkedItems.csi.map((item) => (
                            <DraggableItem key={`csi-${item._id}`} item={item} type="csi" />
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {linkedItems.priority.length === 0 && linkedItems.csi.length === 0 && (
                    <p className="text-sm text-gray-500 italic text-center py-8">
                      No Priority or CSI items available for assignment
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main calendar area */}
        <div className="lg:col-span-3">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-green-600" />
                Resource Planner Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Drop items from the sidebar onto dates to create assignments
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="calendar" className="space-y-4">
                  {/* Calendar Controls */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <h3 className="text-lg font-semibold ml-4">
                        {calendarView === 'month' && format(selectedDate, 'MMMM yyyy')}
                        {calendarView === 'week' && `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}`}
                        {calendarView === 'day' && format(selectedDate, 'EEEE, MMM dd, yyyy')}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select value={calendarView} onValueChange={(value: CalendarView) => setCalendarView(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Month</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Calendar Display */}
                  <div className="border rounded-lg p-4 bg-white">
                    {calendarView === 'month' && renderMonthView()}
                    {calendarView === 'week' && renderWeekView()}
                  </div>
                </TabsContent>
                
                <TabsContent value="overview" className="space-y-4">
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold">{stats.totalAssignments}</div>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
                          <p className="text-sm text-muted-foreground">Scheduled</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                          <p className="text-sm text-muted-foreground">In Progress</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                          <p className="text-sm text-muted-foreground">Completed</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
                          <p className="text-sm text-muted-foreground">Cancelled</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.upcomingDeadlines.map((assignment) => (
                            <div key={assignment._id?.toString()} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium">{assignment.title}</h4>
                                <p className="text-sm text-gray-600">{assignment.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className={getStatusColor(assignment.status)}>
                                    {assignment.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    Due: {formatDate(assignment.endDate)}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(assignment)
                                  setIsDetailModalOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragId && linkedItems && (() => {
          const [type, id] = activeDragId.split('-')
          const items = type === 'priority' ? linkedItems.priority : linkedItems.csi
          const item = items.find(item => item._id === id)
          return item ? <DraggableItem item={item} type={type as 'priority' | 'csi'} /> : null
        })()}
      </DragOverlay>

      {/* Drag Assignment Modal */}
      <Dialog open={isDragAssignmentModalOpen} onOpenChange={setIsDragAssignmentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Assignment from {draggedItem?.type?.toUpperCase()} Item</DialogTitle>
            <DialogDescription>
              Complete the details for this resource assignment
            </DialogDescription>
          </DialogHeader>
          {draggedItem && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                {draggedItem.type === 'priority' ? (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                )}
                <Badge variant="outline">{draggedItem.item.ref}</Badge>
              </div>
              <p className="font-medium">{draggedItem.item.summary}</p>
              <p className="text-sm text-gray-600">{draggedItem.item.companyName}</p>
            </div>
          )}
          <form onSubmit={handleCreateDragAssignment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assigned To *</Label>
                <Select 
                  value={assignmentForm.assignedToId} 
                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, assignedToId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.filter(user => user._id).map((user) => (
                      <SelectItem key={user._id!.toString()} value={user._id!.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select 
                  value={assignmentForm.priority} 
                  onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, priority: value as "Low" | "Medium" | "High" | "Critical" }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allDay"
                    checked={assignmentForm.isAllDay}
                    onCheckedChange={(checked) => setAssignmentForm(prev => ({ ...prev, isAllDay: checked }))}
                  />
                  <Label htmlFor="allDay">All Day</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(assignmentForm.startDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={assignmentForm.startDate}
                        onSelect={(date) => date && setAssignmentForm(prev => ({ ...prev, startDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(assignmentForm.endDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={assignmentForm.endDate}
                        onSelect={(date) => date && setAssignmentForm(prev => ({ ...prev, endDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {!assignmentForm.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={assignmentForm.startTime}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={assignmentForm.endTime}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={assignmentForm.location}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Office, Remote, Client site..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={assignmentForm.estimatedHours}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDragAssignmentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Assignment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          {selectedAssignment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  {selectedAssignment.title}
                </DialogTitle>
                <DialogDescription>
                  Assignment details and information
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Assigned To</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      {selectedAssignment.assignedToName}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Priority</Label>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(selectedAssignment.priority)}>
                        {selectedAssignment.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                {selectedAssignment.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    <p className="mt-1">{selectedAssignment.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                    <p className="mt-1">{formatDate(selectedAssignment.startDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">End Date</Label>
                    <p className="mt-1">{formatDate(selectedAssignment.endDate)}</p>
                  </div>
                </div>

                {!selectedAssignment.isAllDay && selectedAssignment.startTime && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Start Time</Label>
                      <p className="mt-1">{formatTime(selectedAssignment.startTime)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">End Time</Label>
                      <p className="mt-1">{formatTime(selectedAssignment.endTime)}</p>
                    </div>
                  </div>
                )}

                {selectedAssignment.linkedItemRef && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Linked Item</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {selectedAssignment.linkedItemType?.toUpperCase()}: {selectedAssignment.linkedItemRef}
                      </Badge>
                    </div>
                  </div>
                )}

                {selectedAssignment.location && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Location</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4" />
                      {selectedAssignment.location}
                    </div>
                  </div>
                )}

                {selectedAssignment.estimatedHours && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Estimated Hours</Label>
                      <p className="mt-1">{selectedAssignment.estimatedHours}h</p>
                    </div>
                    {selectedAssignment.actualHours && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Actual Hours</Label>
                        <p className="mt-1">{selectedAssignment.actualHours}h</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedAssignment.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Notes</Label>
                    <p className="mt-1 text-sm">{selectedAssignment.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DndContext>
  )
}