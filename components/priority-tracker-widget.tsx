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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Plus, Eye, MessageCircle, Clock, User, Building, Ticket, ExternalLink, Loader2 } from "lucide-react"
import { PriorityTrackerItem } from "@/lib/models/PriorityTracker"
import { User as UserType } from "@/lib/models/User"

interface PriorityTrackerStats {
  total: number
  open: number
  closed: number
  onHold: number
  byAssignee: Array<{ assignee: string, count: number }>
}

export default function PriorityTrackerWidget() {
  const { data: session } = useSession()
  const [items, setItems] = useState<PriorityTrackerItem[]>([])
  const [stats, setStats] = useState<PriorityTrackerStats | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<PriorityTrackerItem | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  const [createForm, setCreateForm] = useState({
    summary: "",
    companyName: "",
    assignedToId: "",
    assignedToName: "",
    linkedFreshdeskTickets: "",
    linkedJiraTickets: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [itemsRes, statsRes, usersRes] = await Promise.all([
        fetch('/api/priority-tracker'),
        fetch('/api/priority-tracker/stats'),
        fetch('/api/users')
      ])

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json()
        setItems(itemsData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        console.log('Users data fetched:', usersData)
        setUsers(usersData)
      } else {
        console.error('Failed to fetch users:', usersRes.status, await usersRes.text())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const selectedUser = users.find(u => u._id?.toString() === createForm.assignedToId)
    if (!selectedUser) return

    const payload = {
      summary: createForm.summary,
      companyName: createForm.companyName,
      assignedToId: createForm.assignedToId,
      assignedToName: selectedUser.name,
      linkedFreshdeskTickets: createForm.linkedFreshdeskTickets.split(',').map(t => t.trim()).filter(t => t),
      linkedJiraTickets: createForm.linkedJiraTickets.split(',').map(t => t.trim()).filter(t => t)
    }

    try {
      const response = await fetch('/api/priority-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setCreateForm({
          summary: "",
          companyName: "",
          assignedToId: "",
          assignedToName: "",
          linkedFreshdeskTickets: "",
          linkedJiraTickets: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleStatusUpdate = async (itemId: string, newStatus: 'Open' | 'Closed' | 'On Hold') => {
    try {
      const response = await fetch(`/api/priority-tracker/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchData()
        if (selectedItem && selectedItem._id?.toString() === itemId) {
          const updatedItem = await response.json()
          setSelectedItem(updatedItem)
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !comment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/priority-tracker/${selectedItem._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment })
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setSelectedItem(updatedItem)
        setComment("")
        fetchData() // Refresh the list
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFreshdeskUrl = (ticketId: string) => {
    return `https://support.tarantosystems.com/a/tickets/${ticketId}`
  }

  const getJiraUrl = (ticketId: string) => {
    return `https://taranto.atlassian.net/browse/${ticketId}`
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
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Priority Tracker
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage priority issues across clients
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Priority Item</DialogTitle>
                <DialogDescription>
                  Add a new priority tracking item
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateItem}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Input
                      id="summary"
                      value={createForm.summary}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, summary: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={createForm.companyName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, companyName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignee">Assigned To</Label>
                    <Select 
                      value={createForm.assignedToId} 
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, assignedToId: value }))}
                      required
                      disabled={users.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={users.length === 0 ? "Loading users..." : "Select assignee"} />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <SelectItem value="" disabled>No users available</SelectItem>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user._id?.toString()} value={user._id?.toString() || ""}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {users.length === 0 && !loading && (
                      <p className="text-sm text-red-600">Unable to load users. Please check your permissions.</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="freshdeskTickets">Linked Freshdesk Tickets (comma-separated)</Label>
                    <Input
                      id="freshdeskTickets"
                      placeholder="12345, 67890"
                      value={createForm.linkedFreshdeskTickets}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, linkedFreshdeskTickets: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="jiraTickets">Linked JIRA Tickets (comma-separated)</Label>
                    <Input
                      id="jiraTickets"
                      placeholder="ABC-123, DEF-456"
                      value={createForm.linkedJiraTickets}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, linkedJiraTickets: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Item</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="all-items">All Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.open}</div>
                    <p className="text-sm text-muted-foreground">Open</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.onHold}</div>
                    <p className="text-sm text-muted-foreground">On Hold</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
                    <p className="text-sm text-muted-foreground">Closed</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {items.filter(item => item.status === 'Open').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Open Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.filter(item => item.status === 'Open').slice(0, 5).map((item) => (
                      <div key={item._id?.toString()} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.ref}</h4>
                          <p className="text-sm text-gray-600">{item.summary}</p>
                          <p className="text-xs text-gray-500">{item.companyName} • {item.assignedToName}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
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
          
          <TabsContent value="all-items">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._id?.toString()}>
                        <TableCell className="font-mono text-sm">{item.ref}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.summary}</TableCell>
                        <TableCell>{item.companyName}</TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(value) => handleStatusUpdate(item._id?.toString() || "", value as 'Open' | 'Closed' | 'On Hold')}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="On Hold">On Hold</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{item.assignedToName}</TableCell>
                        <TableCell className="text-sm">{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setIsDetailModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {selectedItem.ref}
                  </DialogTitle>
                  <DialogDescription>
                    Priority tracking item details and comments
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Summary</Label>
                        <p className="mt-1">{selectedItem.summary}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Company</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Building className="h-4 w-4" />
                          {selectedItem.companyName}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedItem.status)}>
                            {selectedItem.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Assigned To</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="h-4 w-4" />
                          {selectedItem.assignedToName}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Created</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(selectedItem.createdAt)} by {selectedItem.createdByName}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(selectedItem.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(selectedItem.linkedFreshdeskTickets.length > 0 || selectedItem.linkedJiraTickets.length > 0) && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500 mb-2 block">Linked Tickets</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.linkedFreshdeskTickets.map((ticket) => (
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
                        {selectedItem.linkedJiraTickets.map((ticket) => (
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
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MessageCircle className="h-4 w-4" />
                      <Label className="text-sm font-medium">Comments ({selectedItem.comments.length})</Label>
                    </div>
                    
                    <ScrollArea className="h-64 mb-4">
                      <div className="space-y-4">
                        {selectedItem.comments.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No comments yet</p>
                        ) : (
                          selectedItem.comments.map((comment) => (
                            <div key={comment._id?.toString()} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{comment.authorName}</span>
                                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    
                    <form onSubmit={handleAddComment}>
                      <div className="grid gap-2">
                        <Textarea
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <Button type="submit" disabled={!comment.trim() || submittingComment} className="self-end">
                          {submittingComment ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <MessageCircle className="h-4 w-4 mr-2" />
                          )}
                          Add Comment
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}