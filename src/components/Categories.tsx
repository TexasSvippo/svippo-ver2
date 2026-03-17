import Link from 'next/link'
import styles from './Categories.module.scss'

const categories = [
  { icon: '🖥️', label: 'Digitala tjänster', slug: 'digitala' },
  { icon: '🎨', label: 'Medie & design', slug: 'medie-design' },
  { icon: '📚', label: 'Utbildning', slug: 'utbildning' },
  { icon: '🏠', label: 'Hushållstjänster', slug: 'hushall' },
  { icon: '🚗', label: 'Biltjänster', slug: 'bil' },
  { icon: '💆', label: 'Skönhet & hälsa', slug: 'skonhet' },
  { icon: '🔨', label: 'Bygg & hantverk', slug: 'bygg' },
  { icon: '🌿', label: 'Trädgård', slug: 'tradgard' },
  { icon: '📦', label: 'Frakt & flytt', slug: 'frakt' },
]

export default function Categories() {
  return (
    <section className={styles.categories}>
      <div className="container">
        <div className={styles.categories__grid}>
          {categories.map((cat) => (
            <Link
              href={`/tjanster?kategori=${cat.slug}`}
              key={cat.label}
              className={styles.categories__item}
            >
              <div className={styles.categories__icon}>{cat.icon}</div>
              <span className={styles.categories__label}>{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
