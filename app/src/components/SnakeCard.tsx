import type { Snake } from '../types/database'

interface SnakeCardProps {
  snake: Snake
  onClick: () => void
}

export function SnakeCard({ snake, onClick }: SnakeCardProps) {
  return (
    <div className="snake-card" onClick={onClick}>
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
  )
}
