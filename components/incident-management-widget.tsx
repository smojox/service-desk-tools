"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Target,
  Search,
  Filter,
  Save,
  X,
  Globe,
  Lock,
  BarChart3,
  PieChart,
  Calendar,
  Edit,
  Check,
  Trash2
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
  assignedToId?: string
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
  slaId?: string
  portalEnabled: boolean
  totalIncidents: number
  openIncidents: number
  slaComplianceRate: number
  active: boolean
  primaryContactName?: string
  primaryContactEmail?: string
  primaryContactPhone?: string
}

interface Contact {
  _id?: string
  name: string
  email: string
  phone?: string
  jobTitle?: string
  department?: string
  companyId: string
  companyName: string
  portalAccess: boolean
  canLogIncidents: boolean
  receiveNotifications: boolean
  active: boolean
  totalIncidentsLogged: number
  lastIncidentAt?: string
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

interface QueryFilters {
  status?: string[]
  priority?: string[]
  companyId?: string[]
  assignedToId?: string[]
  slaStatus?: string[]
  category?: string[]
  searchText?: string
}

interface SavedQuery {
  _id?: string
  name: string
  description?: string
  filters: QueryFilters
  isGlobal: boolean
  createdBy: string
  createdByName: string
  usageCount: number
}

export default function IncidentManagementWidget() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get tab from URL, default to "dashboard"
  const currentTab = searchParams?.get('tab') || 'dashboard'
  const incidentRef = searchParams?.get('incident') || null

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [slaDefinitions, setSlaDefinitions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSaveQueryModalOpen, setIsSaveQueryModalOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [initializingSLA, setInitializingSLA] = useState(false)

  // Companies & Contacts state
  const [companiesContactsView, setCompaniesContactsView] = useState<'companies' | 'contacts'>('companies')
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isSLAModalOpen, setIsSLAModalOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [editingSLA, setEditingSLA] = useState<any | null>(null)

  // Edit mode state
  const [isEditingSubject, setIsEditingSubject] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<QueryFilters>({
    status: [],
    priority: [],
    companyId: [],
    assignedToId: [],
    slaStatus: [],
    category: [],
    searchText: ""
  })

  // Save query form
  const [saveQueryForm, setSaveQueryForm] = useState({
    name: "",
    description: "",
    isGlobal: false
  })

  const [createForm, setCreateForm] = useState({
    subject: "",
    description: "",
    companyId: "",
    urgency: "Medium" as any,
    impact: "Medium" as any,
    category: "Technical",
    subcategory: "",
    assignedToId: "unassigned",
    linkedFreshdeskTickets: "",
    linkedJiraTickets: ""
  })

  useEffect(() => {
    fetchData()
    fetchSavedQueries()
    fetchSLADefinitions()
  }, [])

  // Load incident from URL when incident ref is provided
  useEffect(() => {
    if (incidentRef && incidents.length > 0) {
      const incident = incidents.find(i => i.ref === incidentRef)
      if (incident) {
        setSelectedIncident(incident)
      }
    } else {
      setSelectedIncident(null)
    }
  }, [incidentRef, incidents])

  useEffect(() => {
    applyFilters()
  }, [searchFilters, incidents])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [incidentsRes, statsRes, companiesRes, contactsRes, usersRes] = await Promise.all([
        fetch('/api/incident-management/incidents?limit=100&sortBy=createdAt&sortOrder=desc'),
        fetch('/api/incident-management/incidents/stats'),
        fetch('/api/incident-management/companies'),
        fetch('/api/incident-management/contacts'),
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

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json()
        setContacts(contactsData.contacts || [])
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

  const fetchSavedQueries = async () => {
    try {
      const response = await fetch('/api/incident-management/saved-queries')
      if (response.ok) {
        const data = await response.json()
        setSavedQueries(data.queries || [])
      }
    } catch (error) {
      console.error('Error fetching saved queries:', error)
    }
  }

  const fetchSLADefinitions = async () => {
    try {
      const response = await fetch('/api/incident-management/sla-definitions')
      if (response.ok) {
        const data = await response.json()
        setSlaDefinitions(data.slaDefinitions || [])
      }
    } catch (error) {
      console.error('Error fetching SLA definitions:', error)
    }
  }

  const handleInitializeSLA = async () => {
    setInitializingSLA(true)
    try {
      const response = await fetch('/api/incident-management/sla-definitions/init', { method: 'POST' })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to initialize SLA'}`)
        return
      }

      await fetchSLADefinitions()
      alert('Default SLA initialized successfully')
    } catch (error) {
      console.error('Error initializing SLA:', error)
      alert('An error occurred while initializing SLA')
    } finally {
      setInitializingSLA(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...incidents]

    // Apply text search
    if (searchFilters.searchText && searchFilters.searchText.trim()) {
      const searchLower = searchFilters.searchText.toLowerCase()
      filtered = filtered.filter(incident =>
        incident.ref.toLowerCase().includes(searchLower) ||
        incident.subject.toLowerCase().includes(searchLower) ||
        incident.description.toLowerCase().includes(searchLower) ||
        incident.companyName.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (searchFilters.status && searchFilters.status.length > 0) {
      filtered = filtered.filter(incident => searchFilters.status!.includes(incident.status))
    }

    // Apply priority filter
    if (searchFilters.priority && searchFilters.priority.length > 0) {
      filtered = filtered.filter(incident => searchFilters.priority!.includes(incident.priority))
    }

    // Apply company filter
    if (searchFilters.companyId && searchFilters.companyId.length > 0) {
      filtered = filtered.filter(incident => searchFilters.companyId!.includes(incident.companyId))
    }

    // Apply assignee filter
    if (searchFilters.assignedToId && searchFilters.assignedToId.length > 0) {
      filtered = filtered.filter(incident =>
        incident.assignedToId && searchFilters.assignedToId!.includes(incident.assignedToId)
      )
    }

    // Apply SLA status filter
    if (searchFilters.slaStatus && searchFilters.slaStatus.length > 0) {
      filtered = filtered.filter(incident => searchFilters.slaStatus!.includes(incident.slaStatus))
    }

    // Apply category filter
    if (searchFilters.category && searchFilters.category.length > 0) {
      filtered = filtered.filter(incident => searchFilters.category!.includes(incident.category))
    }

    setFilteredIncidents(filtered)
  }

  const loadSavedQuery = async (queryId: string) => {
    try {
      const response = await fetch(`/api/incident-management/saved-queries/${queryId}`)
      if (response.ok) {
        const data = await response.json()
        setSearchFilters(data.query.filters)
        fetchSavedQueries() // Refresh to update usage count
      }
    } catch (error) {
      console.error('Error loading saved query:', error)
    }
  }

  const handleSaveQuery = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/incident-management/saved-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveQueryForm.name,
          description: saveQueryForm.description,
          filters: searchFilters,
          isGlobal: saveQueryForm.isGlobal
        })
      })

      if (response.ok) {
        setIsSaveQueryModalOpen(false)
        setSaveQueryForm({ name: "", description: "", isGlobal: false })
        fetchSavedQueries()
      }
    } catch (error) {
      console.error('Error saving query:', error)
    }
  }

  const handleDeleteQuery = async (queryId: string) => {
    try {
      const response = await fetch(`/api/incident-management/saved-queries/${queryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSavedQueries()
      }
    } catch (error) {
      console.error('Error deleting query:', error)
    }
  }

  const clearFilters = () => {
    setSearchFilters({
      status: [],
      priority: [],
      companyId: [],
      assignedToId: [],
      slaStatus: [],
      category: [],
      searchText: ""
    })
  }

  const toggleFilterArray = (filterKey: keyof QueryFilters, value: string) => {
    setSearchFilters(prev => {
      const currentArray = (prev[filterKey] as string[]) || []
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
      return { ...prev, [filterKey]: newArray }
    })
  }

  const changeTab = (tab: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    // Remove incident parameter when changing tabs
    url.searchParams.delete('incident')
    router.push(url.pathname + url.search)
  }

  const openIncident = (incident: Incident) => {
    const url = new URL(window.location.href)
    url.searchParams.set('incident', incident.ref)
    router.push(url.pathname + url.search)
  }

  const closeIncident = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('incident')
    router.push(url.pathname + url.search)
  }

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault()

    const company = companies.find(c => c._id === createForm.companyId)
    if (!company) return

    const payload = {
      ...createForm,
      assignedToId: createForm.assignedToId === "unassigned" ? "" : createForm.assignedToId,
      linkedFreshdeskTickets: createForm.linkedFreshdeskTickets ? createForm.linkedFreshdeskTickets.split(',').map(t => t.trim()).filter(t => t) : [],
      linkedJiraTickets: createForm.linkedJiraTickets ? createForm.linkedJiraTickets.split(',').map(t => t.trim()).filter(t => t) : []
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
          assignedToId: "unassigned",
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

  const handleAssigneeUpdate = async (incidentId: string, newAssigneeId: string) => {
    try {
      const response = await fetch(`/api/incident-management/incidents/${incidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: newAssigneeId === "unassigned" ? "" : newAssigneeId })
      })

      if (response.ok) {
        fetchData()
        if (selectedIncident && selectedIncident._id === incidentId) {
          const updatedIncident = await response.json()
          setSelectedIncident(updatedIncident.incident)
        }
      }
    } catch (error) {
      console.error('Error updating assignee:', error)
    }
  }

  const handleSaveSubject = async () => {
    if (!selectedIncident || !editedSubject.trim()) return

    setSavingEdit(true)
    try {
      const response = await fetch(`/api/incident-management/incidents/${selectedIncident._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editedSubject })
      })

      if (response.ok) {
        const updatedIncident = await response.json()
        setSelectedIncident(updatedIncident.incident)
        setIsEditingSubject(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error updating subject:', error)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSaveDescription = async () => {
    if (!selectedIncident || !editedDescription.trim()) return

    setSavingEdit(true)
    try {
      const response = await fetch(`/api/incident-management/incidents/${selectedIncident._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editedDescription })
      })

      if (response.ok) {
        const updatedIncident = await response.json()
        setSelectedIncident(updatedIncident.incident)
        setIsEditingDescription(false)
        fetchData()
      }
    } catch (error) {
      console.error('Error updating description:', error)
    } finally {
      setSavingEdit(false)
    }
  }

  const startEditingSubject = () => {
    if (selectedIncident) {
      setEditedSubject(selectedIncident.subject)
      setIsEditingSubject(true)
    }
  }

  const startEditingDescription = () => {
    if (selectedIncident) {
      setEditedDescription(selectedIncident.description)
      setIsEditingDescription(true)
    }
  }

  const handleAddComment = async (commentType: 'reply' | 'note' | 'private') => {
    if (!selectedIncident || !comment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/incident-management/incidents/${selectedIncident._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment,
          commentType: commentType
        })
      })

      if (response.ok) {
        const updatedData = await response.json()
        setSelectedIncident(updatedData.incident)
        setComment("")
        // Don't call fetchData() to avoid full screen refresh
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleSaveCompany = async (companyData: any) => {
    try {
      if (editingCompany && editingCompany._id) {
        // Update existing company
        const response = await fetch(`/api/incident-management/companies/${editingCompany._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        })
        if (response.ok) {
          setIsCompanyModalOpen(false)
          setEditingCompany(null)
          fetchData()
        }
      } else {
        // Create new company
        const response = await fetch('/api/incident-management/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companyData)
        })
        if (response.ok) {
          setIsCompanyModalOpen(false)
          fetchData()
        }
      }
    } catch (error) {
      console.error('Error saving company:', error)
    }
  }

  const handleSaveContact = async (contactData: any, setLoading: (loading: boolean) => void) => {
    setLoading(true)
    try {
      if (editingContact && editingContact._id) {
        // Update existing contact
        const response = await fetch(`/api/incident-management/contacts/${editingContact._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData)
        })
        if (response.ok) {
          setIsContactModalOpen(false)
          setEditingContact(null)
          fetchData()
        } else {
          const error = await response.json()
          alert(`Error: ${error.error || 'Failed to update contact'}`)
        }
      } else {
        // Create new contact
        const response = await fetch('/api/incident-management/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contactData)
        })
        if (response.ok) {
          setIsContactModalOpen(false)
          fetchData()
        } else {
          const error = await response.json()
          alert(`Error: ${error.error || 'Failed to create contact'}`)
        }
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('An error occurred while saving the contact')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (!confirm(`Are you sure you want to delete ${contactName}? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/incident-management/contacts/${contactId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Contact deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to delete contact'}`)
      }
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('An error occurred while deleting the contact')
    }
  }

  const handleSaveSLA = async (slaData: any) => {
    try {
      if (editingSLA && editingSLA._id) {
        // Update existing SLA
        const response = await fetch(`/api/incident-management/sla-definitions/${editingSLA._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slaData)
        })
        if (response.ok) {
          setIsSLAModalOpen(false)
          setEditingSLA(null)
          await fetchSLADefinitions()
          alert('SLA updated successfully')
        } else {
          const error = await response.json()
          alert(`Error: ${error.error || 'Failed to update SLA'}`)
        }
      } else {
        // Create new SLA
        const response = await fetch('/api/incident-management/sla-definitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slaData)
        })
        if (response.ok) {
          setIsSLAModalOpen(false)
          await fetchSLADefinitions()
          alert('SLA created successfully')
        } else {
          const error = await response.json()
          alert(`Error: ${error.error || 'Failed to create SLA'}`)
        }
      }
    } catch (error) {
      console.error('Error saving SLA:', error)
      alert('An error occurred while saving SLA')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-taranto-red/10 text-taranto-red'
      case 'High': return 'bg-taranto-orange/10 text-taranto-orange'
      case 'Medium': return 'bg-taranto-orange/10 text-taranto-orange'
      case 'Low': return 'bg-taranto-green/10 text-taranto-green'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-taranto-turquoise/10 text-taranto-turquoise'
      case 'Acknowledged': return 'bg-taranto-turquoise/20 text-taranto-turquoise'
      case 'In Progress': return 'bg-taranto-orange/10 text-taranto-orange'
      case 'On Hold': return 'bg-taranto-orange/10 text-taranto-orange'
      case 'Awaiting Customer': return 'bg-purple-100 text-purple-800'
      case 'Resolved': return 'bg-taranto-green/10 text-taranto-green'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      case 'Cancelled': return 'bg-taranto-red/10 text-taranto-red'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSLAStatusColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'Within SLA': return 'text-taranto-green'
      case 'At Risk': return 'text-taranto-orange'
      case 'Breached': return 'text-taranto-red'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A'
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return 'Invalid Date'

    return dateObj.toLocaleDateString('en-GB', {
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

  const activeFiltersCount =
    (searchFilters.status?.length || 0) +
    (searchFilters.priority?.length || 0) +
    (searchFilters.companyId?.length || 0) +
    (searchFilters.assignedToId?.length || 0) +
    (searchFilters.slaStatus?.length || 0) +
    (searchFilters.category?.length || 0) +
    (searchFilters.searchText ? 1 : 0)

  // If an incident is selected, show the integrated detail view
  if (selectedIncident) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="taranto-heading flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeIncident}
                  className="mr-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Ticket className="h-5 w-5 text-taranto-turquoise" />
                {selectedIncident.ref}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedIncident.companyName} • Created {formatDate(selectedIncident.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-medium text-gray-500">Subject</Label>
                    {!isEditingSubject && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={startEditingSubject}
                        className="h-6"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {isEditingSubject ? (
                    <div className="flex gap-2">
                      <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveSubject}
                        disabled={savingEdit || !editedSubject.trim()}
                      >
                        {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingSubject(false)}
                        disabled={savingEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-1 text-lg font-medium">{selectedIncident.subject}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-medium text-gray-500">Description</Label>
                    {!isEditingDescription && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={startEditingDescription}
                        className="h-6"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="min-h-[120px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveDescription}
                          disabled={savingEdit || !editedDescription.trim()}
                        >
                          {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingDescription(false)}
                          disabled={savingEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedIncident.description}</p>
                    </div>
                  )}
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

                {((selectedIncident.linkedFreshdeskTickets && selectedIncident.linkedFreshdeskTickets.length > 0) || (selectedIncident.linkedJiraTickets && selectedIncident.linkedJiraTickets.length > 0)) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500 mb-2 block">Linked Tickets</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedIncident.linkedFreshdeskTickets && selectedIncident.linkedFreshdeskTickets.map((ticket) => (
                        <a
                          key={ticket}
                          href={getFreshdeskUrl(ticket)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Badge variant="outline" className="flex items-center gap-1 hover:bg-taranto-turquoise/10 cursor-pointer">
                            <Ticket className="h-3 w-3" />
                            FD: {ticket}
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </a>
                      ))}
                      {selectedIncident.linkedJiraTickets && selectedIncident.linkedJiraTickets.map((ticket) => (
                        <a
                          key={ticket}
                          href={getJiraUrl(ticket)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Badge variant="outline" className="flex items-center gap-1 hover:bg-taranto-turquoise/10 cursor-pointer">
                            <Ticket className="h-3 w-3" />
                            JIRA: {ticket}
                            <ExternalLink className="h-3 w-3" />
                          </Badge>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
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
                  <div className="mt-1">
                    <Select
                      value={selectedIncident.assignedToId || "unassigned"}
                      onValueChange={(value) => handleAssigneeUpdate(selectedIncident._id!, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {selectedIncident.assignedToName || 'Unassigned'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user._id?.toString()} value={user._id?.toString() || `user-${user.email}`}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Reported By</Label>
                  <p className="mt-1">{selectedIncident.reportedByName}</p>
                  <p className="text-sm text-gray-500">{selectedIncident.reportedByEmail}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Metadata</Label>
                  <div className="mt-1 text-sm text-gray-600 space-y-1">
                    <p>Views: {selectedIncident.viewCount || 0}</p>
                    <p>Reopened: {selectedIncident.reopenCount || 0} times</p>
                    <p>Escalation Level: {selectedIncident.escalationLevel || 0}</p>
                    <p>Updated: {formatDate(selectedIncident.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="h-5 w-5" />
                <Label className="text-lg font-medium">Updates & Comments</Label>
              </div>

              <ScrollArea className="h-96 mb-4 border rounded-lg p-4">
                <div className="space-y-4">
                  {(!selectedIncident.customerUpdates || selectedIncident.customerUpdates.length === 0) && (!selectedIncident.internalNotes || selectedIncident.internalNotes.length === 0) ? (
                    <p className="text-sm text-gray-500 italic">No comments yet</p>
                  ) : (
                    <>
                      {selectedIncident.customerUpdates && selectedIncident.customerUpdates.map((update: any, index: number) => (
                        <div key={update._id || update.id || `update-${index}`} className="bg-taranto-turquoise/10 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{update.authorName}</span>
                            <span className="text-xs text-gray-500">{formatDate(update.createdAt)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                          {update.visibleToCustomer && (
                            <Badge variant="outline" className="mt-2 text-xs">Visible to customer</Badge>
                          )}
                        </div>
                      ))}
                      {selectedIncident.internalNotes && selectedIncident.internalNotes.map((note: any, index: number) => (
                        <div key={note._id || note.id || `note-${index}`} className="bg-gray-50 p-3 rounded-lg border-l-4 border-gray-400">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{note.authorName}</span>
                            <span className="text-xs text-gray-500">{formatDate(note.createdAt)}</span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <Badge variant="outline" className="mt-2 text-xs">Internal only</Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>

              <div className="grid gap-2">
                <Textarea
                  placeholder="Add a comment or update..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddComment('private')}
                    disabled={!comment.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Private Note
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAddComment('note')}
                    disabled={!comment.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    Add Note
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleAddComment('reply')}
                    disabled={!comment.trim() || submittingComment}
                  >
                    {submittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    Reply (Send Email)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-end items-center">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-taranto-turquoise hover:bg-taranto-turquoise/90 text-white">
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
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user._id?.toString()} value={user._id?.toString() || `user-${user.email}`}>
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
                  <Button type="submit" className="bg-taranto-turquoise hover:bg-taranto-turquoise/90 text-white">Create Incident</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
          {/* DASHBOARD TAB */}
          {currentTab === 'dashboard' && stats && (
            <div className="space-y-4">
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <p className="text-sm text-muted-foreground">Total Tickets</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-taranto-turquoise">
                        {(stats.byStatus['New'] || 0) + (stats.byStatus['Acknowledged'] || 0) + (stats.byStatus['In Progress'] || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">Open</p>
                      <TrendingUp className="h-4 w-4 mx-auto mt-1 text-taranto-turquoise" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-taranto-orange">{stats.slaCompliance.atRisk}</div>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                      <AlertTriangle className="h-4 w-4 mx-auto mt-1 text-taranto-orange" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-taranto-red">{stats.slaCompliance.breached}</div>
                      <p className="text-sm text-muted-foreground">Breached</p>
                      <AlertCircle className="h-4 w-4 mx-auto mt-1 text-taranto-red" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-taranto-green">{stats.slaCompliance.complianceRate.toFixed(1)}%</div>
                      <p className="text-sm text-muted-foreground">SLA Rate</p>
                      <CheckCircle className="h-4 w-4 mx-auto mt-1 text-taranto-green" />
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="taranto-heading text-lg">Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.byStatus).map(([status, count]) => (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(status)}>{status}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    status === 'Resolved' || status === 'Closed' ? 'bg-taranto-green' :
                                    status === 'In Progress' ? 'bg-taranto-turquoise' :
                                    status === 'On Hold' ? 'bg-taranto-orange' : 'bg-gray-500'
                                  }`}
                                  style={{ width: `${(count / stats.total) * 100}%` }}
                                />
                              </div>
                              <span className="font-semibold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Priority Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="taranto-heading text-lg">Priority Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.byPriority).map(([priority, count]) => (
                          <div key={priority} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(priority)}>{priority}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    priority === 'Critical' ? 'bg-taranto-red' :
                                    priority === 'High' ? 'bg-taranto-orange' :
                                    priority === 'Medium' ? 'bg-taranto-orange' : 'bg-taranto-green'
                                  }`}
                                  style={{ width: `${(count / stats.total) * 100}%` }}
                                />
                              </div>
                              <span className="font-semibold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* High Priority Incidents */}
                {incidents && incidents.filter(i => i.priority === 'Critical' || i.priority === 'High').length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="taranto-heading text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-taranto-red" />
                        High Priority Incidents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {incidents && incidents.filter(i => i.priority === 'Critical' || i.priority === 'High').slice(0, 5).map((incident) => (
                          <div key={incident._id} className="flex items-center justify-between p-3 bg-taranto-red/10 rounded-lg border-l-4 border-taranto-red hover:bg-taranto-red/20 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-mono font-semibold">{incident.ref}</h4>
                                <Badge className={getPriorityColor(incident.priority)}>{incident.priority}</Badge>
                                <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                              </div>
                              <p className="text-sm text-gray-700 font-medium">{incident.subject}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {incident.companyName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due: {formatDate(incident.dueByTime)}
                                </span>
                                <span className={getSLAStatusColor(incident.slaStatus)}>
                                  {incident.slaStatus}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openIncident(incident)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Top Companies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="taranto-heading text-lg">Top Companies by Incident Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.byCompany.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-taranto-turquoise/20 flex items-center justify-center text-taranto-turquoise font-semibold text-sm">
                              {index + 1}
                            </div>
                            <span className="font-medium">{item.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-taranto-turquoise"
                                style={{ width: `${(item.count / stats.byCompany[0].count) * 100}%` }}
                              />
                            </div>
                            <span className="font-semibold w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            </div>
          )}

          {/* SEARCH TAB */}
          {currentTab === 'search' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="taranto-heading text-lg">Search & Filter Incidents</CardTitle>
                    <CardDescription>
                      Apply filters to find specific incidents. Save frequently used searches.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {activeFiltersCount > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-2" />
                          Clear Filters
                        </Button>
                        <Dialog open={isSaveQueryModalOpen} onOpenChange={setIsSaveQueryModalOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Save className="h-4 w-4 mr-2" />
                              Save Query
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Save Query</DialogTitle>
                              <DialogDescription>
                                Save this search query for quick access later
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveQuery}>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Query Name *</Label>
                                  <Input
                                    value={saveQueryForm.name}
                                    onChange={(e) => setSaveQueryForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., Critical Open Tickets"
                                    required
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={saveQueryForm.description}
                                    onChange={(e) => setSaveQueryForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional description"
                                    rows={2}
                                  />
                                </div>
                                {session?.user.permissions.admin && (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id="isGlobal"
                                      checked={saveQueryForm.isGlobal}
                                      onChange={(e) => setSaveQueryForm(prev => ({ ...prev, isGlobal: e.target.checked }))}
                                      className="rounded"
                                    />
                                    <Label htmlFor="isGlobal" className="flex items-center gap-2">
                                      <Globe className="h-4 w-4" />
                                      Make this query available to all users
                                    </Label>
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <Button type="submit">
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Query
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Saved Queries */}
                {savedQueries.length > 0 && (
                  <div className="mb-4">
                    <Label className="mb-2 block">Saved Queries</Label>
                    <div className="flex flex-wrap gap-2">
                      {savedQueries.map((query) => (
                        <div key={query._id} className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadSavedQuery(query._id!)}
                            className="flex items-center gap-2"
                          >
                            {query.isGlobal ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            {query.name}
                            <Badge variant="secondary" className="ml-1">{query.usageCount}</Badge>
                          </Button>
                          {query.createdBy === session?.user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuery(query._id!)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                  </div>
                )}

                {/* Search Filters */}
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Text Search</Label>
                    <Input
                      placeholder="Search by reference, subject, description, or company..."
                      value={searchFilters.searchText || ""}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, searchText: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <div className="flex flex-wrap gap-2">
                        {['New', 'Acknowledged', 'In Progress', 'On Hold', 'Awaiting Customer', 'Resolved', 'Closed'].map(status => (
                          <Badge
                            key={status}
                            className={`cursor-pointer ${
                              searchFilters.status?.includes(status) ? getStatusColor(status) : 'bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => toggleFilterArray('status', status)}
                          >
                            {status}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="grid gap-2">
                      <Label>Priority</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Critical', 'High', 'Medium', 'Low'].map(priority => (
                          <Badge
                            key={priority}
                            className={`cursor-pointer ${
                              searchFilters.priority?.includes(priority) ? getPriorityColor(priority) : 'bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => toggleFilterArray('priority', priority)}
                          >
                            {priority}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* SLA Status Filter */}
                    <div className="grid gap-2">
                      <Label>SLA Status</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Within SLA', 'At Risk', 'Breached'].map(sla => (
                          <Badge
                            key={sla}
                            className={`cursor-pointer ${
                              searchFilters.slaStatus?.includes(sla)
                                ? sla === 'Within SLA' ? 'bg-taranto-green/10 text-taranto-green' :
                                  sla === 'At Risk' ? 'bg-taranto-orange/10 text-taranto-orange' :
                                  'bg-taranto-red/10 text-taranto-red'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                            onClick={() => toggleFilterArray('slaStatus', sla)}
                          >
                            {sla}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Company Filter */}
                    <div className="grid gap-2">
                      <Label>Company</Label>
                      <Select
                        value={searchFilters.companyId?.[0] || "all"}
                        onValueChange={(value) => setSearchFilters(prev => ({ ...prev, companyId: value === "all" ? [] : [value] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All companies" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All companies</SelectItem>
                          {companies.filter(c => c.active).map((company) => (
                            <SelectItem key={company._id} value={company._id || `company-${company.name}`}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assignee Filter */}
                    <div className="grid gap-2">
                      <Label>Assigned To</Label>
                      <Select
                        value={searchFilters.assignedToId?.[0] || "all"}
                        onValueChange={(value) => setSearchFilters(prev => ({ ...prev, assignedToId: value === "all" ? [] : [value] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All agents" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All agents</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user._id} value={user._id?.toString() || `user-${user.email}`}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Results */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">
                      Results ({filteredIncidents.length} of {incidents.length})
                    </h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ref</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>SLA</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncidents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                            No incidents match the selected filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredIncidents.map((incident) => (
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
                            <TableCell className="text-sm">{incident.assignedToName || 'Unassigned'}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openIncident(incident)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* COMPANIES TAB */}
          {currentTab === 'companies' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="taranto-heading text-lg">Customer Management</CardTitle>
                    <CardDescription>Manage companies and their contacts</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                      <Button
                        variant={companiesContactsView === 'companies' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCompaniesContactsView('companies')}
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Companies
                      </Button>
                      <Button
                        variant={companiesContactsView === 'contacts' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCompaniesContactsView('contacts')}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Contacts
                      </Button>
                    </div>
                    {companiesContactsView === 'companies' ? (
                      <Button onClick={() => { setEditingCompany(null); setIsCompanyModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Company
                      </Button>
                    ) : (
                      <Button onClick={() => { setEditingContact(null); setIsContactModalOpen(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Contact
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {companiesContactsView === 'companies' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>SLA Tier</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Open</TableHead>
                        <TableHead>SLA Rate</TableHead>
                        <TableHead>Portal</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies && companies.filter(c => c.active).map((company) => (
                        <TableRow key={company._id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="font-mono text-sm">{company.companyCode}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{company.slaName}</Badge>
                          </TableCell>
                          <TableCell>{company.totalIncidents}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{company.openIncidents}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={company.slaComplianceRate >= 90 ? 'text-taranto-green font-semibold' : company.slaComplianceRate >= 80 ? 'text-taranto-orange font-semibold' : 'text-taranto-red font-semibold'}>
                              {company.slaComplianceRate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            {company.portalEnabled ? (
                              <CheckCircle className="h-4 w-4 text-taranto-green" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setEditingCompany(company); setIsCompanyModalOpen(true); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Portal Access</TableHead>
                        <TableHead>Incidents Logged</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts && contacts.filter(c => c.active).map((contact) => (
                        <TableRow key={contact._id}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.companyName}</TableCell>
                          <TableCell>{contact.jobTitle || '-'}</TableCell>
                          <TableCell>
                            {contact.portalAccess ? (
                              <CheckCircle className="h-4 w-4 text-taranto-green" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{contact.totalIncidentsLogged}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteContact(contact._id!, contact.name)}
                                className="text-taranto-red hover:text-taranto-red hover:bg-taranto-red/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* REPORTING TAB */}
          {currentTab === 'reporting' && (
            <Card>
              <CardHeader>
                <CardTitle className="taranto-heading text-lg">Reporting (Coming Soon)</CardTitle>
                <CardDescription>Advanced reporting and analytics features will be available here</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">
                  Export reports, trend analysis, and custom dashboards will be available in a future update.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ADMIN TAB */}
          {currentTab === 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="taranto-heading text-lg">Admin Panel</CardTitle>
                <CardDescription>Manage SLA definitions and system configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* SLA Management Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">SLA Definitions</h3>
                        <p className="text-sm text-gray-600">Configure service level agreements and response times</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => { setEditingSLA(null); setIsSLAModalOpen(true); }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New SLA
                        </Button>
                        {slaDefinitions.length === 0 && (
                          <Button
                            variant="outline"
                            onClick={handleInitializeSLA}
                            disabled={initializingSLA}
                          >
                            {initializingSLA ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            {initializingSLA ? 'Initializing...' : 'Initialize Default SLA'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {slaDefinitions.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                        <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h4 className="text-lg font-semibold mb-2">No SLA Definitions Found</h4>
                        <p className="text-gray-600 mb-4">Create a default SLA definition to get started</p>
                        <Button
                          onClick={handleInitializeSLA}
                          disabled={initializingSLA}
                        >
                          {initializingSLA ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {initializingSLA ? 'Initializing...' : 'Initialize Default SLA'}
                        </Button>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Tier</TableHead>
                            <TableHead>Critical Response</TableHead>
                            <TableHead>High Response</TableHead>
                            <TableHead>Medium Response</TableHead>
                            <TableHead>Low Response</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {slaDefinitions.map((sla) => (
                            <TableRow key={sla._id}>
                              <TableCell className="font-medium">{sla.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">Tier {sla.tier}</Badge>
                              </TableCell>
                              <TableCell>{sla.criticalResponseHours}h</TableCell>
                              <TableCell>{sla.highResponseHours}h</TableCell>
                              <TableCell>{sla.mediumResponseHours}h</TableCell>
                              <TableCell>{sla.lowResponseHours}h</TableCell>
                              <TableCell>
                                {sla.isDefault && (
                                  <Badge variant="secondary">Default</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {sla.active ? (
                                  <CheckCircle className="h-4 w-4 text-taranto-green" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-gray-400" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setEditingSLA(sla); setIsSLAModalOpen(true); }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  <Separator />

                  {/* Future Admin Features */}
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Additional admin features coming soon...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* COMPANY DIALOG */}
          <Dialog open={isCompanyModalOpen} onOpenChange={(open) => { setIsCompanyModalOpen(open); if (!open) setEditingCompany(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Edit Company' : 'Create New Company'}</DialogTitle>
                <DialogDescription>
                  {editingCompany ? 'Update company details' : 'Add a new company to the system'}
                </DialogDescription>
              </DialogHeader>
              <CompanyForm
                company={editingCompany}
                onSave={handleSaveCompany}
                onCancel={() => { setIsCompanyModalOpen(false); setEditingCompany(null); }}
              />
            </DialogContent>
          </Dialog>

          {/* CONTACT DIALOG */}
          <Dialog open={isContactModalOpen} onOpenChange={(open) => { setIsContactModalOpen(open); if (!open) setEditingContact(null); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingContact ? 'Edit Contact' : 'Create New Contact'}</DialogTitle>
                <DialogDescription>
                  {editingContact ? 'Update contact details' : 'Add a new contact to the system'}
                </DialogDescription>
              </DialogHeader>
              <ContactForm
                contact={editingContact}
                companies={companies}
                onSave={handleSaveContact}
                onCancel={() => { setIsContactModalOpen(false); setEditingContact(null); }}
              />
            </DialogContent>
          </Dialog>

          {/* SLA DIALOG */}
          <Dialog open={isSLAModalOpen} onOpenChange={(open) => { setIsSLAModalOpen(open); if (!open) setEditingSLA(null); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingSLA ? 'Edit SLA Definition' : 'Create New SLA Definition'}</DialogTitle>
                <DialogDescription>
                  {editingSLA ? 'Update SLA configuration and response times' : 'Add a new SLA tier to the system'}
                </DialogDescription>
              </DialogHeader>
              <SLAForm
                sla={editingSLA}
                onSave={handleSaveSLA}
                onCancel={() => { setIsSLAModalOpen(false); setEditingSLA(null); }}
              />
            </DialogContent>
          </Dialog>
      </CardContent>
    </Card>
  )
}

// Company Form Component
function CompanyForm({ company, onSave, onCancel }: { company: Company | null; onSave: (data: any) => void; onCancel: () => void }) {
  const [slaDefinitions, setSlaDefinitions] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: company?.name || '',
    domain: company?.domain || '',
    companyCode: company?.companyCode || '',
    slaId: company?.slaId || '',
    portalEnabled: company?.portalEnabled ?? true,
    primaryContactName: company?.primaryContactName || '',
    primaryContactEmail: company?.primaryContactEmail || '',
    primaryContactPhone: company?.primaryContactPhone || ''
  })

  useEffect(() => {
    const fetchSLAs = async () => {
      const response = await fetch('/api/incident-management/sla-definitions')
      if (response.ok) {
        const data = await response.json()
        setSlaDefinitions(data.slaDefinitions || [])
      }
    }
    fetchSLAs()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name || !formData.domain || !formData.companyCode || !formData.slaId) {
      alert('Please fill in all required fields (Name, Domain, Company Code, and SLA Tier)')
      return
    }

    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="domain">Domain *</Label>
          <Input
            id="domain"
            placeholder="example.com"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="companyCode">Company Code *</Label>
          <Input
            id="companyCode"
            placeholder="ABC123"
            value={formData.companyCode}
            onChange={(e) => setFormData(prev => ({ ...prev, companyCode: e.target.value }))}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slaId">SLA Tier *</Label>
          <Select
            value={formData.slaId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, slaId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select SLA tier" />
            </SelectTrigger>
            <SelectContent>
              {slaDefinitions.map((sla) => (
                <SelectItem key={sla._id} value={sla._id}>
                  {sla.name} - Tier {sla.tier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="primaryContactName">Primary Contact Name</Label>
          <Input
            id="primaryContactName"
            value={formData.primaryContactName}
            onChange={(e) => setFormData(prev => ({ ...prev, primaryContactName: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="primaryContactEmail">Primary Contact Email</Label>
          <Input
            id="primaryContactEmail"
            type="email"
            value={formData.primaryContactEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, primaryContactEmail: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="primaryContactPhone">Primary Contact Phone</Label>
          <Input
            id="primaryContactPhone"
            value={formData.primaryContactPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, primaryContactPhone: e.target.value }))}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="portalEnabled"
            checked={formData.portalEnabled}
            onChange={(e) => setFormData(prev => ({ ...prev, portalEnabled: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="portalEnabled">Enable Customer Portal Access</Label>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{company ? 'Update' : 'Create'} Company</Button>
      </DialogFooter>
    </form>
  )
}

// Contact Form Component
function ContactForm({ contact, companies, onSave, onCancel }: { contact: Contact | null; companies: Company[]; onSave: (data: any, setLoading: (loading: boolean) => void) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    jobTitle: contact?.jobTitle || '',
    department: contact?.department || '',
    companyId: contact?.companyId || '',
    portalAccess: contact?.portalAccess ?? true,
    canLogIncidents: contact?.canLogIncidents ?? true,
    receiveNotifications: contact?.receiveNotifications ?? true,
    portalPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const selectedCompany = companies.find(c => c._id === formData.companyId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent double submission
    if (isSubmitting) return

    // Validate password if portal access is enabled and password is provided
    if (formData.portalAccess && formData.portalPassword && formData.portalPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    const payload = {
      ...formData,
      companyName: selectedCompany?.name || ''
    }
    onSave(payload, setIsSubmitting)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="contact-name">Name *</Label>
          <Input
            id="contact-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-email">Email *</Label>
          <Input
            id="contact-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            disabled={isSubmitting}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contact-company">Company *</Label>
          <Select
            value={formData.companyId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
            required
            disabled={isSubmitting}
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
            <Label htmlFor="contact-jobTitle">Job Title</Label>
            <Input
              id="contact-jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-department">Department</Label>
            <Input
              id="contact-department"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="portalAccess"
              checked={formData.portalAccess}
              onChange={(e) => setFormData(prev => ({ ...prev, portalAccess: e.target.checked }))}
              className="rounded"
              disabled={isSubmitting}
            />
            <Label htmlFor="portalAccess">Portal Access</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="canLogIncidents"
              checked={formData.canLogIncidents}
              onChange={(e) => setFormData(prev => ({ ...prev, canLogIncidents: e.target.checked }))}
              className="rounded"
              disabled={isSubmitting}
            />
            <Label htmlFor="canLogIncidents">Can Log Incidents</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="receiveNotifications"
              checked={formData.receiveNotifications}
              onChange={(e) => setFormData(prev => ({ ...prev, receiveNotifications: e.target.checked }))}
              className="rounded"
              disabled={isSubmitting}
            />
            <Label htmlFor="receiveNotifications">Receive Notifications</Label>
          </div>
        </div>

        {formData.portalAccess && (
          <div className="grid gap-2 p-4 bg-taranto-turquoise/10 rounded-lg border border-taranto-turquoise/30">
            <Label htmlFor="portalPassword" className="font-semibold text-taranto-grey">
              Portal Password {contact ? '(leave blank to keep existing)' : '*'}
            </Label>
            <p className="text-xs text-taranto-grey mb-2">
              {contact
                ? 'Enter a new password only if you want to change it. Leave blank to keep the existing password.'
                : 'Set a password for this user to access the customer portal (minimum 6 characters).'}
            </p>
            <div className="relative">
              <Input
                id="portalPassword"
                type={showPassword ? "text" : "password"}
                value={formData.portalPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, portalPassword: e.target.value }))}
                placeholder="Enter password"
                disabled={isSubmitting}
                required={!contact && formData.portalAccess}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (contact ? 'Update' : 'Create')} {isSubmitting ? '' : 'Contact'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// SLA Form Component
function SLAForm({ sla, onSave, onCancel }: { sla: any | null; onSave: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: sla?.name || '',
    description: sla?.description || '',
    tier: sla?.tier || 1,
    criticalResponseHours: sla?.criticalResponseHours || 1,
    highResponseHours: sla?.highResponseHours || 4,
    mediumResponseHours: sla?.mediumResponseHours || 8,
    lowResponseHours: sla?.lowResponseHours || 24,
    criticalResolutionHours: sla?.criticalResolutionHours || 4,
    highResolutionHours: sla?.highResolutionHours || 24,
    mediumResolutionHours: sla?.mediumResolutionHours || 72,
    lowResolutionHours: sla?.lowResolutionHours || 168,
    useBusinessHoursOnly: sla?.useBusinessHoursOnly ?? false,
    timezone: sla?.defaultBusinessHours?.timezone || 'Europe/London',
    mondayStart: sla?.defaultBusinessHours?.monday?.start || '09:00',
    mondayEnd: sla?.defaultBusinessHours?.monday?.end || '17:00',
    tuesdayStart: sla?.defaultBusinessHours?.tuesday?.start || '09:00',
    tuesdayEnd: sla?.defaultBusinessHours?.tuesday?.end || '17:00',
    wednesdayStart: sla?.defaultBusinessHours?.wednesday?.start || '09:00',
    wednesdayEnd: sla?.defaultBusinessHours?.wednesday?.end || '17:00',
    thursdayStart: sla?.defaultBusinessHours?.thursday?.start || '09:00',
    thursdayEnd: sla?.defaultBusinessHours?.thursday?.end || '17:00',
    fridayStart: sla?.defaultBusinessHours?.friday?.start || '09:00',
    fridayEnd: sla?.defaultBusinessHours?.friday?.end || '17:00',
    saturdayStart: sla?.defaultBusinessHours?.saturday?.start || '',
    saturdayEnd: sla?.defaultBusinessHours?.saturday?.end || '',
    sundayStart: sla?.defaultBusinessHours?.sunday?.start || '',
    sundayEnd: sla?.defaultBusinessHours?.sunday?.end || '',
    autoEscalation: sla?.autoEscalation ?? true,
    escalationThresholdPercent: sla?.escalationThresholdPercent || 80,
    notifyAt50Percent: sla?.notificationRules?.notifyAt50Percent ?? false,
    notifyAt80Percent: sla?.notificationRules?.notifyAt80Percent ?? true,
    notifyOnBreach: sla?.notificationRules?.notifyOnBreach ?? true,
    emailAddresses: sla?.notificationRules?.emailAddresses?.join(', ') || '',
    monthlyCost: sla?.monthlyCost || '',
    perIncidentCost: sla?.perIncidentCost || '',
    isDefault: sla?.isDefault ?? false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const defaultBusinessHours: any = {
      timezone: formData.timezone,
      monday: { start: formData.mondayStart, end: formData.mondayEnd },
      tuesday: { start: formData.tuesdayStart, end: formData.tuesdayEnd },
      wednesday: { start: formData.wednesdayStart, end: formData.wednesdayEnd },
      thursday: { start: formData.thursdayStart, end: formData.thursdayEnd },
      friday: { start: formData.fridayStart, end: formData.fridayEnd }
    }

    if (formData.saturdayStart && formData.saturdayEnd) {
      defaultBusinessHours.saturday = { start: formData.saturdayStart, end: formData.saturdayEnd }
    }

    if (formData.sundayStart && formData.sundayEnd) {
      defaultBusinessHours.sunday = { start: formData.sundayStart, end: formData.sundayEnd }
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      tier: Number(formData.tier),
      criticalResponseHours: Number(formData.criticalResponseHours),
      highResponseHours: Number(formData.highResponseHours),
      mediumResponseHours: Number(formData.mediumResponseHours),
      lowResponseHours: Number(formData.lowResponseHours),
      criticalResolutionHours: Number(formData.criticalResolutionHours),
      highResolutionHours: Number(formData.highResolutionHours),
      mediumResolutionHours: Number(formData.mediumResolutionHours),
      lowResolutionHours: Number(formData.lowResolutionHours),
      useBusinessHoursOnly: formData.useBusinessHoursOnly,
      defaultBusinessHours,
      autoEscalation: formData.autoEscalation,
      escalationThresholdPercent: Number(formData.escalationThresholdPercent),
      notificationRules: {
        notifyAt50Percent: formData.notifyAt50Percent,
        notifyAt80Percent: formData.notifyAt80Percent,
        notifyOnBreach: formData.notifyOnBreach,
        emailAddresses: formData.emailAddresses.split(',').map(e => e.trim()).filter(e => e)
      },
      monthlyCost: formData.monthlyCost ? Number(formData.monthlyCost) : undefined,
      perIncidentCost: formData.perIncidentCost ? Number(formData.perIncidentCost) : undefined,
      isDefault: formData.isDefault
    }

    onSave(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 py-4">
        {/* Basic Info Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sla-name">SLA Name *</Label>
              <Input
                id="sla-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premium Support"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sla-tier">Tier *</Label>
              <Input
                id="sla-tier"
                type="number"
                min="1"
                value={formData.tier}
                onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sla-description">Description *</Label>
            <Textarea
              id="sla-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this SLA tier"
              required
              rows={2}
            />
          </div>
        </div>

        <Separator />

        {/* Response Times Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Response Times (hours)</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="critical-response">Critical *</Label>
              <Input
                id="critical-response"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.criticalResponseHours}
                onChange={(e) => setFormData(prev => ({ ...prev, criticalResponseHours: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="high-response">High *</Label>
              <Input
                id="high-response"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.highResponseHours}
                onChange={(e) => setFormData(prev => ({ ...prev, highResponseHours: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medium-response">Medium *</Label>
              <Input
                id="medium-response"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.mediumResponseHours}
                onChange={(e) => setFormData(prev => ({ ...prev, mediumResponseHours: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="low-response">Low *</Label>
              <Input
                id="low-response"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.lowResponseHours}
                onChange={(e) => setFormData(prev => ({ ...prev, lowResponseHours: e.target.value }))}
                required
              />
            </div>
          </div>
        </div>

        {/* Resolution Times Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Resolution Times (hours)</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="critical-resolution">Critical *</Label>
              <Input
                id="critical-resolution"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.criticalResolutionHours}
                onChange={(e) => setFormData(prev => ({ ...prev, criticalResolutionHours: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="high-resolution">High *</Label>
              <Input
                id="high-resolution"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.highResolutionHours}
                onChange={(e) => setFormData(prev => ({ ...prev, highResolutionHours: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="medium-resolution">Medium *</Label>
              <Input
                id="medium-resolution"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.mediumResolutionHours}
                onChange={(e) => setFormData(prev => ({ ...prev, mediumResolutionHours: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="low-resolution">Low *</Label>
              <Input
                id="low-resolution"
                type="number"
                min="0.25"
                step="0.25"
                value={formData.lowResolutionHours}
                onChange={(e) => setFormData(prev => ({ ...prev, lowResolutionHours: e.target.value }))}
                required
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Business Hours Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Business Hours</h4>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useBusinessHoursOnly"
                checked={formData.useBusinessHoursOnly}
                onChange={(e) => setFormData(prev => ({ ...prev, useBusinessHoursOnly: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="useBusinessHoursOnly">Use Business Hours Only</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
              placeholder="Europe/London"
            />
          </div>
          <div className="grid gap-3">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <div key={day} className="grid grid-cols-3 gap-4 items-center">
                <Label className="capitalize">{day}</Label>
                <Input
                  type="time"
                  value={formData[`${day}Start` as keyof typeof formData] as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`${day}Start`]: e.target.value }))}
                  placeholder="Start"
                />
                <Input
                  type="time"
                  value={formData[`${day}End` as keyof typeof formData] as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`${day}End`]: e.target.value }))}
                  placeholder="End"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Escalation & Notifications Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Escalation & Notifications</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoEscalation"
                checked={formData.autoEscalation}
                onChange={(e) => setFormData(prev => ({ ...prev, autoEscalation: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="autoEscalation">Auto Escalation Enabled</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="escalationThreshold">Escalation Threshold (%)</Label>
              <Input
                id="escalationThreshold"
                type="number"
                min="0"
                max="100"
                value={formData.escalationThresholdPercent}
                onChange={(e) => setFormData(prev => ({ ...prev, escalationThresholdPercent: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyAt50"
                checked={formData.notifyAt50Percent}
                onChange={(e) => setFormData(prev => ({ ...prev, notifyAt50Percent: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="notifyAt50">Notify at 50% SLA</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyAt80"
                checked={formData.notifyAt80Percent}
                onChange={(e) => setFormData(prev => ({ ...prev, notifyAt80Percent: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="notifyAt80">Notify at 80% SLA</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyOnBreach"
                checked={formData.notifyOnBreach}
                onChange={(e) => setFormData(prev => ({ ...prev, notifyOnBreach: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="notifyOnBreach">Notify on Breach</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emailAddresses">Notification Email Addresses (comma-separated)</Label>
            <Textarea
              id="emailAddresses"
              value={formData.emailAddresses}
              onChange={(e) => setFormData(prev => ({ ...prev, emailAddresses: e.target.value }))}
              placeholder="email1@example.com, email2@example.com"
              rows={2}
            />
          </div>
        </div>

        <Separator />

        {/* Pricing & Settings Section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Pricing & Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="monthlyCost">Monthly Cost (optional)</Label>
              <Input
                id="monthlyCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyCost}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyCost: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="perIncidentCost">Per Incident Cost (optional)</Label>
              <Input
                id="perIncidentCost"
                type="number"
                min="0"
                step="0.01"
                value={formData.perIncidentCost}
                onChange={(e) => setFormData(prev => ({ ...prev, perIncidentCost: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="isDefault">Set as Default SLA</Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{sla ? 'Update' : 'Create'} SLA</Button>
      </DialogFooter>
    </form>
  )
}
