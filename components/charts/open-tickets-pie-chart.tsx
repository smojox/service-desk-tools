"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface OpenTicketsPieChartProps {
  data: Array<{ type: string; count: number }>
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: { type: string; count: number }
  }>
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const total = payload[0].payload.total || 0
    const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : '0.0'
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-1">{data.type}</p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Count:</span> {data.count} tickets
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-medium">Percentage:</span> {percentage}%
        </p>
      </div>
    )
  }
  return null
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null // Don't show label if slice is too small
  
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// Color palette for different ticket types
const COLORS = [
  '#0d9488', // Teal
  '#059669', // Emerald  
  '#dc2626', // Red
  '#ea580c', // Orange
  '#7c2d12', // Orange-800
  '#374151', // Gray-700
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
]

export function OpenTicketsPieChart({ data }: OpenTicketsPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>No open tickets found</p>
      </div>
    )
  }

  const total = data.reduce((sum, item) => sum + item.count, 0)
  
  // Add total to each data item for percentage calculation in tooltip
  const dataWithTotal = data.map(item => ({ ...item, total }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
            nameKey="type"
          >
            {dataWithTotal.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ fontSize: '12px', color: '#6b7280' }}
            formatter={(value, entry) => (
              <span style={{ color: entry.color }}>
                {value} ({entry.payload?.count || 0})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}