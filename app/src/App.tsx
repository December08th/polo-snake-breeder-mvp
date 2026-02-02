import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './contexts/AuthContext'
import { Auth } from './components/Auth'
import { AddSnakeForm } from './components/AddSnakeForm'
import { EditSnakeForm } from './components/EditSnakeForm'
import { SnakeCard } from './components/SnakeCard'
import { ClutchCard } from './components/ClutchCard'
import { AddClutchForm } from './components/AddClutchForm'
import { EditClutchForm } from './components/EditClutchForm'
import { PairingCard, type PairingWithRelations } from './components/PairingCard'
import { AddPairingForm } from './components/AddPairingForm'
import { EditPairingForm } from './components/EditPairingForm'
import { StatusSettingsModal, getHiddenStatuses } from './components/StatusSettingsModal'
import { WeightLogModal } from './components/WeightLogModal'
import type { Snake, SnakeStatus, Clutch, PairingStatus, WeightLog } from './types/database'
import './App.css'

const STATUS_GROUPS: { status: SnakeStatus; label: string }[] = [
  { status: 'F_BREEDER', label: 'Female Breeders' },
  { status: 'M_BREEDER', label: 'Male Breeders' },
  { status: 'F_HOLDBACK', label: 'Female Holdbacks' },
  { status: 'M_HOLDBACK', label: 'Male Holdbacks' },
  { status: 'F_AVAILABLE', label: 'Females Available' },
  { status: 'M_AVAILABLE', label: 'Males Available' },
  { status: 'ON_HOLD', label: 'On Hold' },
]

function groupSnakesByStatus(snakes: Snake[]): Map<SnakeStatus, Snake[]> {
  const groups = new Map<SnakeStatus, Snake[]>()

  for (const snake of snakes) {
    const status = snake.status || 'ON_HOLD'
    const group = groups.get(status) || []
    group.push(snake)
    groups.set(status, group)
  }

  // Sort each group by weight descending (nulls last)
  for (const [, group] of groups) {
    group.sort((a, b) => (b.weight_grams ?? -1) - (a.weight_grams ?? -1))
  }

  return groups
}

function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [snakes, setSnakes] = useState<Snake[]>([])
  const [weightLogs, setWeightLogs] = useState<Map<string, WeightLog[]>>(new Map())
  const [clutches, setClutches] = useState<Clutch[]>([])
  const [pairings, setPairings] = useState<PairingWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddClutchForm, setShowAddClutchForm] = useState(false)
  const [showAddPairingForm, setShowAddPairingForm] = useState(false)
  const [editingSnake, setEditingSnake] = useState<Snake | null>(null)
  const [editingClutch, setEditingClutch] = useState<Clutch | null>(null)
  const [editingPairing, setEditingPairing] = useState<PairingWithRelations | null>(null)
  const [weightLogSnake, setWeightLogSnake] = useState<Snake | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<SnakeStatus>>(
    () => new Set(STATUS_GROUPS.map(g => g.status))
  )
  const [incubatorCollapsed, setIncubatorCollapsed] = useState(true)
  const [hatchedCollapsed, setHatchedCollapsed] = useState(true)
  const [pairingsCollapsed, setPairingsCollapsed] = useState<Set<PairingStatus>>(() => new Set())
  const [showStatusSettings, setShowStatusSettings] = useState(false)
  const [hiddenStatuses, setHiddenStatuses] = useState<Set<SnakeStatus>>(() => new Set(getHiddenStatuses()))

  useEffect(() => {
    if (user) {
      fetchSnakes()
      fetchWeightLogs()
      fetchClutches()
      fetchPairings()
    } else {
      setSnakes([])
      setWeightLogs(new Map())
      setClutches([])
      setPairings([])
      setLoading(false)
    }
  }, [user])

  async function fetchSnakes() {
    try {
      const { data, error } = await supabase
        .from('snakes')
        .select('*')
        .order('snake_number', { ascending: true })

      if (error) throw error
      setSnakes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch snakes')
    } finally {
      setLoading(false)
    }
  }

  async function fetchWeightLogs() {
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .order('recorded_at', { ascending: false })

      if (error) throw error

      // Group by snake_id
      const logsMap = new Map<string, WeightLog[]>()
      for (const log of data || []) {
        const existing = logsMap.get(log.snake_id) || []
        existing.push(log)
        logsMap.set(log.snake_id, existing)
      }
      setWeightLogs(logsMap)
    } catch (err) {
      console.error('Failed to fetch weight logs:', err)
    }
  }

  async function fetchClutches() {
    try {
      const { data, error } = await supabase
        .from('clutches')
        .select('*')
        .order('expected_hatch_date', { ascending: true, nullsFirst: false })

      if (error) throw error
      setClutches(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clutches')
    }
  }

  async function fetchPairings() {
    try {
      const { data, error } = await supabase
        .from('pairings')
        .select(`
          *,
          female:snakes!female_id(id, name, breeder_id),
          pairing_males(
            id, male_id, lock_count, last_lock_date,
            male:snakes(id, name, breeder_id)
          ),
          follicle_checks(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPairings((data || []) as PairingWithRelations[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pairings')
    }
  }

  function handleAddSuccess() {
    setShowAddForm(false)
    fetchSnakes()
  }

  function handleEditSuccess() {
    setEditingSnake(null)
    fetchSnakes()
  }

  function handleWeightUpdate() {
    fetchSnakes()
    fetchWeightLogs()
  }

  function handleWeightLogSuccess() {
    setWeightLogSnake(null)
    fetchSnakes()
    fetchWeightLogs()
  }

  function handleAddClutchSuccess() {
    setShowAddClutchForm(false)
    fetchClutches()
  }

  function handleEditClutchSuccess() {
    setEditingClutch(null)
    fetchClutches()
  }

  function handleAddPairingSuccess() {
    setShowAddPairingForm(false)
    fetchPairings()
  }

  function handleEditPairingSuccess() {
    setEditingPairing(null)
    fetchPairings()
  }

  function togglePairingGroup(status: PairingStatus) {
    setPairingsCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  function toggleGroup(status: SnakeStatus) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(status)) {
        next.delete(status)
      } else {
        next.add(status)
      }
      return next
    })
  }

  if (authLoading) return <div className="loading">Loading...</div>
  if (!user) return <Auth />
  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  const groupedSnakes = groupSnakesByStatus(snakes)

  // Separate active vs completed clutches
  const activeClutches = clutches.filter(c => !c.actual_hatch_date)
  const completedClutches = clutches.filter(c => c.actual_hatch_date)

  // Group pairings by status
  const activePairings = pairings.filter(p => p.status === 'ACTIVE')
  const ovulatedPairings = pairings.filter(p => p.status === 'OVULATED')
  const laidPairings = pairings.filter(p => p.status === 'LAID')
  const completedPairings = pairings.filter(p => p.status === 'COMPLETE')

  return (
    <div className="app">
      <header>
        <div className="header-content">
          <div className="header-title">
            <h1>PyThrone</h1>
            <p>Snake Breeder Management</p>
          </div>
          <div className="header-user">
            <span className="user-email">{user.email}</span>
            <button className="btn-logout" onClick={signOut}>Log out</button>
          </div>
        </div>
      </header>

      <main>
        <section className="collection">
          <div className="collection-header">
            <h2>Collection ({snakes.length} snakes)</h2>
            <div className="collection-actions">
              <button
                className="btn-settings"
                onClick={() => setShowStatusSettings(true)}
                title="Configure visible statuses"
              >
                ⚙
              </button>
              <button className="btn-add" onClick={() => setShowAddForm(true)}>
                + Add Snake
              </button>
            </div>
          </div>

          {snakes.length === 0 ? (
            <p className="empty">No snakes yet. Add your first snake!</p>
          ) : (
            STATUS_GROUPS
              .filter(({ status }) => !hiddenStatuses.has(status))
              .map(({ status, label }) => {
              const group = groupedSnakes.get(status)
              if (!group || group.length === 0) return null

              const isCollapsed = collapsedGroups.has(status)

              return (
                <div key={status} className="status-group">
                  <div className="group-header" onClick={() => toggleGroup(status)}>
                    <h3>{label}</h3>
                    <span className="group-count">{group.length}</span>
                    <span className={`group-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  {!isCollapsed && (
                    <div className="snake-grid">
                      {group.map((snake) => (
                        <SnakeCard
                          key={snake.id}
                          snake={snake}
                          weightLogs={weightLogs.get(snake.id) || []}
                          onClick={() => setEditingSnake(snake)}
                          onWeightUpdate={handleWeightUpdate}
                          onViewWeightHistory={() => setWeightLogSnake(snake)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </section>

        <section className="pairings">
          <div className="collection-header">
            <h2>Pairings ({pairings.length} total)</h2>
            <button className="btn-add" onClick={() => setShowAddPairingForm(true)}>
              + Add Pairing
            </button>
          </div>

          {pairings.length === 0 ? (
            <p className="empty">No pairings yet. Add your first pairing!</p>
          ) : (
            <>
              {activePairings.length > 0 && (
                <div className="pairing-group">
                  <div
                    className="group-header"
                    onClick={() => togglePairingGroup('ACTIVE')}
                  >
                    <h3>Active</h3>
                    <span className="group-count">{activePairings.length}</span>
                    <span className={`group-toggle ${pairingsCollapsed.has('ACTIVE') ? 'collapsed' : ''}`}>&#9660;</span>
                  </div>
                  {!pairingsCollapsed.has('ACTIVE') && (
                    <div className="pairing-grid">
                      {activePairings.map((pairing) => (
                        <PairingCard
                          key={pairing.id}
                          pairing={pairing}
                          onClick={() => setEditingPairing(pairing)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {ovulatedPairings.length > 0 && (
                <div className="pairing-group">
                  <div
                    className="group-header"
                    onClick={() => togglePairingGroup('OVULATED')}
                  >
                    <h3>Ovulated</h3>
                    <span className="group-count">{ovulatedPairings.length}</span>
                    <span className={`group-toggle ${pairingsCollapsed.has('OVULATED') ? 'collapsed' : ''}`}>&#9660;</span>
                  </div>
                  {!pairingsCollapsed.has('OVULATED') && (
                    <div className="pairing-grid">
                      {ovulatedPairings.map((pairing) => (
                        <PairingCard
                          key={pairing.id}
                          pairing={pairing}
                          onClick={() => setEditingPairing(pairing)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {laidPairings.length > 0 && (
                <div className="pairing-group">
                  <div
                    className="group-header"
                    onClick={() => togglePairingGroup('LAID')}
                  >
                    <h3>Laid</h3>
                    <span className="group-count">{laidPairings.length}</span>
                    <span className={`group-toggle ${pairingsCollapsed.has('LAID') ? 'collapsed' : ''}`}>&#9660;</span>
                  </div>
                  {!pairingsCollapsed.has('LAID') && (
                    <div className="pairing-grid">
                      {laidPairings.map((pairing) => (
                        <PairingCard
                          key={pairing.id}
                          pairing={pairing}
                          onClick={() => setEditingPairing(pairing)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {completedPairings.length > 0 && (
                <div className="pairing-group">
                  <div
                    className="group-header completed-header"
                    onClick={() => togglePairingGroup('COMPLETE')}
                  >
                    <h3>Complete</h3>
                    <span className="group-count">{completedPairings.length}</span>
                    <span className={`group-toggle ${pairingsCollapsed.has('COMPLETE') ? 'collapsed' : ''}`}>&#9660;</span>
                  </div>
                  {!pairingsCollapsed.has('COMPLETE') && (
                    <div className="pairing-grid">
                      {completedPairings.map((pairing) => (
                        <PairingCard
                          key={pairing.id}
                          pairing={pairing}
                          onClick={() => setEditingPairing(pairing)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        <section className="incubator">
          <div className="collection-header">
            <h2>Incubator ({activeClutches.length} active)</h2>
            <button className="btn-add" onClick={() => setShowAddClutchForm(true)}>
              + Add Clutch
            </button>
          </div>

          {clutches.length === 0 ? (
            <p className="empty">No clutches yet. Add your first clutch!</p>
          ) : (
            <>
              {activeClutches.length > 0 && (
                <div className="clutch-group">
                  <div
                    className="group-header"
                    onClick={() => setIncubatorCollapsed(!incubatorCollapsed)}
                  >
                    <h3>Incubating</h3>
                    <span className="group-count">{activeClutches.length}</span>
                    <span className={`group-toggle ${incubatorCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  {!incubatorCollapsed && (
                    <div className="clutch-grid">
                      {activeClutches.map((clutch) => (
                        <ClutchCard
                          key={clutch.id}
                          clutch={clutch}
                          onClick={() => setEditingClutch(clutch)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {completedClutches.length > 0 && (
                <div className="clutch-group">
                  <div
                    className="group-header completed-header"
                    onClick={() => setHatchedCollapsed(!hatchedCollapsed)}
                  >
                    <h3>Hatched</h3>
                    <span className="group-count">{completedClutches.length}</span>
                    <span className={`group-toggle ${hatchedCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  {!hatchedCollapsed && (
                    <div className="clutch-grid">
                      {completedClutches.map((clutch) => (
                        <ClutchCard
                          key={clutch.id}
                          clutch={clutch}
                          onClick={() => setEditingClutch(clutch)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {showAddForm && (
        <AddSnakeForm
          userId={user.id}
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingSnake && (
        <EditSnakeForm
          snake={editingSnake}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingSnake(null)}
        />
      )}

      {showAddClutchForm && (
        <AddClutchForm
          userId={user.id}
          onSuccess={handleAddClutchSuccess}
          onCancel={() => setShowAddClutchForm(false)}
        />
      )}

      {editingClutch && (
        <EditClutchForm
          clutch={editingClutch}
          onSuccess={handleEditClutchSuccess}
          onCancel={() => setEditingClutch(null)}
        />
      )}

      {showStatusSettings && (
        <StatusSettingsModal
          onClose={() => {
            setShowStatusSettings(false)
            setHiddenStatuses(new Set(getHiddenStatuses()))
          }}
        />
      )}

      {showAddPairingForm && (
        <AddPairingForm
          userId={user.id}
          onSuccess={handleAddPairingSuccess}
          onCancel={() => setShowAddPairingForm(false)}
        />
      )}

      {editingPairing && (
        <EditPairingForm
          pairing={editingPairing}
          onSuccess={handleEditPairingSuccess}
          onCancel={() => setEditingPairing(null)}
        />
      )}

      {weightLogSnake && (
        <WeightLogModal
          snake={weightLogSnake}
          logs={weightLogs.get(weightLogSnake.id) || []}
          onClose={() => setWeightLogSnake(null)}
          onUpdate={handleWeightLogSuccess}
        />
      )}
    </div>
  )
}

export default App
