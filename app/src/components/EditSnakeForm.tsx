import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Snake, SnakeStatus, RackSize } from '../types/database'
import { getHiddenStatuses } from './StatusSettingsModal'
import './EditSnakeForm.css'

const ALL_STATUSES: { value: SnakeStatus; label: string }[] = [
  { value: 'F_BREEDER', label: 'Female Breeder' },
  { value: 'M_BREEDER', label: 'Male Breeder' },
  { value: 'F_HOLDBACK', label: 'Female Holdback' },
  { value: 'M_HOLDBACK', label: 'Male Holdback' },
  { value: 'F_AVAILABLE', label: 'Female Available' },
  { value: 'M_AVAILABLE', label: 'Male Available' },
  { value: 'ON_HOLD', label: 'On Hold' },
]

interface EditSnakeFormProps {
  snake: Snake
  onSuccess: () => void
  onCancel: () => void
}

export function EditSnakeForm({ snake, onSuccess, onCancel }: EditSnakeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    breeder_id: snake.breeder_id || '',
    name: snake.name || '',
    sex: (snake.sex || '') as 'M' | 'F' | '',
    morph: snake.morph || '',
    genetics: snake.genetics || '',
    date_of_birth: snake.date_of_birth || '',
    weight_grams: snake.weight_grams?.toString() || '',
    status: (snake.status || '') as SnakeStatus | '',
    rack_size: (snake.rack_size || '') as RackSize | '',
    price: snake.price?.toString() || '',
    notes: snake.notes || '',
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
      const { error } = await supabase
        .from('snakes')
        .update({
          breeder_id: formData.breeder_id || null,
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
        .eq('id', snake.id)

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update snake')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('snakes')
        .delete()
        .eq('id', snake.id)

      if (error) throw error
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete snake')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <form className="edit-snake-form" onSubmit={handleSubmit}>
        <h2>Edit Snake {snake.breeder_id || `#${snake.snake_number}`}</h2>

        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="breeder_id">Breeder ID</label>
            <input
              type="text"
              id="breeder_id"
              name="breeder_id"
              value={formData.breeder_id}
              onChange={handleChange}
              placeholder="e.g., #9 or C5-23-A"
            />
          </div>

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
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="sex">Sex *</label>
            <select id="sex" name="sex" value={formData.sex} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
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
              {ALL_STATUSES
                .filter(({ value }) => {
                  const hidden = getHiddenStatuses()
                  // Always show the snake's current status, even if hidden
                  return !hidden.includes(value) || value === snake.status
                })
                .map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
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

        {showDeleteConfirm ? (
          <div className="delete-confirm">
            <p>Are you sure you want to delete this snake? This cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button
                type="button"
                className="btn-cancel"
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
        ) : (
          <div className="form-actions">
            <button
              type="button"
              className="btn-delete"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
            >
              Delete
            </button>
            <button type="button" className="btn-cancel" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
