import { ChevronRight } from 'lucide-react'
import { categories } from '@/data/categories'
import styles from './Categories.module.scss'

export default function Categories() {
  return (
    <section className={styles.categories}>
      <div className={styles.categories__container}>
        <h2 className={styles.categories__heading}>Vad behöver du hjälp med?</h2>
        <div className={styles.categories__grid}>
          {categories.map(cat => (
            <a
              key={cat.id}
              href={`/services?kategori=${cat.id}`}
              className={styles.categories__item}
            >
              <div className={styles.categories__left}>
                <span className={styles.categories__emoji}>{cat.icon}</span>
                <span className={styles.categories__label}>{cat.label}</span>
              </div>
              <ChevronRight size={18} className={styles.categories__chevron} />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
