import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Clutch, Snake } from '../types/database'
import './ClutchForm.css'

interface EditClutchFormProps {
  clutch: Clutch
  onSuccess: () => void
  onCancel: () => void
}

export function EditClutchForm({ clutch, onSuccess, onCancel }: EditClutchFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [babies, setBabies] = useState<Snake[]>([])
  const [loadingBabies, setLoadingBabies] = useState(false)
  const [babiesExpanded, setBabiesExpanded] = useState(true)

  const [formData, setFormData] = useState({
    clutch_number: clutch.clutch_number,
    lay_date: clutch.lay_date || '',
    egg_count: clutch.egg_count.toString(),
    fertile_count: clutch.fertile_count.toString(),
    slug_count: clutch.slug_count.toString(),
    kink_count: clutch.kink_count.toString(),
    actual_hatch_date: clutch.actual_hatch_date || '',
    hatch_count: clutch.hatch_count.toString(),
    remarks: clutch.remarks || '',
  })

  useEffect(() => {
    async function fetchBabies() {
      if (!clutch.actual_hatch_date) return
      setLoadingBabies(true)
      const { data } = await supabase
        .from('snakes')
        .select('*')
        .eq('clutch_id', clutch.id)
        .order('clutch_letter', { ascending: true })
      setBabies(data || [])
      setLoadingBabies(false)
    }
    fetchBabies()
  }, [clutch.id, clutch.actual_hatch_date])

  async function initializeBabies() {
    const count = parseInt(formData.hatch_count) || 0
    if (count === 0) return

    setLoadingBabies(true)
    const newBabies: Snake[] = []

    for (let i = 0; i < count; i++) {
      const letter = String.fromCharCode(65 + babies.length + i)
      const hatchDate = formData.actual_hatch_date || clutch.actual_hatch_date
      const { data } = await supabase.from('snakes').insert({
        user_id: clutch.user_id,
        clutch_id: clutch.id,
        clutch_letter: letter,
        date_of_birth: hatchDate,
        year: hatchDate ? new Date(hatchDate).getFullYear() : null,
        breeder_id: `${formData.clutch_number}-${letter}`,
      }).select().single()

      if (data) newBabies.push(data)
    }

    setBabies(prev => [...prev, ...newBabies])
    setLoadingBabies(false)
  }

  async function handleBabyChange(babyId: string, field: string, value: string) {
    setBabies(prev => prev.map(b =>
      b.id === babyId ? { ...b, [field]: value || null } : b
    ))

    await supabase.from('snakes').update({ [field]: value || null }).eq('id', babyId)
  }

  async function handleDeleteBaby(babyId: string) {
    setBabies(prev => prev.filter(b => b.id !== babyId))
    await supabase.from('snakes').delete().eq('id', babyId)
  }

  async function addSingleBaby() {
    const letter = String.fromCharCode(65 + babies.length)
    const hatchDate = formData.actual_hatch_date || clutch.actual_hatch_date
    const { data } = await supabase.from('snakes').insert({
      user_id: clutch.user_id,
      clutch_id: clutch.id,
      clutch_letter: letter,
      date_of_birth: hatchDate,
      year: hatchDate ? new Date(hatchDate).getFullYear() : null,
      breeder_id: `${formData.clutch_number}-${letter}`,
    }).select().single()

    if (data) setBabies(prev => [...prev, data])
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('clutches')
        .update({
          clutch_number: formData.clutch_number,
          lay_date: formData.lay_date || null,
          egg_count: formData.egg_count ? parseInt(formData.egg_count) : 0,
          fertile_count: formData.fertile_count ? parseInt(formData.fertile_count) : 0,
          slug_count: formData.slug_count ? parseInt(formData.slug_count) : 0,
          kink_count: formData.kink_count ? parseInt(formData.kink_count) : 0,
          actual_hatch_date: formData.actual_hatch_date || null,
          hatch_count: formData.hatch_count ? parseInt(formData.hatch_count) : 0,
          remarks: formData.remarks || null,
        })
        .eq('id', clutch.id)

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update clutch')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('clutches')
        .delete()
        .eq('id', clutch.id)

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete clutch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <form className="clutch-form" onSubmit={handleSubmit}>
        <h2>Edit Clutch</h2>

        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="clutch_number">Clutch Number *</label>
            <input
              type="text"
              id="clutch_number"
              name="clutch_number"
              value={formData.clutch_number}
              onChange={handleChange}
              placeholder="e.g., C14-25"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lay_date">Lay Date</label>
            <input
              type="date"
              id="lay_date"
              name="lay_date"
              value={formData.lay_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row form-row-4">
          <div className="form-group">
            <label htmlFor="egg_count">Total Eggs</label>
            <input
              type="number"
              id="egg_count"
              name="egg_count"
              value={formData.egg_count}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fertile_count">Fertile</label>
            <input
              type="number"
              id="fertile_count"
              name="fertile_count"
              value={formData.fertile_count}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="slug_count">Slugs</label>
            <input
              type="number"
              id="slug_count"
              name="slug_count"
              value={formData.slug_count}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="kink_count">Kinked</label>
            <input
              type="number"
              id="kink_count"
              name="kink_count"
              value={formData.kink_count}
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="actual_hatch_date">Actual Hatch Date</label>
            <input
              type="date"
              id="actual_hatch_date"
              name="actual_hatch_date"
              value={formData.actual_hatch_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hatch_count">Hatch Count</label>
            <input
              type="number"
              id="hatch_count"
              name="hatch_count"
              value={formData.hatch_count}
              onChange={handleChange}
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="remarks">Remarks</label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows={3}
            placeholder="e.g., badly kinked/euthanized x1"
          />
        </div>

        {(clutch.actual_hatch_date || formData.actual_hatch_date) && (
          <div className="babies-section">
            <div className="babies-header" onClick={() => setBabiesExpanded(!babiesExpanded)}>
              <h3>Hatchlings ({babies.length})</h3>
              <span className="expand-icon">{babiesExpanded ? '▼' : '▶'}</span>
            </div>

            {babiesExpanded && (
              <>
                {loadingBabies ? (
                  <p className="babies-loading">Loading...</p>
                ) : babies.length === 0 ? (
                  <button type="button" className="btn-init-babies" onClick={initializeBabies}>
                    Create {formData.hatch_count || 0} baby slots
                  </button>
                ) : (
                  <>
                    {babies.map((baby) => (
                      <div key={baby.id} className="baby-row">
                        <span className="baby-letter">{baby.clutch_letter}</span>
                        <select
                          value={baby.sex || ''}
                          onChange={(e) => handleBabyChange(baby.id, 'sex', e.target.value)}
                        >
                          <option value="">?</option>
                          <option value="M">M</option>
                          <option value="F">F</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Morph"
                          value={baby.morph || ''}
                          onChange={(e) => handleBabyChange(baby.id, 'morph', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="Genetics"
                          value={baby.genetics || ''}
                          onChange={(e) => handleBabyChange(baby.id, 'genetics', e.target.value)}
                        />
                        <button type="button" className="baby-delete-btn" onClick={() => handleDeleteBaby(baby.id)}>
                          ×
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn-add-baby" onClick={addSingleBaby}>
                      + Add Baby
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {clutch.expected_hatch_date && (
          <p className="form-hint">Expected hatch: {new Date(clutch.expected_hatch_date).toLocaleDateString()}</p>
        )}

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
              Delete Clutch
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
