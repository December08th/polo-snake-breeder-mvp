import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SnakeStatus, RackSize } from '../types/database'
import './AddSnakeForm.css'

interface AddSnakeFormProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AddSnakeForm({ userId, onSuccess, onCancel }: AddSnakeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    sex: '' as 'M' | 'F' | '',
    morph: '',
    genetics: '',
    date_of_birth: '',
    weight_grams: '',
    status: '' as SnakeStatus | '',
    rack_size: '' as RackSize | '',
    price: '',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from('snakes').insert({
        user_id: userId,
        name: formData.name || null,
        sex: formData.sex || null,
        morph: formData.morph || null,
        genetics: formData.genetics || null,
        date_of_birth: formData.date_of_birth || null,
        year: formData.date_of_birth ? new Date(formData.date_of_birth).getFullYear() : null,
        weight_grams: formData.weight_grams ? parseInt(formData.weight_grams) : null,
        status: formData.status || null,
        rack_size: formData.rack_size || null,
        price: formData.price ? parseInt(formData.price) : null,
        notes: formData.notes || null,
      })

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add snake')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <form className="add-snake-form" onSubmit={handleSubmit}>
        <h2>Add New Snake</h2>

        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sex">Sex *</label>
            <select id="sex" name="sex" value={formData.sex} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="morph">Morph *</label>
          <input
            type="text"
            id="morph"
            name="morph"
            value={formData.morph}
            onChange={handleChange}
            placeholder="e.g., Clown Het Pied"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="genetics">Genetics</label>
          <input
            type="text"
            id="genetics"
            name="genetics"
            value={formData.genetics}
            onChange={handleChange}
            placeholder="e.g., Het Albino Poss Het Tri-Stripe"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date_of_birth">Date of Birth</label>
            <input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="weight_grams">Weight (g)</label>
            <input
              type="number"
              id="weight_grams"
              name="weight_grams"
              value={formData.weight_grams}
              onChange={handleChange}
              placeholder="e.g., 2400"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="F_BREEDER">Female Breeder</option>
              <option value="M_BREEDER">Male Breeder</option>
              <option value="F_HOLDBACK">Female Holdback</option>
              <option value="M_HOLDBACK">Male Holdback</option>
              <option value="F_AVAILABLE">Female Available</option>
              <option value="M_AVAILABLE">Male Available</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rack_size">Rack Size</label>
            <select id="rack_size" name="rack_size" value={formData.rack_size} onChange={handleChange}>
              <option value="">Auto from weight</option>
              <option value="XL">XL (2000g+)</option>
              <option value="L">L (500-2000g)</option>
              <option value="S">S (&lt;500g)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="price">Price (฿)</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Leave empty if not for sale"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Snake'}
          </button>
        </div>
      </form>
    </div>
  )
}
