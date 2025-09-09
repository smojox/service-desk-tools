"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, MessageCircle, Clock, User, Building, Ticket, ExternalLink, Loader2 } from "lucide-react"
import { PriorityTrackerItem } from "@/lib/models/PriorityTracker"

interface PriorityTrackerModalProps {
  item: PriorityTrackerItem | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function PriorityTrackerModal({ item, isOpen, onClose, onUpdate }: PriorityTrackerModalProps) {
  const { data: session } = useSession()
  const [comment, setComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  const handleStatusUpdate = async (itemId: string, newStatus: 'Open' | 'Closed' | 'On Hold') => {
    try {
      const response = await fetch(`/api/priority-tracker/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !comment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/priority-tracker/${item._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: comment })
      })

      if (response.ok) {
        setComment("")
        onUpdate()
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

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {item.ref}
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
                <p className="mt-1">{item.summary}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Company</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building className="h-4 w-4" />
                  {item.companyName}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <div className="mt-1">
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
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Assigned To</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  {item.assignedToName}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(item.createdAt)} by {item.createdByName}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(item.updatedAt)}
                </div>
              </div>
            </div>
          </div>
          
          {(item.linkedFreshdeskTickets.length > 0 || item.linkedJiraTickets.length > 0) && (
            <div>
              <Label className="text-sm font-medium text-gray-500 mb-2 block">Linked Tickets</Label>
              <div className="flex flex-wrap gap-2">
                {item.linkedFreshdeskTickets.map((ticket) => (
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
                {item.linkedJiraTickets.map((ticket) => (
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
              <Label className="text-sm font-medium">Comments ({item.comments.length})</Label>
            </div>
            
            <ScrollArea className="h-64 mb-4">
              <div className="space-y-4">
                {item.comments.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No comments yet</p>
                ) : (
                  item.comments.map((comment) => (
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
      </DialogContent>
    </Dialog>
  )
}