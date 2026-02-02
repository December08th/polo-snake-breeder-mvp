import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Snake, PairingStatus } from '../types/database'
import type { PairingWithRelations } from './PairingCard'
import './PairingForm.css'

interface EditPairingFormProps {
  pairing: PairingWithRelations
  onSuccess: () => void
  onCancel: () => void
}

interface MaleEntry {
  id?: string // existing pairing_male id
  maleId: string
  lockCount: number
}

const STATUS_OPTIONS: { value: PairingStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OVULATED', label: 'Ovulated' },
  { value: 'LAID', label: 'Laid' },
  { value: 'COMPLETE', label: 'Complete' },
]

export function EditPairingForm({ pairing, onSuccess, onCancel }: EditPairingFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [females, setFemales] = useState<Snake[]>([])
  const [males, setMales] = useState<Snake[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [femaleId, setFemaleId] = useState(pairing.female_id)
  const [status, setStatus] = useState<PairingStatus>(pairing.status)
  const [ovulationDate, setOvulationDate] = useState(pairing.ovulation_date || '')
  const [plsDate, setPlsDate] = useState(pairing.pre_lay_shed_date || '')
  const [notes, setNotes] = useState(pairing.notes || '')

  // Males
  const [maleEntries, setMaleEntries] = useState<MaleEntry[]>(() => {
    if (pairing.pairing_males.length === 0) {
      return [{ maleId: '', lockCount: 0 }]
    }
    return pairing.pairing_males.map(pm => ({
      id: pm.id,
      maleId: pm.male_id,
      lockCount: pm.lock_count,
    }))
  })

  // Follicle checks
  const [follicleChecks, setFollicleChecks] = useState(
    [...pairing.follicle_checks].sort((a, b) =>
      new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
    )
  )
  const [newFollicleSize, setNewFollicleSize] = useState('')
  const [newFollicleDate, setNewFollicleDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [addingFollicle, setAddingFollicle] = useState(false)

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

  function getSnakeLabel(snake: Snake | Pick<Snake, 'id' | 'name' | 'breeder_id'>): string {
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

  function getAvailableMales(currentIndex: number): Snake[] {
    const selectedMaleIds = maleEntries
      .filter((_, i) => i !== currentIndex)
      .map(m => m.maleId)
    return males.filter(m => !selectedMaleIds.includes(m.id))
  }

  function calculateNextCheckDue(sizeMm: number): string {
    const today = new Date()
    let daysToAdd: number

    if (sizeMm < 20) {
      daysToAdd = 30 // monthly
    } else if (sizeMm <= 30) {
      daysToAdd = 14 // biweekly
    } else {
      daysToAdd = 7 // weekly
    }

    today.setDate(today.getDate() + daysToAdd)
    return today.toISOString().split('T')[0]
  }

  async function handleAddFollicle() {
    if (!newFollicleSize || !newFollicleDate) return

    setAddingFollicle(true)
    try {
      const sizeMm = parseInt(newFollicleSize)
      const nextCheckDue = calculateNextCheckDue(sizeMm)

      const { data, error } = await supabase
        .from('follicle_checks')
        .insert({
          user_id: pairing.user_id,
          pairing_id: pairing.id,
          checked_at: newFollicleDate,
          follicle_size_mm: sizeMm,
          next_check_due: nextCheckDue,
        })
        .select()
        .single()

      if (error) throw error

      setFollicleChecks([data, ...follicleChecks])
      setNewFollicleSize('')
      setNewFollicleDate(new Date().toISOString().split('T')[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add follicle check')
    } finally {
      setAddingFollicle(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Update the pairing
      const { error: pairingError } = await supabase
        .from('pairings')
        .update({
          female_id: femaleId,
          status,
          ovulation_date: ovulationDate || null,
          pre_lay_shed_date: plsDate || null,
          notes: notes || null,
        })
        .eq('id', pairing.id)

      if (pairingError) throw pairingError

      // Handle male entries changes
      const existingIds = pairing.pairing_males.map(pm => pm.id)
      const currentIds = maleEntries.filter(m => m.id).map(m => m.id!)

      // Delete removed males
      const toDelete = existingIds.filter(id => !currentIds.includes(id))
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('pairing_males')
          .delete()
          .in('id', toDelete)

        if (deleteError) throw deleteError
      }

      // Update existing males
      for (const entry of maleEntries) {
        if (entry.id && entry.maleId) {
          const { error: updateError } = await supabase
            .from('pairing_males')
            .update({
              male_id: entry.maleId,
              lock_count: entry.lockCount,
            })
            .eq('id', entry.id)

          if (updateError) throw updateError
        }
      }

      // Insert new males
      const newMales = maleEntries.filter(m => !m.id && m.maleId)
      if (newMales.length > 0) {
        const inserts = newMales.map(m => ({
          user_id: pairing.user_id,
          pairing_id: pairing.id,
          male_id: m.maleId,
          lock_count: m.lockCount,
        }))

        const { error: insertError } = await supabase
          .from('pairing_males')
          .insert(inserts)

        if (insertError) throw insertError
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pairing')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError(null)

    try {
      // Delete follicle checks first (cascade should handle but being explicit)
      await supabase
        .from('follicle_checks')
        .delete()
        .eq('pairing_id', pairing.id)

      // Delete pairing males
      await supabase
        .from('pairing_males')
        .delete()
        .eq('pairing_id', pairing.id)

      // Delete the pairing
      const { error } = await supabase
        .from('pairings')
        .delete()
        .eq('id', pairing.id)

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pairing')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="modal-overlay">
      <form className="pairing-form" onSubmit={handleSubmit}>
        <h2>Edit Pairing</h2>

        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="female">Female</label>
            <select
              id="female"
              value={femaleId}
              onChange={(e) => setFemaleId(e.target.value)}
              required
            >
              <option value="">Select female...</option>
              {females.map((female) => (
                <option key={female.id} value={female.id}>
                  {getSnakeLabel(female)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PairingStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="males-section">
          <h3>Males</h3>
          {maleEntries.map((entry, index) => (
            <div key={entry.id || `new-${index}`} className="male-entry">
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
                {/* Keep current selection visible even if filtered */}
                {entry.maleId && !getAvailableMales(index).find(m => m.id === entry.maleId) && (
                  <option value={entry.maleId}>
                    {pairing.pairing_males.find(pm => pm.male_id === entry.maleId)
                      ? getSnakeLabel(pairing.pairing_males.find(pm => pm.male_id === entry.maleId)!.male)
                      : 'Unknown'}
                  </option>
                )}
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ovulationDate">Ovulation Date</label>
            <input
              type="date"
              id="ovulationDate"
              value={ovulationDate}
              onChange={(e) => setOvulationDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="plsDate">Pre-Lay Shed (PLS)</label>
            <input
              type="date"
              id="plsDate"
              value={plsDate}
              onChange={(e) => setPlsDate(e.target.value)}
            />
          </div>
        </div>

        <div className="follicle-section">
          <h3>Follicle Checks</h3>
          {follicleChecks.length === 0 ? (
            <p className="no-follicles">No follicle checks recorded</p>
          ) : (
            <div className="follicle-list">
              {follicleChecks.map((fc) => (
                <div key={fc.id} className="follicle-entry">
                  <span className="follicle-info">{fc.follicle_size_mm}mm</span>
                  <span className="follicle-date">{formatDate(fc.checked_at)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="add-follicle-row">
            <div className="form-group">
              <label>Size (mm)</label>
              <input
                type="number"
                value={newFollicleSize}
                onChange={(e) => setNewFollicleSize(e.target.value)}
                min="1"
                placeholder="mm"
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={newFollicleDate}
                onChange={(e) => setNewFollicleDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-add-follicle"
              onClick={handleAddFollicle}
              disabled={addingFollicle || !newFollicleSize || !newFollicleDate}
            >
              {addingFollicle ? 'Adding...' : 'Add'}
            </button>
          </div>
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
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="delete-section">
          {!showDeleteConfirm ? (
            <button
              type="button"
              className="btn-delete"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              Delete Pairing
            </button>
          ) : (
            <div className="delete-confirm">
              <p>Are you sure? This cannot be undone.</p>
              <div className="delete-confirm-buttons">
                <button
                  type="button"
                  className="btn-cancel-small"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-delete-confirm"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
