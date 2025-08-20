"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthlyTicketsChartProps {
  data: Array<{ month: string; created: number; resolved: number }>
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey: string
    value: number
    color: string
    name: string
  }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const monthYear = label ? new Date(label + '-01').toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    }) : ''
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{monthYear}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {entry.value} tickets
          </p>
        ))}
        {payload.length === 2 && (
          <p className="text-sm text-gray-600 mt-1 pt-1 border-t">
            <span className="font-medium">Net Change:</span> {payload[1].value - payload[0].value} tickets
          </p>
        )}
      </div>
    )
  }
  return null
}

export function MonthlyTicketsChart({ data }: MonthlyTicketsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No data available for monthly ticket trends</p>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => {
              const date = new Date(value + '-01')
              return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            }}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px', color: '#6b7280' }}
          />
          <Line 
            type="monotone" 
            dataKey="created" 
            stroke="#0d9488" 
            strokeWidth={3}
            name="Created Tickets"
            dot={{ fill: '#0d9488', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0d9488', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="resolved" 
            stroke="#059669" 
            strokeWidth={3}
            name="Resolved Tickets"
            dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}