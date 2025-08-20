"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TicketAgeBreakdownData {
  month: string
  incidents: number
  serviceRequests: number
  problems: number
  other: number
}

interface TicketAgeBreakdownChartProps {
  data: TicketAgeBreakdownData[]
}

export function TicketAgeBreakdownChart({ data }: TicketAgeBreakdownChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="incidents" stackId="a" fill="#ef4444" name="Incidents" />
          <Bar dataKey="serviceRequests" stackId="a" fill="#3b82f6" name="Service Requests" />
          <Bar dataKey="problems" stackId="a" fill="#f59e0b" name="Problems" />
          <Bar dataKey="other" stackId="a" fill="#6b7280" name="Other" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}