import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './ClutchForm.css'

interface AddClutchFormProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AddClutchForm({ userId, onSuccess, onCancel }: AddClutchFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    clutch_number: '',
    lay_date: '',
    egg_count: '',
    fertile_count: '',
    slug_count: '',
    kink_count: '',
    remarks: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from('clutches').insert({
        user_id: userId,
        clutch_number: formData.clutch_number,
        lay_date: formData.lay_date || null,
        egg_count: formData.egg_count ? parseInt(formData.egg_count) : 0,
        fertile_count: formData.fertile_count ? parseInt(formData.fertile_count) : 0,
        slug_count: formData.slug_count ? parseInt(formData.slug_count) : 0,
        kink_count: formData.kink_count ? parseInt(formData.kink_count) : 0,
        remarks: formData.remarks || null,
      })

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add clutch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <form className="clutch-form" onSubmit={handleSubmit}>
        <h2>Add New Clutch</h2>

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
            <label htmlFor="lay_date">Lay Date *</label>
            <input
              type="date"
              id="lay_date"
              name="lay_date"
              value={formData.lay_date}
              onChange={handleChange}
              required
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
              placeholder="0"
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
              placeholder="0"
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
              placeholder="0"
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
              placeholder="0"
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

        <p className="form-hint">Expected hatch date will be calculated automatically (lay date + 57 days)</p>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Clutch'}
          </button>
        </div>
      </form>
    </div>
  )
}
