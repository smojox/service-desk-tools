"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  ExternalLink, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Hash, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Tag
} from 'lucide-react'
import { freshdeskClient } from '@/lib/freshdesk-client'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface TicketDetailModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketNumber?: string
}

export function TicketDetailModal({ isOpen, onClose, ticketId, ticketNumber }: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Only load ticket details when user explicitly requests them
  // useEffect(() => {
  //   if (isOpen && ticketId) {
  //     loadTicketDetails()
  //   }
  // }, [isOpen, ticketId])

  const loadTicketDetails = async () => {
    if (!ticketId) return

    setLoading(true)
    setError(null)

    try {
      const response = await freshdeskClient.getTicket(ticketId)
      
      if (response.error) {
        setError(response.error)
        toast.error(`Failed to load ticket details: ${response.error}`)
      } else if (response.data) {
        setTicket(response.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      toast.error(`Failed to load ticket details: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'bg-red-100 text-red-800' // Urgent
      case 3: return 'bg-orange-100 text-orange-800' // High
      case 2: return 'bg-yellow-100 text-yellow-800' // Medium
      case 1: return 'bg-blue-100 text-blue-800' // Low
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 4: return 'Urgent'
      case 3: return 'High'
      case 2: return 'Medium'
      case 1: return 'Low'
      default: return 'Unknown'
    }
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 2: return 'bg-green-100 text-green-800' // Open
      case 3: return 'bg-yellow-100 text-yellow-800' // Pending
      case 4: return 'bg-blue-100 text-blue-800' // Resolved
      case 5: return 'bg-gray-100 text-gray-800' // Closed
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 2: return 'Open'
      case 3: return 'Pending'
      case 4: return 'Resolved'
      case 5: return 'Closed'
      default: return 'Unknown'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch {
      return dateString
    }
  }

  const openInFreshdesk = () => {
    if (ticket && process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN) {
      const url = `https://${process.env.NEXT_PUBLIC_FRESHDESK_DOMAIN}.freshdesk.com/a/tickets/${ticket.id}`
      window.open(url, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Hash className="h-5 w-5 text-blue-600 mr-2" />
              <span>Ticket Details</span>
              {ticketNumber && (
                <span className="ml-2 text-sm font-normal text-gray-600">
                  - {ticketNumber}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadTicketDetails}
                disabled={loading}
                title={ticket ? "Refresh ticket details" : "Load ticket details from Freshdesk"}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {!ticket && !loading && <span className="ml-1">Load Details</span>}
              </Button>
              {ticket && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openInFreshdesk}
                  title="Open in Freshdesk"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Freshdesk
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading ticket details...</span>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && !ticket && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Hash className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Ticket #{ticketId}</h3>
                  <p className="text-blue-700 mb-4">Click "Load Details" to fetch ticket information from Freshdesk</p>
                  <Button
                    onClick={loadTicketDetails}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Details from Freshdesk
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {ticket && (
            <>
              {/* Header Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Ticket #{ticket.id}</span>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {getPriorityText(ticket.priority)}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusText(ticket.status)}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">{ticket.subject}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Requester:</span>
                        <span className="ml-2 font-medium">{ticket.requester_name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Agent:</span>
                        <span className="ml-2 font-medium">{ticket.responder_name || 'Unassigned'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Company:</span>
                        <span className="ml-2 font-medium">{ticket.company_name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Group:</span>
                        <span className="ml-2 font-medium">{ticket.group_name || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="ml-2 font-medium">{formatDate(ticket.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Updated:</span>
                        <span className="ml-2 font-medium">{formatDate(ticket.updated_at)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Due By:</span>
                        <span className="ml-2 font-medium">{formatDate(ticket.due_by)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">Type:</span>
                        <span className="ml-2 font-medium">{ticket.ticket_type || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: ticket.description || 'No description available' }}
                  />
                </CardContent>
              </Card>

              {/* Custom Fields */}
              {ticket.custom_fields && Object.keys(ticket.custom_fields).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(ticket.custom_fields).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium text-gray-700">{key}:</span>
                          <span className="text-sm text-gray-900">{value?.toString() || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {ticket.tags && ticket.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Tag className="h-4 w-4 mr-2" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {ticket.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}