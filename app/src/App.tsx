import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { AddSnakeForm } from './components/AddSnakeForm'
import type { Snake } from './types/database'
import './App.css'

function App() {
  const [snakes, setSnakes] = useState<Snake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchSnakes()
  }, [])

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

  function handleAddSuccess() {
    setShowAddForm(false)
    fetchSnakes()
  }

  if (loading) return <div className="loading">Loading...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="app">
      <header>
        <h1>PyThrone</h1>
        <p>Snake Breeder Management</p>
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
            <div className="snake-grid">
              {snakes.map((snake) => (
                <div key={snake.id} className="snake-card">
                  <div className="snake-header">
                    <span className="snake-number">#{snake.snake_number}</span>
                    {snake.name && <span className="snake-name">{snake.name}</span>}
                  </div>
                  <div className="snake-details">
                    <p><strong>Sex:</strong> {snake.sex || '?'}</p>
                    <p><strong>Morph:</strong> {snake.morph || 'Unknown'}</p>
                    <p><strong>Weight:</strong> {snake.weight_grams ? `${snake.weight_grams}g` : '?'}</p>
                    <p><strong>Status:</strong> {snake.status?.replace(/_/g, ' ') || 'Unknown'}</p>
                    {snake.price && <p><strong>Price:</strong> ฿{snake.price.toLocaleString()}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showAddForm && (
        <AddSnakeForm
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  )
}

export default App
