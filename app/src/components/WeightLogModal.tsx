import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { WeightChart } from './WeightChart'
import type { Snake, WeightLog } from '../types/database'
import './WeightLogModal.css'

interface WeightLogModalProps {
  snake: Snake
  logs: WeightLog[]
  onClose: () => void
  onUpdate: () => void
}

export function WeightLogModal({ snake, logs, onClose, onUpdate }: WeightLogModalProps) {
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayId = snake.breeder_id || `#${snake.snake_number}`

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault()
    if (!weight) return

    setLoading(true)
    setError(null)

    try {
      const weightGrams = parseInt(weight)

      // Insert weight log
      const { error: logError } = await supabase.from('weight_logs').insert({
        user_id: snake.user_id,
        snake_id: snake.id,
        weight_grams: weightGrams,
        recorded_at: date,
        notes: notes || null,
      })

      if (logError) throw logError

      // Update snake's current weight
      const { error: snakeError } = await supabase
        .from('snakes')
        .update({ weight_grams: weightGrams })
        .eq('id', snake.id)

      if (snakeError) throw snakeError

      // Reset form and refresh
      setWeight('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add weight')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteLog(logId: string) {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from('weight_logs').delete().eq('id', logId)
      if (error) throw error
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete log')
    } finally {
      setLoading(false)
    }
  }

  // Sort logs by date descending (newest first) for the list
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  )

  // Calculate weight changes
  const logsWithChanges = sortedLogs.map((log, index) => {
    const olderLog = sortedLogs[index + 1]
    const change = olderLog ? log.weight_grams - olderLog.weight_grams : null
    return { ...log, change }
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="weight-log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="weight-log-header">
          <h2>Weight History - {snake.name || displayId}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <WeightChart logs={logs} />

        <form className="weight-add-form" onSubmit={handleAddWeight}>
          <h3>Add New Weight</h3>
          <div className="weight-add-row">
            <div className="form-group">
              <label htmlFor="weight">Weight (g)</label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 1850"
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (optional)</label>
            <input
              type="text"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Post-shed weight"
            />
          </div>
          <button type="submit" className="btn-add-weight" disabled={loading || !weight}>
            {loading ? 'Adding...' : '+ Add Weight'}
          </button>
        </form>

        <div className="weight-log-list">
          <h3>History</h3>
          {logsWithChanges.length === 0 ? (
            <p className="empty-logs">No weight records yet</p>
          ) : (
            <div className="log-entries">
              {logsWithChanges.map((log) => (
                <div key={log.id} className="log-entry">
                  <div className="log-date">
                    {new Date(log.recorded_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="log-weight">{log.weight_grams}g</div>
                  <div className={`log-change ${log.change === null ? '' : log.change >= 0 ? 'positive' : 'negative'}`}>
                    {log.change !== null && (
                      <>
                        {log.change >= 0 ? '+' : ''}
                        {log.change}g
                      </>
                    )}
                  </div>
                  {log.notes && <div className="log-notes">{log.notes}</div>}
                  <button
                    className="btn-delete-log"
                    onClick={() => handleDeleteLog(log.id)}
                    disabled={loading}
                    title="Delete this entry"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
