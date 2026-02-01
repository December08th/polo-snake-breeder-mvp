import type { Clutch } from '../types/database'

interface ClutchCardProps {
  clutch: Clutch
  onClick: () => void
}

function getCountdownInfo(expectedDate: string | null, actualDate: string | null): { text: string; urgency: 'green' | 'yellow' | 'red' | 'complete' } {
  if (actualDate) {
    return { text: 'Hatched!', urgency: 'complete' }
  }

  if (!expectedDate) {
    return { text: 'No hatch date', urgency: 'green' }
  }

  const expected = new Date(expectedDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expected.setHours(0, 0, 0, 0)

  const diffTime = expected.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} days overdue`, urgency: 'red' }
  } else if (diffDays === 0) {
    return { text: 'Due today!', urgency: 'red' }
  } else if (diffDays === 1) {
    return { text: '1 day to hatch', urgency: 'red' }
  } else if (diffDays <= 7) {
    return { text: `${diffDays} days to hatch`, urgency: 'red' }
  } else if (diffDays <= 14) {
    return { text: `${diffDays} days to hatch`, urgency: 'yellow' }
  } else {
    return { text: `${diffDays} days to hatch`, urgency: 'green' }
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function ClutchCard({ clutch, onClick }: ClutchCardProps) {
  const countdown = getCountdownInfo(clutch.expected_hatch_date, clutch.actual_hatch_date)

  // Build egg count display
  const eggParts: string[] = []
  if (clutch.fertile_count > 0) eggParts.push(`${clutch.fertile_count} fertile`)
  if (clutch.slug_count > 0) eggParts.push(`${clutch.slug_count} slug`)
  if (clutch.kink_count > 0) eggParts.push(`${clutch.kink_count} kinked`)
  const eggDetail = eggParts.length > 0 ? ` (${eggParts.join(', ')})` : ''

  return (
    <div className="clutch-card" onClick={onClick}>
      <div className="clutch-header">
        <span className="clutch-number">{clutch.clutch_number}</span>
        <span className={`countdown-badge countdown-${countdown.urgency}`}>
          {countdown.text}
        </span>
      </div>
      <div className="clutch-details">
        <p><strong>Laid:</strong> {formatDate(clutch.lay_date)}</p>
        <p><strong>Eggs:</strong> {clutch.egg_count}{eggDetail}</p>
        {clutch.actual_hatch_date && (
          <>
            <p><strong>Hatched:</strong> {formatDate(clutch.actual_hatch_date)}</p>
            <p><strong>Hatch count:</strong> {clutch.hatch_count}</p>
          </>
        )}
        {clutch.remarks && <p className="clutch-remarks"><strong>Notes:</strong> {clutch.remarks}</p>}
      </div>
    </div>
  )
}
