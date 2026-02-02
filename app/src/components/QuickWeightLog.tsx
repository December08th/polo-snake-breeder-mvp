import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Snake } from '../types/database'
import './WeightLogModal.css'

interface QuickWeightLogProps {
  snake: Snake
  onClose: () => void
  onUpdate: () => void
}

export function QuickWeightLog({ snake, onClose, onUpdate }: QuickWeightLogProps) {
  const [weight, setWeight] = useState(snake.weight_grams?.toString() || '')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weight) return

    setLoading(true)

    try {
      const weightGrams = parseInt(weight)

      // Insert weight log
      const { error: logError } = await supabase.from('weight_logs').insert({
        user_id: snake.user_id,
        snake_id: snake.id,
        weight_grams: weightGrams,
        recorded_at: new Date().toISOString().split('T')[0],
        notes: null,
      })

      if (logError) throw logError

      // Update snake's current weight
      const { error: snakeError } = await supabase
        .from('snakes')
        .update({ weight_grams: weightGrams })
        .eq('id', snake.id)

      if (snakeError) throw snakeError

      onUpdate()
      onClose()
    } catch (err) {
      console.error('Failed to log weight:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <div className="quick-weight-popup" onClick={(e) => e.stopPropagation()}>
      <form className="quick-weight-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="quick-weight-input">
          <input
            ref={inputRef}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight"
            min="1"
          />
          <span>g</span>
        </div>
        <div className="quick-weight-actions">
          <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-save" disabled={loading || !weight}>
            {loading ? '...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
