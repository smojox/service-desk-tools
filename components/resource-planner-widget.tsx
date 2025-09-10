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
import { CalendarDays, Plus, Eye, Clock, User, Building, AlertCircle, CheckCircle, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, AlertTriangle, TrendingUp, ExternalLink, Ticket } from "lucide-react"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from "date-fns"
import { ResourceAssignment } from "@/lib/models/ResourcePlanner"
import { User as UserType } from "@/lib/models/User"

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

interface ContextMenuData {
  x: number
  y: number
  selectedDates: Date[]
}

type CalendarView = 'month' | 'week' | 'day'

// Calendar day component with selection and context menu
function SelectableCalendarDay({ 
  day, 
  isCurrentMonth, 
  assignments,
  isSelected,
  onDayClick,
  onDayRightClick,
  getPriorityColor 
}: { 
  day: Date
  isCurrentMonth: boolean
  assignments: ResourceAssignment[]
  isSelected: boolean
  onDayClick: (day: Date) => void
  onDayRightClick: (day: Date, event: React.MouseEvent) => void
  getPriorityColor: (priority: string) => string
}) {
  return (
    <div
      className={`min-h-24 p-1 border-2 transition-all cursor-pointer select-none ${
        isSelected 
          ? 'bg-blue-200 border-blue-500 ring-2 ring-blue-300 shadow-md' 
          : isCurrentMonth 
            ? 'bg-white border-gray-200 hover:bg-gray-50' 
            : 'bg-gray-50 border-gray-200'
      } ${isToday(day) ? 'ring-2 ring-green-500' : ''}`}
      onClick={() => onDayClick(day)}
      onContextMenu={(e) => {
        e.preventDefault()
        onDayRightClick(day, e)
      }}
    >
      <div className={`text-sm font-semibold ${
        isSelected 
          ? 'text-blue-900' 
          : isCurrentMonth 
            ? 'text-gray-900' 
            : 'text-gray-400'
      } ${isToday(day) ? 'font-bold' : ''}`}>
        {format(day, 'd')}
      </div>
      <div className="space-y-1 mt-1">
        {assignments.slice(0, 3).map(assignment => (
          <div
            key={assignment._id?.toString()}
            className={`px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 ${getPriorityColor(assignment.priority)}`}
            onClick={(e) => {
              e.stopPropagation()
              // Handle assignment click if needed
            }}
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

// Context menu component
function ContextMenu({ 
  isOpen, 
  position, 
  linkedItems, 
  onSelectItem, 
  onClose 
}: {
  isOpen: boolean
  position: { x: number, y: number }
  linkedItems: LinkedItems | null
  onSelectItem: (item: LinkedItems['priority'][0] | LinkedItems['csi'][0], type: 'priority' | 'csi') => void
  onClose: () => void
}) {
  useEffect(() => {
    const handleClickOutside = () => onClose()
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !linkedItems) return null

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2 min-w-80 max-h-96 overflow-hidden"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <ScrollArea className="max-h-80">
        <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
          Assign Task to Selected Date(s)
        </div>
        
        {linkedItems.priority.length > 0 && (
          <div>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
              Priority Items ({linkedItems.priority.length})
            </div>
            {linkedItems.priority.map((item) => (
              <div
                key={`priority-${item._id}`}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => onSelectItem(item, 'priority')}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-orange-50">
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {linkedItems.csi.length > 0 && (
          <div>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-blue-600" />
              CSI Items ({linkedItems.csi.length})
            </div>
            {linkedItems.csi.map((item) => (
              <div
                key={`csi-${item._id}`}
                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => onSelectItem(item, 'csi')}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        {item.ref}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {item.percentComplete}%
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {linkedItems.priority.length === 0 && linkedItems.csi.length === 0 && (
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            No Priority or CSI items available for assignment
          </div>
        )}
      </ScrollArea>
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
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null)
  const [selectedItem, setSelectedItem] = useState<{
    item: LinkedItems['priority'][0] | LinkedItems['csi'][0]
    type: 'priority' | 'csi'
  } | null>(null)
  const [linkedTickets, setLinkedTickets] = useState<{
    freshdeskTickets: string[]
    jiraTickets: string[]
  } | null>(null)

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

  const fetchLinkedTickets = async (assignment: ResourceAssignment) => {
    if (!assignment.linkedItemId || !assignment.linkedItemType) {
      setLinkedTickets(null)
      return
    }

    try {
      const endpoint = assignment.linkedItemType === 'priority' 
        ? `/api/priority-tracker/${assignment.linkedItemId.toString()}`
        : `/api/csi-tracker/${assignment.linkedItemId.toString()}`
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setLinkedTickets({
          freshdeskTickets: data.linkedFreshdeskTickets || [],
          jiraTickets: data.linkedJiraTickets || []
        })
      } else {
        setLinkedTickets(null)
      }
    } catch (error) {
      console.error('Error fetching linked tickets:', error)
      setLinkedTickets(null)
    }
  }

  const handleDayClick = (day: Date) => {
    setSelectedDates(prev => {
      const isAlreadySelected = prev.some(d => isSameDay(d, day))
      if (isAlreadySelected) {
        return prev.filter(d => !isSameDay(d, day))
      } else {
        return [...prev, day]
      }
    })
  }

  const handleDayRightClick = (day: Date, event: React.MouseEvent) => {
    // Add day to selection if not already selected
    setSelectedDates(prev => {
      const isAlreadySelected = prev.some(d => isSameDay(d, day))
      if (!isAlreadySelected) {
        return [...prev, day]
      }
      return prev
    })

    // Show context menu
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      selectedDates: selectedDates.some(d => isSameDay(d, day)) 
        ? selectedDates 
        : [...selectedDates, day]
    })
  }

  const handleContextMenuSelect = (item: LinkedItems['priority'][0] | LinkedItems['csi'][0], type: 'priority' | 'csi') => {
    setSelectedItem({ item, type })
    setContextMenu(null)

    // Calculate date range from selected dates
    const sortedDates = (contextMenu?.selectedDates || selectedDates).sort((a, b) => a.getTime() - b.getTime())
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]

    // Pre-fill form with selected item data
    setAssignmentForm(prev => ({
      ...prev,
      startDate,
      endDate,
      assignedToId: "",
      assignedToName: item.assignedToName,
      isAllDay: true
    }))
    
    setIsAssignmentModalOpen(true)
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedItem) return

    const selectedUser = users.find(u => u._id?.toString() === assignmentForm.assignedToId)
    if (!selectedUser) return

    const payload = {
      title: selectedItem.item.summary,
      description: `Assignment for ${selectedItem.type.toUpperCase()} item: ${selectedItem.item.ref}`,
      assignedToId: assignmentForm.assignedToId,
      assignedToName: selectedUser.name,
      startDate: assignmentForm.startDate.toISOString(),
      endDate: assignmentForm.endDate.toISOString(),
      startTime: assignmentForm.startTime || undefined,
      endTime: assignmentForm.endTime || undefined,
      isAllDay: assignmentForm.isAllDay,
      priority: assignmentForm.priority,
      linkedItemId: selectedItem.item._id,
      linkedItemType: selectedItem.type,
      linkedItemRef: selectedItem.item.ref,
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
        setIsAssignmentModalOpen(false)
        resetAssignmentForm()
        setSelectedDates([])
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
    setSelectedItem(null)
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

  const getFreshdeskUrl = (ticketId: string) => {
    return `https://support.tarantosystems.com/a/tickets/${ticketId}`
  }

  const getJiraUrl = (ticketId: string) => {
    return `https://taranto.atlassian.net/browse/${ticketId}`
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
          const isSelected = selectedDates.some(d => isSameDay(d, day))
          
          return (
            <SelectableCalendarDay
              key={day.toISOString()}
              day={day}
              isCurrentMonth={isCurrentMonth}
              assignments={dayAssignments}
              isSelected={isSelected}
              onDayClick={handleDayClick}
              onDayRightClick={handleDayRightClick}
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
          const isSelected = selectedDates.some(d => isSameDay(d, day))
          
          return (
            <div key={day.toISOString()} className="space-y-2">
              <div className={`text-center p-2 rounded ${isToday(day) ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-500">{format(day, 'EEE')}</div>
                <div className="text-lg">{format(day, 'd')}</div>
              </div>
              <SelectableCalendarDay
                day={day}
                isCurrentMonth={true}
                assignments={dayAssignments}
                isSelected={isSelected}
                onDayClick={handleDayClick}
                onDayRightClick={handleDayRightClick}
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
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-green-600" />
            Resource Planner Calendar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click dates to select them, then right-click to assign tasks from Priority or CSI items
          </p>
          {selectedDates.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDates([])}
              >
                Clear Selection
              </Button>
            </div>
          )}
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
                              fetchLinkedTickets(assignment)
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

      {/* Context Menu */}
      <ContextMenu
        isOpen={!!contextMenu}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : { x: 0, y: 0 }}
        linkedItems={linkedItems}
        onSelectItem={handleContextMenuSelect}
        onClose={() => setContextMenu(null)}
      />

      {/* Assignment Creation Modal */}
      <Dialog open={isAssignmentModalOpen} onOpenChange={setIsAssignmentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Assignment from {selectedItem?.type?.toUpperCase()} Item</DialogTitle>
            <DialogDescription>
              Complete the details for this resource assignment
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                {selectedItem.type === 'priority' ? (
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                )}
                <Badge variant="outline">{selectedItem.item.ref}</Badge>
                {'percentComplete' in selectedItem.item && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                    {selectedItem.item.percentComplete}% Complete
                  </Badge>
                )}
              </div>
              <p className="font-medium">{selectedItem.item.summary}</p>
              <p className="text-sm text-gray-600">{selectedItem.item.companyName}</p>
            </div>
          )}
          <form onSubmit={handleCreateAssignment}>
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
              <Button type="button" variant="outline" onClick={() => setIsAssignmentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Assignment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={(open) => {
        setIsDetailModalOpen(open)
        if (!open) {
          setLinkedTickets(null)
        }
      }}>
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

                {linkedTickets && (linkedTickets.freshdeskTickets.length > 0 || linkedTickets.jiraTickets.length > 0) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2 block">Related Tickets</Label>
                    <div className="flex flex-wrap gap-2">
                      {linkedTickets.freshdeskTickets.map((ticket) => (
                        <a
                          key={ticket}
                          href={getFreshdeskUrl(ticket)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Badge variant="outline" className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors">
                            <Ticket className="h-3 w-3" />
                            FD: {ticket}
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </a>
                      ))}
                      {linkedTickets.jiraTickets.map((ticket) => (
                        <a
                          key={ticket}
                          href={getJiraUrl(ticket)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Badge variant="outline" className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-colors">
                            <Ticket className="h-3 w-3" />
                            JIRA: {ticket}
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </a>
                      ))}
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
    </div>
  )
}