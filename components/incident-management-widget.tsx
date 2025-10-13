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
import {
  AlertTriangle,
  Plus,
  Eye,
  MessageCircle,
  Clock,
  User,
  Building,
  Ticket,
  ExternalLink,
  Loader2,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Target
} from "lucide-react"

interface Incident {
  _id?: string
  ref: string
  subject: string
  description: string
  status: string
  priority: string
  urgency: string
  impact: string
  category: string
  subcategory?: string
  companyId: string
  companyName: string
  reportedByName: string
  reportedByEmail: string
  assignedToName?: string
  slaName: string
  dueByTime: string
  responseByTime: string
  slaStatus: string
  linkedFreshdeskTickets: string[]
  linkedJiraTickets: string[]
  customerUpdates: any[]
  internalNotes: any[]
  createdAt: string
  updatedAt: string
  viewCount: number
  reopenCount: number
  escalationLevel: number
}

interface Company {
  _id?: string
  name: string
  domain: string
  companyCode: string
  slaName: string
  portalEnabled: boolean
  totalIncidents: number
  openIncidents: number
  slaComplianceRate: number
  active: boolean
}

interface IncidentStats {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  byCompany: Array<{ companyName: string; count: number }>
  byAssignee: Array<{ assigneeName: string; count: number }>
  slaCompliance: {
    withinSLA: number
    atRisk: number
    breached: number
    complianceRate: number
  }
}

export default function IncidentManagementWidget() {
  const { data: session } = useSession()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [commentVisibleToCustomer, setCommentVisibleToCustomer] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)

  const [createForm, setCreateForm] = useState({
    subject: "",
    description: "",
    companyId: "",
    urgency: "Medium" as any,
    impact: "Medium" as any,
    category: "Technical",
    subcategory: "",
    assignedToId: "",
    linkedFreshdeskTickets: "",
    linkedJiraTickets: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [incidentsRes, statsRes, companiesRes, usersRes] = await Promise.all([
        fetch('/api/incident-management/incidents?limit=20&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/incident-management/incidents/stats'),
        fetch('/api/incident-management/companies'),
        fetch('/api/users')
      ])

      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json()
        setIncidents(incidentsData.incidents || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        setCompanies(companiesData.companies || [])
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

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()

    const company = companies.find(c => c._id === createForm.companyId)
    if (!company) return

    const payload = {
      ...createForm,
      linkedFreshdeskTickets: createForm.linkedFreshdeskTickets.split(',').map(t => t.trim()).filter(t => t),
      linkedJiraTickets: createForm.linkedJiraTickets.split(',').map(t => t.trim()).filter(t => t)
    }

    try {
      const response = await fetch('/api/incident-management/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setCreateForm({
          subject: "",
          description: "",
          companyId: "",
          urgency: "Medium",
          impact: "Medium",
          category: "Technical",
          subcategory: "",
          assignedToId: "",
          linkedFreshdeskTickets: "",
          linkedJiraTickets: ""
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating incident:', error)
    }
  }

  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/incident-management/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchData()
        if (selectedIncident && selectedIncident._id === incidentId) {
          const updatedIncident = await response.json()
          setSelectedIncident(updatedIncident.incident)
        }
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIncident || !comment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/incident-management/incidents/${selectedIncident._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment,
          visibleToCustomer: commentVisibleToCustomer
        })
      })

      if (response.ok) {
        const updatedData = await response.json()
        setSelectedIncident(updatedData.incident)
        setComment("")
        fetchData()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Acknowledged': return 'bg-cyan-100 text-cyan-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'On Hold': return 'bg-orange-100 text-orange-800'
      case 'Awaiting Customer': return 'bg-purple-100 text-purple-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSLAStatusColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'Within SLA': return 'text-green-600'
      case 'At Risk': return 'text-orange-600'
      case 'Breached': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (date: string) => {
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
              <Ticket className="h-5 w-5 text-blue-600" />
              Incident Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage customer incidents with SLA monitoring
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Incident</DialogTitle>
                <DialogDescription>
                  Add a new incident to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateIncident}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={createForm.subject}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={4}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company *</Label>
                    <Select
                      value={createForm.companyId}
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, companyId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.filter(c => c.active).map((company) => (
                          <SelectItem key={company._id} value={company._id || ""}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="urgency">Urgency *</Label>
                      <Select
                        value={createForm.urgency}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, urgency: value as any }))}
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
                      <Label htmlFor="impact">Impact *</Label>
                      <Select
                        value={createForm.impact}
                        onValueChange={(value) => setCreateForm(prev => ({ ...prev, impact: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Low">Low - Single user</SelectItem>
                          <SelectItem value="Medium">Medium - Multiple users</SelectItem>
                          <SelectItem value="High">High - Department</SelectItem>
                          <SelectItem value="Critical">Critical - Company-wide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={createForm.category}
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Access">Access</SelectItem>
                        <SelectItem value="Performance">Performance</SelectItem>
                        <SelectItem value="Data">Data</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignee">Assigned To</Label>
                    <Select
                      value={createForm.assignedToId}
                      onValueChange={(value) => setCreateForm(prev => ({ ...prev, assignedToId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user._id?.toString()} value={user._id?.toString() || ""}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      placeholder="SUP-123, DEV-456"
                      value={createForm.linkedJiraTickets}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, linkedJiraTickets: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Incident</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="all-incidents">All Incidents</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(stats.byStatus['New'] || 0) + (stats.byStatus['Acknowledged'] || 0) + (stats.byStatus['In Progress'] || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Open</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.slaCompliance.atRisk}</div>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.slaCompliance.breached}</div>
                      <p className="text-sm text-muted-foreground">Breached</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.slaCompliance.complianceRate.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">SLA Rate</p>
                    </CardContent>
                  </Card>
                </div>

                {incidents.filter(i => i.priority === 'Critical' || i.priority === 'High').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">High Priority Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {incidents.filter(i => i.priority === 'Critical' || i.priority === 'High').slice(0, 5).map((incident) => (
                          <div key={incident._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                            <div className="flex-1">
                              <h4 className="font-medium">{incident.ref}</h4>
                              <p className="text-sm text-gray-600">{incident.subject}</p>
                              <p className="text-xs text-gray-500">{incident.companyName} • Due: {formatDate(incident.dueByTime)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(incident.priority)}>{incident.priority}</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedIncident(incident)
                                  setIsDetailModalOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="all-incidents">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>SLA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident._id}>
                        <TableCell className="font-mono text-sm">{incident.ref}</TableCell>
                        <TableCell className="max-w-xs truncate">{incident.subject}</TableCell>
                        <TableCell>{incident.companyName}</TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(incident.priority)}>{incident.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={getSLAStatusColor(incident.slaStatus)}>{incident.slaStatus}</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedIncident(incident)
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

          <TabsContent value="companies">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>SLA Tier</TableHead>
                      <TableHead>Open</TableHead>
                      <TableHead>SLA Rate</TableHead>
                      <TableHead>Portal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.filter(c => c.active).map((company) => (
                      <TableRow key={company._id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell className="font-mono text-sm">{company.companyCode}</TableCell>
                        <TableCell>{company.slaName}</TableCell>
                        <TableCell>{company.openIncidents}</TableCell>
                        <TableCell>{company.slaComplianceRate.toFixed(1)}%</TableCell>
                        <TableCell>
                          {company.portalEnabled ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          )}
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
            {selectedIncident && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    {selectedIncident.ref}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedIncident.companyName} • Created {formatDate(selectedIncident.createdAt)}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                  <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Subject</Label>
                          <p className="mt-1">{selectedIncident.subject}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Description</Label>
                          <p className="mt-1 text-sm">{selectedIncident.description}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Priority & Impact</Label>
                          <div className="flex gap-2 mt-1">
                            <Badge className={getPriorityColor(selectedIncident.priority)}>
                              {selectedIncident.priority}
                            </Badge>
                            <Badge variant="outline">Urgency: {selectedIncident.urgency}</Badge>
                            <Badge variant="outline">Impact: {selectedIncident.impact}</Badge>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Category</Label>
                          <p className="mt-1">{selectedIncident.category}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Status</Label>
                          <div className="mt-1">
                            <Select
                              value={selectedIncident.status}
                              onValueChange={(value) => handleStatusUpdate(selectedIncident._id!, value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue>
                                  <Badge className={getStatusColor(selectedIncident.status)}>
                                    {selectedIncident.status}
                                  </Badge>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="New">New</SelectItem>
                                <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                                <SelectItem value="Awaiting Customer">Awaiting Customer</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">SLA Status</Label>
                          <p className={`mt-1 font-medium ${getSLAStatusColor(selectedIncident.slaStatus)}`}>
                            {selectedIncident.slaStatus}
                          </p>
                          <p className="text-sm text-gray-500">Due: {formatDate(selectedIncident.dueByTime)}</p>
                          <p className="text-xs text-gray-400">SLA Tier: {selectedIncident.slaName}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Assigned To</Label>
                          <p className="mt-1">{selectedIncident.assignedToName || 'Unassigned'}</p>
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-500">Reported By</Label>
                          <p className="mt-1">{selectedIncident.reportedByName}</p>
                          <p className="text-sm text-gray-500">{selectedIncident.reportedByEmail}</p>
                        </div>
                      </div>
                    </div>

                    {(selectedIncident.linkedFreshdeskTickets.length > 0 || selectedIncident.linkedJiraTickets.length > 0) && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500 mb-2 block">Linked Tickets</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedIncident.linkedFreshdeskTickets.map((ticket) => (
                            <a
                              key={ticket}
                              href={getFreshdeskUrl(ticket)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <Badge variant="outline" className="flex items-center gap-1 hover:bg-blue-50 cursor-pointer">
                                <Ticket className="h-3 w-3" />
                                FD: {ticket}
                                <ExternalLink className="h-3 w-3" />
                              </Badge>
                            </a>
                          ))}
                          {selectedIncident.linkedJiraTickets.map((ticket) => (
                            <a
                              key={ticket}
                              href={getJiraUrl(ticket)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block"
                            >
                              <Badge variant="outline" className="flex items-center gap-1 hover:bg-blue-50 cursor-pointer">
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
                        <Label className="text-sm font-medium">Updates & Comments</Label>
                      </div>

                      <ScrollArea className="h-64 mb-4">
                        <div className="space-y-4">
                          {selectedIncident.customerUpdates.length === 0 && selectedIncident.internalNotes.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No comments yet</p>
                          ) : (
                            <>
                              {selectedIncident.customerUpdates.map((update: any) => (
                                <div key={update._id} className="bg-blue-50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">{update.authorName}</span>
                                    <span className="text-xs text-gray-500">{formatDate(update.createdAt)}</span>
                                  </div>
                                  <p className="text-sm">{update.content}</p>
                                  {update.visibleToCustomer && (
                                    <Badge variant="outline" className="mt-2 text-xs">Visible to customer</Badge>
                                  )}
                                </div>
                              ))}
                              {selectedIncident.internalNotes.map((note: any) => (
                                <div key={note._id} className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-400">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium text-sm">{note.authorName}</span>
                                    <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                                  </div>
                                  <p className="text-sm">{note.content}</p>
                                  <Badge variant="outline" className="mt-2 text-xs">Internal only</Badge>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </ScrollArea>

                      <form onSubmit={handleAddComment}>
                        <div className="grid gap-2">
                          <Textarea
                            placeholder="Add a comment or update..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="visibleToCustomer"
                                checked={commentVisibleToCustomer}
                                onChange={(e) => setCommentVisibleToCustomer(e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor="visibleToCustomer" className="text-sm">Visible to customer</Label>
                            </div>
                            <Button type="submit" disabled={!comment.trim() || submittingComment}>
                              {submittingComment ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <MessageCircle className="h-4 w-4 mr-2" />
                              )}
                              Add Comment
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
