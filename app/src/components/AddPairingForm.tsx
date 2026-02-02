import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Snake } from '../types/database'
import './PairingForm.css'

interface AddPairingFormProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

interface MaleEntry {
  maleId: string
  lockCount: number
}

export function AddPairingForm({ userId, onSuccess, onCancel }: AddPairingFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [females, setFemales] = useState<Snake[]>([])
  const [males, setMales] = useState<Snake[]>([])

  const [femaleId, setFemaleId] = useState('')
  const [maleEntries, setMaleEntries] = useState<MaleEntry[]>([{ maleId: '', lockCount: 0 }])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchSnakes()
  }, [])

  async function fetchSnakes() {
    try {
      const { data, error } = await supabase
        .from('snakes')
        .select('id, name, breeder_id, sex, status')
        .in('status', ['F_BREEDER', 'M_BREEDER'])
        .order('name', { ascending: true })

      if (error) throw error

      const snakeData = data || []
      setFemales(snakeData.filter(s => s.status === 'F_BREEDER') as Snake[])
      setMales(snakeData.filter(s => s.status === 'M_BREEDER') as Snake[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch snakes')
    }
  }

  function getSnakeLabel(snake: Snake): string {
    if (snake.name && snake.breeder_id) {
      return `${snake.name} (${snake.breeder_id})`
    }
    return snake.name || snake.breeder_id || 'Unknown'
  }

  function addMaleEntry() {
    setMaleEntries([...maleEntries, { maleId: '', lockCount: 0 }])
  }

  function removeMaleEntry(index: number) {
    if (maleEntries.length > 1) {
      setMaleEntries(maleEntries.filter((_, i) => i !== index))
    }
  }

  function updateMaleEntry(index: number, field: 'maleId' | 'lockCount', value: string | number) {
    const updated = [...maleEntries]
    updated[index] = { ...updated[index], [field]: value }
    setMaleEntries(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create the pairing
      const { data: pairing, error: pairingError } = await supabase
        .from('pairings')
        .insert({
          user_id: userId,
          female_id: femaleId,
          status: 'ACTIVE',
          notes: notes || null,
        })
        .select()
        .single()

      if (pairingError) throw pairingError

      // Add male entries (filter out empty selections)
      const validMales = maleEntries.filter(m => m.maleId)
      if (validMales.length > 0) {
        const maleInserts = validMales.map(m => ({
          user_id: userId,
          pairing_id: pairing.id,
          male_id: m.maleId,
          lock_count: m.lockCount,
        }))

        const { error: malesError } = await supabase
          .from('pairing_males')
          .insert(maleInserts)

        if (malesError) throw malesError
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pairing')
    } finally {
      setLoading(false)
    }
  }

  // Get males that haven't been selected yet
  function getAvailableMales(currentIndex: number): Snake[] {
    const selectedMaleIds = maleEntries
      .filter((_, i) => i !== currentIndex)
      .map(m => m.maleId)
    return males.filter(m => !selectedMaleIds.includes(m.id))
  }

  return (
    <div className="modal-overlay">
      <form className="pairing-form" onSubmit={handleSubmit}>
        <h2>Add New Pairing</h2>

        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="female">Female *</label>
          <select
            id="female"
            value={femaleId}
            onChange={(e) => setFemaleId(e.target.value)}
            required
          >
            <option value="">Select female breeder...</option>
            {females.map((female) => (
              <option key={female.id} value={female.id}>
                {getSnakeLabel(female)}
              </option>
            ))}
          </select>
        </div>

        <div className="males-section">
          <h3>Males</h3>
          {maleEntries.map((entry, index) => (
            <div key={index} className="male-entry">
              <select
                value={entry.maleId}
                onChange={(e) => updateMaleEntry(index, 'maleId', e.target.value)}
              >
                <option value="">Select male...</option>
                {getAvailableMales(index).map((male) => (
                  <option key={male.id} value={male.id}>
                    {getSnakeLabel(male)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={entry.lockCount}
                onChange={(e) => updateMaleEntry(index, 'lockCount', parseInt(e.target.value) || 0)}
                min="0"
                placeholder="Locks"
                title="Lock count"
              />
              {maleEntries.length > 1 && (
                <button
                  type="button"
                  className="btn-remove-male"
                  onClick={() => removeMaleEntry(index)}
                  title="Remove male"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn-add-male"
            onClick={addMaleEntry}
            disabled={maleEntries.length >= males.length}
          >
            + Add Another Male
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes about this pairing..."
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading || !femaleId}>
            {loading ? 'Adding...' : 'Add Pairing'}
          </button>
        </div>
      </form>
    </div>
  )
}
