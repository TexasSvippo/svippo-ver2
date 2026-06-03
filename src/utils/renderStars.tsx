import { Star } from 'lucide-react'

/**
 * Renders a row of filled/empty stars.
 * Filled: #EF9F27 (amber). Empty: #D3D1C7 (light gray).
 */
export function renderStars(rating: number, size = 16) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? '#EF9F27' : '#D3D1C7'}
          color={i < rating ? '#EF9F27' : '#D3D1C7'}
        />
      ))}
    </span>
  )
}
