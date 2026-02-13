import { useState } from 'react'
import { QuickWeightLog } from './QuickWeightLog'
import type { Snake, WeightLog } from '../types/database'
import type { LineageSummary } from '../lib/lineage'
import './SnakeCard.css'

interface SnakeCardProps {
  snake: Snake
  weightLogs?: WeightLog[]
  lineageSummary?: LineageSummary
  onClick: () => void
  onWeightUpdate: () => void
  onViewWeightHistory: () => void
  onViewLineage?: () => void
}

export function SnakeCard({ snake, weightLogs = [], lineageSummary, onClick, onWeightUpdate, onViewWeightHistory, onViewLineage }: SnakeCardProps) {
  const [showQuickLog, setShowQuickLog] = useState(false)

  // Display breeder_id if present, otherwise fall back to auto-generated snake_number
  const displayId = snake.breeder_id || `#${snake.snake_number}`

  // Get last 3 weights (sorted newest first)
  const sortedLogs = [...weightLogs]
    .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    .slice(0, 3)

  // Calculate weight change from previous log
  const previousLog = sortedLogs[1]
  const weightChange = previousLog && snake.weight_grams
    ? snake.weight_grams - previousLog.weight_grams
    : null

  function handleWeightClick(e: React.MouseEvent) {
    e.stopPropagation()
    setShowQuickLog(true)
  }

  function handleViewHistory(e: React.MouseEvent) {
    e.stopPropagation()
    onViewWeightHistory()
  }

  function handleQuickLogClose() {
    setShowQuickLog(false)
  }

  function handleQuickLogUpdate() {
    onWeightUpdate()
    setShowQuickLog(false)
  }

  function handleViewLineage(e: React.MouseEvent) {
    e.stopPropagation()
    onViewLineage?.()
  }

  return (
    <div className="snake-card" onClick={onClick}>
      <div className="snake-header">
        <span className="snake-number">{displayId}</span>
        {snake.name && <span className="snake-name">{snake.name}</span>}
      </div>
      <div className="snake-details">
        <p><strong>Sex:</strong> {snake.sex || '?'}</p>
        <p><strong>Morph:</strong> {snake.morph || 'Unknown'}</p>

        <div className="weight-section">
          <p>
            <strong>Weight:</strong>{' '}
            <span className="weight-value" onClick={handleWeightClick}>
              {snake.weight_grams ? `${snake.weight_grams}g` : '?'}
            </span>
          </p>

          {weightChange !== null && (
            <p className={`weight-change ${weightChange >= 0 ? 'positive' : 'negative'}`}>
              {weightChange >= 0 ? '+' : ''}{weightChange}g since last weigh
            </p>
          )}

          {sortedLogs.length > 1 && (
            <div className="recent-weights">
              <span className="recent-label">Recent:</span>
              {[...sortedLogs].reverse().map((log, i) => (
                <span key={log.id} className="recent-weight">
                  {log.weight_grams}g{i < sortedLogs.length - 1 && ' →'}
                </span>
              ))}
            </div>
          )}

          <button className="btn-view-history" onClick={handleViewHistory}>
            View History
          </button>

          {showQuickLog && (
            <QuickWeightLog
              snake={snake}
              onClose={handleQuickLogClose}
              onUpdate={handleQuickLogUpdate}
            />
          )}
        </div>

        {lineageSummary && (lineageSummary.hasParents || lineageSummary.offspringCount > 0) && (
          <div className="lineage-summary">
            {lineageSummary.hasParents && (
              <p className="lineage-parents-summary">
                Dam: {lineageSummary.damName}
                {lineageSummary.sireNames.length > 0 && ` | Sire: ${lineageSummary.sireNames.join(', ')}`}
                {lineageSummary.siblingCount > 0 && ` | ${lineageSummary.siblingCount} sibling${lineageSummary.siblingCount !== 1 ? 's' : ''}`}
              </p>
            )}
            {lineageSummary.offspringCount > 0 && (
              <p className="lineage-offspring-summary">
                {lineageSummary.offspringCount} offspring from {lineageSummary.offspringClutchCount} clutch{lineageSummary.offspringClutchCount !== 1 ? 'es' : ''}
              </p>
            )}
            <button className="btn-view-history" onClick={handleViewLineage}>
              View Lineage
            </button>
          </div>
        )}

        <p><strong>Status:</strong> {snake.status?.replace(/_/g, ' ') || 'Unknown'}</p>
        {snake.price && <p><strong>Price:</strong> ฿{snake.price.toLocaleString()}</p>}
      </div>
    </div>
  )
}
