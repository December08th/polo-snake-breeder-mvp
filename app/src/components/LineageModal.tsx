import { useState, useEffect } from 'react'
import { fetchLineage } from '../lib/lineage'
import type { LineageData, LineageParent, LineageSibling } from '../lib/lineage'
import type { Snake } from '../types/database'
import './LineageModal.css'

interface LineageModalProps {
  snake: Snake
  onClose: () => void
  onNavigateToSnake: (snakeId: string) => void
}

function formatLabel(entry: { name: string | null; breeder_id: string | null }): string {
  if (entry.name && entry.breeder_id) return `${entry.name} (${entry.breeder_id})`
  return entry.name || entry.breeder_id || 'Unknown'
}

function SnakeEntry({ entry, label, onClick }: {
  entry: LineageParent | LineageSibling
  label?: string
  onClick: (id: string) => void
}) {
  return (
    <div className="lineage-entry" onClick={() => onClick(entry.id)}>
      <div className="lineage-entry-name">
        {label && <span className="lineage-role">{label}</span>}
        {'clutch_letter' in entry && entry.clutch_letter && (
          <span className="lineage-letter">{entry.clutch_letter}</span>
        )}
        <span className="lineage-link">{formatLabel(entry)}</span>
        {entry.sex && <span className="lineage-sex">{entry.sex === 'F' ? '\u2640' : '\u2642'}</span>}
      </div>
      <div className="lineage-entry-details">
        {entry.morph && <span className="lineage-morph">{entry.morph}</span>}
        {entry.weight_grams && <span className="lineage-weight">{entry.weight_grams}g</span>}
      </div>
    </div>
  )
}

export function LineageModal({ snake, onClose, onNavigateToSnake }: LineageModalProps) {
  const [data, setData] = useState<LineageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const displayId = snake.breeder_id || `#${snake.snake_number}`

  useEffect(() => {
    setData(null)
    setLoading(true)
    setError(null)
    fetchLineage(snake)
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load lineage'))
      .finally(() => setLoading(false))
  }, [snake.id])

  function handleSnakeClick(snakeId: string) {
    onNavigateToSnake(snakeId)
  }

  const hasAnyData = data && (
    data.dam || data.sires.length > 0 || data.siblings.length > 0 || data.offspringClutches.length > 0
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="lineage-modal" onClick={e => e.stopPropagation()}>
        <div className="lineage-modal-header">
          <h2>Lineage - {snake.name || displayId}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {loading && <div className="lineage-loading">Loading lineage...</div>}
        {error && <div className="form-error">{error}</div>}

        {data && !loading && (
          <>
            {/* Parents */}
            {(data.dam || data.sires.length > 0) && (
              <div className="lineage-section">
                <h3>
                  Parents
                  {data.clutchNumber && <span className="lineage-clutch-tag">from {data.clutchNumber}</span>}
                </h3>
                {data.dam && (
                  <SnakeEntry key={data.dam.id} entry={data.dam} label="Dam" onClick={handleSnakeClick} />
                )}
                {data.sires.map((sire, i) => (
                  <SnakeEntry
                    key={sire.id}
                    entry={sire}
                    label={data.sires.length === 1 ? 'Sire' : `Sire ${i + 1}`}
                    onClick={handleSnakeClick}
                  />
                ))}
                {data.multiSire && (
                  <p className="lineage-note">Multi-sire pairing</p>
                )}
              </div>
            )}

            {/* Siblings */}
            {data.siblings.length > 0 && (
              <div className="lineage-section">
                <h3>Siblings ({data.siblings.length})</h3>
                {data.siblings.map(s => (
                  <SnakeEntry key={s.id} entry={s} onClick={handleSnakeClick} />
                ))}
              </div>
            )}

            {/* Offspring */}
            {data.offspringClutches.length > 0 && (
              <div className="lineage-section">
                <h3>Offspring</h3>
                {data.offspringClutches.map(clutch => (
                  <div key={clutch.clutch_id} className="lineage-offspring-clutch">
                    <h4>{clutch.clutch_number} ({clutch.babies.length} {clutch.babies.length === 1 ? 'baby' : 'babies'})</h4>
                    {clutch.babies.map(baby => (
                      <SnakeEntry key={baby.id} entry={baby} onClick={handleSnakeClick} />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* No lineage data */}
            {!hasAnyData && (
              <div className="lineage-empty">
                <p>No lineage data available for this snake.</p>
                <p className="lineage-hint">Lineage is tracked through pairings and clutches.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
