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
import type { Snake, SnakeStatus, Clutch } from './types/database'
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
  const [clutches, setClutches] = useState<Clutch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddClutchForm, setShowAddClutchForm] = useState(false)
  const [editingSnake, setEditingSnake] = useState<Snake | null>(null)
  const [editingClutch, setEditingClutch] = useState<Clutch | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<SnakeStatus>>(new Set())
  const [incubatorCollapsed, setIncubatorCollapsed] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSnakes()
      fetchClutches()
    } else {
      setSnakes([])
      setClutches([])
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

  function handleAddSuccess() {
    setShowAddForm(false)
    fetchSnakes()
  }

  function handleEditSuccess() {
    setEditingSnake(null)
    fetchSnakes()
  }

  function handleAddClutchSuccess() {
    setShowAddClutchForm(false)
    fetchClutches()
  }

  function handleEditClutchSuccess() {
    setEditingClutch(null)
    fetchClutches()
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
            <button className="btn-add" onClick={() => setShowAddForm(true)}>
              + Add Snake
            </button>
          </div>

          {snakes.length === 0 ? (
            <p className="empty">No snakes yet. Add your first snake!</p>
          ) : (
            STATUS_GROUPS.map(({ status, label }) => {
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
                          onClick={() => setEditingSnake(snake)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })
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
                  <div className="group-header completed-header">
                    <h3>Hatched</h3>
                    <span className="group-count">{completedClutches.length}</span>
                  </div>
                  <div className="clutch-grid">
                    {completedClutches.map((clutch) => (
                      <ClutchCard
                        key={clutch.id}
                        clutch={clutch}
                        onClick={() => setEditingClutch(clutch)}
                      />
                    ))}
                  </div>
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
    </div>
  )
}

export default App
