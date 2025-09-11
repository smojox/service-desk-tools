"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ExternalLink, User, AlertCircle, TestTube, Code } from 'lucide-react';

interface FreshdeskTicket {
  id: number;
  subject: string;
  status: number;
  priority: number;
  created_at: string;
  updated_at: string;
  requester_name: string;
  responder_name: string;
  custom_fields: { [key: string]: any };
}

interface JiraTicketInfo {
  key: string;
  status: string;
  fixVersion: string | null;
  summary: string;
}

interface SupportDevItem {
  freshdeskTicket: FreshdeskTicket;
  jiraInfo: JiraTicketInfo | null;
  error?: string;
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1:
      return 'bg-gray-100 text-gray-800';
    case 2:
      return 'bg-green-100 text-green-800';
    case 3:
      return 'bg-yellow-100 text-yellow-800';
    case 4:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const getPriorityLabel = (priority: number) => {
  switch (priority) {
    case 1:
      return 'Low';
    case 2:
      return 'Medium';
    case 3:
      return 'High';
    case 4:
      return 'Urgent';
    default:
      return 'Unknown';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'to do':
    case 'open':
    case 'new':
    case 'backlog':
      return 'bg-blue-100 text-blue-800';
    case 'in progress':
    case 'in review':
    case 'code review':
      return 'bg-yellow-100 text-yellow-800';
    case 'done':
    case 'closed':
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function SupportDevItemsWidget() {
  const [items, setItems] = useState<SupportDevItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/support-dev-items');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch support dev items: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setItems(data.data);
        setError(null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const testConnection = async () => {
    try {
      const [freshdeskRes, jiraRes] = await Promise.all([
        fetch('/api/freshdesk/test'),
        fetch('/api/jira/test')
      ]);
      
      const freshdeskResult = await freshdeskRes.json();
      const jiraResult = await jiraRes.json();
      
      const messages = [];
      
      if (freshdeskResult.success) {
        messages.push(`✅ Freshdesk: Connected to ${freshdeskResult.domain}`);
      } else {
        messages.push(`❌ Freshdesk: ${freshdeskResult.error}`);
      }
      
      if (jiraResult.success) {
        messages.push(`✅ JIRA: Connected as ${jiraResult.user}`);
      } else {
        messages.push(`❌ JIRA: ${jiraResult.error}`);
      }
      
      alert(messages.join('\n\n'));
    } catch (err) {
      alert(`❌ Connection Test Failed!\n${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Support Dev Items Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            <Button onClick={testConnection} variant="outline">
              <TestTube className="h-4 w-4 mr-2" />
              Test Connections
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Support Dev Items
            <Badge variant="secondary">{items.length}</Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tickets "With Development"</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[800px] overflow-y-auto">
            {items.map((item) => (
              <div 
                key={item.freshdeskTicket.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Freshdesk Ticket Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      FD-{item.freshdeskTicket.id}
                    </span>
                    <Badge 
                      className={getPriorityColor(item.freshdeskTicket.priority)}
                      variant="secondary"
                    >
                      {getPriorityLabel(item.freshdeskTicket.priority)}
                    </Badge>
                  </div>
                </div>
                
                <h4 className="font-medium text-sm mb-3 line-clamp-2">
                  {item.freshdeskTicket.subject}
                </h4>
                
                {/* JIRA Information */}
                {item.jiraInfo ? (
                  <div className="bg-gray-50 rounded p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          {item.jiraInfo.key}
                        </span>
                        <Badge 
                          className={getStatusColor(item.jiraInfo.status)}
                          variant="secondary"
                        >
                          {item.jiraInfo.status}
                        </Badge>
                      </div>
                      {item.jiraInfo.fixVersion && (
                        <Badge variant="outline">
                          Fix: {item.jiraInfo.fixVersion}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.jiraInfo.summary}</p>
                  </div>
                ) : item.error ? (
                  <div className="bg-red-50 rounded p-3 mb-3">
                    <p className="text-sm text-red-600">
                      {item.error}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-50 rounded p-3 mb-3">
                    <p className="text-sm text-yellow-600">
                      No JIRA reference found in this ticket
                    </p>
                  </div>
                )}
                
                {/* Freshdesk Ticket Details */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {item.freshdeskTicket.requester_name || 'Unknown'}
                    </div>
                    {item.freshdeskTicket.responder_name && (
                      <div className="flex items-center gap-1">
                        Assigned: {item.freshdeskTicket.responder_name}
                      </div>
                    )}
                  </div>
                  <div>
                    Created: {new Date(item.freshdeskTicket.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tickets "With Development" found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}