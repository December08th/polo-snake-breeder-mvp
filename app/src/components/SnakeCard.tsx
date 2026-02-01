import type { Snake } from '../types/database'

interface SnakeCardProps {
  snake: Snake
  onClick: () => void
}

export function SnakeCard({ snake, onClick }: SnakeCardProps) {
  // Display breeder_id if present, otherwise fall back to auto-generated snake_number
  const displayId = snake.breeder_id || `#${snake.snake_number}`

  return (
    <div className="snake-card" onClick={onClick}>
      <div className="snake-header">
        <span className="snake-number">{displayId}</span>
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
  )
}
