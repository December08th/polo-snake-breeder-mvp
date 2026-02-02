import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { WeightLog } from '../types/database'

interface WeightChartProps {
  logs: WeightLog[]
}

export function WeightChart({ logs }: WeightChartProps) {
  if (logs.length === 0) {
    return <div className="weight-chart-empty">No weight data yet</div>
  }

  // Sort chronologically for chart (oldest first)
  const chartData = [...logs]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map(log => ({
      date: new Date(log.recorded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      weight: log.weight_grams,
      fullDate: new Date(log.recorded_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }))

  return (
    <div className="weight-chart">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
          />
          <YAxis
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#333' }}
            tickFormatter={(value) => `${value}g`}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#e0e0e0',
            }}
            formatter={(value) => [`${value}g`, 'Weight']}
            labelFormatter={(_, payload) => (payload && payload[0]?.payload?.fullDate) || ''}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ fill: '#4ade80', strokeWidth: 0, r: 4 }}
            activeDot={{ fill: '#22c55e', strokeWidth: 0, r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
