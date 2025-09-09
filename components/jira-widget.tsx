"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ExternalLink, User, AlertCircle, TestTube } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import type { JiraTicket } from '@/lib/jira-client';

interface JiraStats {
  total: number;
  byStatus: Record<string, number>;
  byAssignee: Record<string, number>;
  byPriority: Record<string, number>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'highest':
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'lowest':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'to do':
    case 'open':
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'in progress':
    case 'in review':
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

export default function JiraWidget() {
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [stats, setStats] = useState<JiraStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        fetch('/api/jira/tickets'),
        fetch('/api/jira/stats')
      ]);

      if (!ticketsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch JIRA data');
      }

      const ticketsData = await ticketsRes.json();
      const statsData = await statsRes.json();

      if (ticketsData.success && statsData.success) {
        setTickets(ticketsData.data);
        setStats(statsData.data);
        setError(null);
      } else {
        throw new Error(ticketsData.error || statsData.error || 'Unknown error');
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
      const response = await fetch('/api/jira/test');
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ JIRA Connection Successful!\nConnected as: ${result.user}\nJIRA URL: ${result.jiraUrl}\nProject: ${result.projectKey}`);
      } else {
        alert(`❌ JIRA Connection Failed!\n${result.error}\n\nDetails: ${result.details || 'No additional details'}`);
      }
    } catch (err) {
      alert(`❌ Connection Test Failed!\n${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatChartData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value]) => ({ name, value }));
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
                <Skeleton key={i} className="h-16 w-full" />
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
            JIRA Integration Error
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
              Test Connection
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
            Support Assists - Outstanding Tickets
            <Badge variant="secondary">{stats?.total || 0}</Badge>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts Section */}
        <div className="space-y-6">
          {/* Status Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={formatChartData(stats.byStatus)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatChartData(stats.byStatus).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Assignee Distribution */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignee Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={formatChartData(stats.byAssignee)}>
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tickets List Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Outstanding Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {tickets.slice(0, 20).map((ticket) => (
                <div 
                  key={ticket.key}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://taranto.atlassian.net/browse/${ticket.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                      >
                        {ticket.key}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <Badge 
                        className={getPriorityColor(ticket.fields.priority.name)}
                        variant="secondary"
                      >
                        {ticket.fields.priority.name}
                      </Badge>
                    </div>
                    <Badge 
                      className={getStatusColor(ticket.fields.status.name)}
                      variant="secondary"
                    >
                      {ticket.fields.status.name}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                    {ticket.fields.summary}
                  </h4>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ticket.fields.assignee?.displayName || 'Unassigned'}
                    </div>
                    <div>
                      Created: {new Date(ticket.fields.created).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {tickets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No outstanding tickets found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}