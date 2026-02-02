import { useState, useEffect } from 'react'
import type { SnakeStatus } from '../types/database'
import './StatusSettingsModal.css'

const STORAGE_KEY = 'pythrone_hidden_statuses'

const ALL_STATUSES: { status: SnakeStatus; label: string }[] = [
  { status: 'F_BREEDER', label: 'Female Breeders' },
  { status: 'M_BREEDER', label: 'Male Breeders' },
  { status: 'F_HOLDBACK', label: 'Female Holdbacks' },
  { status: 'M_HOLDBACK', label: 'Male Holdbacks' },
  { status: 'F_AVAILABLE', label: 'Females Available' },
  { status: 'M_AVAILABLE', label: 'Males Available' },
  { status: 'ON_HOLD', label: 'On Hold' },
]

interface StatusSettingsModalProps {
  onClose: () => void
}

export function getHiddenStatuses(): SnakeStatus[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function StatusSettingsModal({ onClose }: StatusSettingsModalProps) {
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<SnakeStatus>>(new Set())

  useEffect(() => {
    const stored = getHiddenStatuses()
    setHiddenStatuses(new Set(stored))
  }, [])

  function handleToggle(status: SnakeStatus) {
    setHiddenStatuses(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="status-settings-modal" onClick={e => e.stopPropagation()}>
        <h2>Visible Statuses</h2>
        <p className="settings-hint">Unchecked statuses won't appear in the collection or forms.</p>

        <div className="status-checkboxes">
          {ALL_STATUSES.map(({ status, label }) => (
            <label key={status} className="status-checkbox">
              <input
                type="checkbox"
                checked={!hiddenStatuses.has(status)}
                onChange={() => handleToggle(status)}
              />
              <span className="checkbox-label">{label}</span>
            </label>
          ))}
        </div>

        <div className="settings-actions">
          <button className="btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
