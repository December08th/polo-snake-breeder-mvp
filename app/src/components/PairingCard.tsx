import type { Pairing, PairingMale, FollicleCheck, Snake, PairingStatus } from '../types/database'

// Extended pairing type with relations
export interface PairingWithRelations extends Pairing {
  female: Pick<Snake, 'id' | 'name' | 'breeder_id'>
  pairing_males: (PairingMale & {
    male: Pick<Snake, 'id' | 'name' | 'breeder_id'>
  })[]
  follicle_checks: FollicleCheck[]
}

interface PairingCardProps {
  pairing: PairingWithRelations
  onClick: () => void
}

function getStatusColor(status: PairingStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'status-active'
    case 'OVULATED':
      return 'status-ovulated'
    case 'LAID':
      return 'status-laid'
    case 'COMPLETE':
      return 'status-complete'
    default:
      return 'status-active'
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getLatestFollicleCheck(checks: FollicleCheck[]): FollicleCheck | null {
  if (checks.length === 0) return null
  return checks.reduce((latest, check) => {
    return new Date(check.checked_at) > new Date(latest.checked_at) ? check : latest
  })
}

function getNextCheckDue(checks: FollicleCheck[]): string | null {
  const latest = getLatestFollicleCheck(checks)
  return latest?.next_check_due || null
}

function formatNextCheck(dateStr: string | null): { text: string; urgent: boolean } {
  if (!dateStr) return { text: 'Not scheduled', urgent: false }

  const dueDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)

  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, urgent: true }
  } else if (diffDays === 0) {
    return { text: 'Due today', urgent: true }
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', urgent: true }
  } else {
    return { text: formatDate(dateStr), urgent: false }
  }
}

function getFemaleName(female: Pick<Snake, 'id' | 'name' | 'breeder_id'>): string {
  if (female.name && female.breeder_id) {
    return `${female.name} (${female.breeder_id})`
  }
  return female.name || female.breeder_id || 'Unknown'
}

function getMaleName(male: Pick<Snake, 'id' | 'name' | 'breeder_id'>): string {
  return male.name || male.breeder_id || 'Unknown'
}

export function PairingCard({ pairing, onClick }: PairingCardProps) {
  const latestFollicle = getLatestFollicleCheck(pairing.follicle_checks)
  const nextCheckDue = getNextCheckDue(pairing.follicle_checks)
  const nextCheck = formatNextCheck(nextCheckDue)

  return (
    <div className="pairing-card" onClick={onClick}>
      <div className="pairing-header">
        <span className={`pairing-status ${getStatusColor(pairing.status)}`}>
          {pairing.status}
        </span>
        {pairing.status === 'ACTIVE' && (
          <span className={`next-check ${nextCheck.urgent ? 'urgent' : ''}`}>
            Next: {nextCheck.text}
          </span>
        )}
      </div>

      <div className="pairing-female">
        <span className="female-icon">&#9792;</span>
        {getFemaleName(pairing.female)}
      </div>

      <div className="pairing-divider" />

      <div className="pairing-males">
        <span className="males-label">Males:</span>
        {pairing.pairing_males.length === 0 ? (
          <span className="no-males">None added</span>
        ) : (
          pairing.pairing_males.map((pm) => (
            <div key={pm.id} className="male-entry">
              {getMaleName(pm.male)} - {pm.lock_count} lock{pm.lock_count !== 1 ? 's' : ''}
            </div>
          ))
        )}
      </div>

      <div className="pairing-divider" />

      <div className="pairing-details">
        {latestFollicle && (
          <p>
            <strong>Follicle:</strong> {latestFollicle.follicle_size_mm}mm ({formatDate(latestFollicle.checked_at)})
          </p>
        )}
        <p>
          <strong>Ovi:</strong> {formatDate(pairing.ovulation_date)}
          {' '}
          <strong>PLS:</strong> {formatDate(pairing.pre_lay_shed_date)}
        </p>
      </div>
    </div>
  )
}
