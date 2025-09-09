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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { CalendarDays, Plus, Eye, Clock, User, Building, AlertCircle, CheckCircle, Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from "lucide-react"
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

type CalendarView = 'month' | 'week' | 'day'

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    assignedToId: "",
    assignedToName: "",
    startDate: new Date(),
    endDate: new Date(),
    startTime: "",
    endTime: "",
    isAllDay: false,
    priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
    linkedItemId: "",
    linkedItemType: "" as "" | "priority" | "csi",
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
      
      // Calculate date range based on calendar view
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

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedUser = users.find(u => u._id?.toString() === createForm.assignedToId)
    if (!selectedUser) return

    // Get linked item details if selected
    let linkedItemRef = ""
    if (createForm.linkedItemId && createForm.linkedItemType && linkedItems) {
      const items = createForm.linkedItemType === 'priority' ? linkedItems.priority : linkedItems.csi
      const linkedItem = items.find(item => item._id === createForm.linkedItemId)
      if (linkedItem) {
        linkedItemRef = linkedItem.ref
      }
    }

    const payload = {
      title: createForm.title,
      description: createForm.description,
      assignedToId: createForm.assignedToId,
      assignedToName: selectedUser.name,
      startDate: createForm.startDate.toISOString(),
      endDate: createForm.endDate.toISOString(),
      startTime: createForm.startTime || undefined,
      endTime: createForm.endTime || undefined,
      isAllDay: createForm.isAllDay,
      priority: createForm.priority,
      linkedItemId: createForm.linkedItemId || undefined,
      linkedItemType: createForm.linkedItemType || undefined,
      linkedItemRef: linkedItemRef || undefined,
      location: createForm.location || undefined,
      estimatedHours: createForm.estimatedHours ? parseFloat(createForm.estimatedHours) : undefined,
      notes: createForm.notes || undefined
    }

    try {
      const response = await fetch('/api/resource-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        resetCreateForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
    }
  }

  const resetCreateForm = () => {
    setCreateForm({
      title: "",
      description: "",
      assignedToId: "",
      assignedToName: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "",
      endTime: "",
      isAllDay: false,
      priority: "Medium",
      linkedItemId: "",
      linkedItemType: "",
      location: "",
      estimatedHours: "",
      notes: ""
    })
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
            <div
              key={day.toISOString()}
              className={`min-h-24 p-1 border border-gray-200 ${
                isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${isToday(day) ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'} ${isToday(day) ? 'font-bold' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1 mt-1">
                {dayAssignments.slice(0, 3).map(assignment => (
                  <div
                    key={assignment._id?.toString()}
                    className={`px-2 py-1 rounded text-xs cursor-pointer hover:opacity-80 ${getPriorityColor(assignment.priority)}`}
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setIsDetailModalOpen(true)
                    }}
                  >
                    <div className="font-medium truncate">{assignment.title}</div>
                    <div className="text-xs opacity-75">{assignment.assignedToName}</div>
                  </div>
                ))}
                {dayAssignments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayAssignments.length - 3} more
                  </div>
                )}
              </div>
            </div>
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
              <div className="space-y-2">
                {dayAssignments.map(assignment => (
                  <div
                    key={assignment._id?.toString()}
                    className={`p-2 rounded cursor-pointer hover:opacity-80 ${getPriorityColor(assignment.priority)}`}
                    onClick={() => {
                      setSelectedAssignment(assignment)
                      setIsDetailModalOpen(true)
                    }}
                  >
                    <div className="font-medium text-sm">{assignment.title}</div>
                    <div className="text-xs opacity-75">{assignment.assignedToName}</div>
                    {!assignment.isAllDay && assignment.startTime && (
                      <div className="text-xs opacity-75">{formatTime(assignment.startTime)}</div>
                    )}
                  </div>
                ))}
              </div>
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
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-600" />
              Resource Planner
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule and manage resource assignments with calendar view
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Resource Assignment</DialogTitle>
                <DialogDescription>
                  Schedule a new task or assignment for team members
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={createForm.title}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="assignee">Assigned To *</Label>
                      <Select 
                        value={createForm.assignedToId} 
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, assignedToId: value }))}
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
                        value={createForm.priority} 
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, priority: value as "Low" | "Medium" | "High" | "Critical" }))}
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
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="allDay"
                        checked={createForm.isAllDay}
                        onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isAllDay: checked }))}
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
                            {format(createForm.startDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={createForm.startDate}
                            onSelect={(date) => date && setCreateForm(prev => ({ ...prev, startDate: date }))}
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
                            {format(createForm.endDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={createForm.endDate}
                            onSelect={(date) => date && setCreateForm(prev => ({ ...prev, endDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {!createForm.isAllDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={createForm.startTime}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={createForm.endTime}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  {linkedItems && (
                    <div className="grid gap-2">
                      <Label htmlFor="linkedItem">Link to Priority/CSI Item (optional)</Label>
                      <Select
                        value={createForm.linkedItemId}
                        onValueChange={(value) => {
                          if (value && value !== "none") {
                            const allItems = [...linkedItems.priority, ...linkedItems.csi]
                            const selectedItem = allItems.find(item => item._id === value)
                            if (selectedItem) {
                              setCreateForm(prev => ({
                                ...prev,
                                linkedItemId: value,
                                linkedItemType: selectedItem.type,
                                title: prev.title || selectedItem.summary,
                                assignedToId: prev.assignedToId || "",
                                assignedToName: prev.assignedToName || selectedItem.assignedToName
                              }))
                            }
                          } else {
                            setCreateForm(prev => ({ ...prev, linkedItemId: "", linkedItemType: "" }))
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item to link" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {linkedItems.priority.length > 0 && (
                            <>
                              <SelectItem value="priority-header" disabled>
                                — Priority Items —
                              </SelectItem>
                              {linkedItems.priority.map((item) => (
                                <SelectItem key={`priority-${item._id}`} value={item._id}>
                                  {item.ref}: {item.summary}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {linkedItems.csi.length > 0 && (
                            <>
                              <SelectItem value="csi-header" disabled>
                                — CSI Items —
                              </SelectItem>
                              {linkedItems.csi.map((item) => (
                                <SelectItem key={`csi-${item._id}`} value={item._id}>
                                  {item.ref}: {item.summary} ({item.percentComplete}%)
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={createForm.location}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
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
                        value={createForm.estimatedHours}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, estimatedHours: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={createForm.notes}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Assignment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                    <SelectItem value="day">Day</SelectItem>
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
      </CardContent>
    </Card>
  )
}