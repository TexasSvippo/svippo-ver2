'use client'

import { useState } from 'react'
import Link from 'next/link'
import { categories } from '@/data/categories'
import styles from './MegaMenuRequests.module.scss'

type Props = {
  onClose: () => void
}

export default function MegaMenuRequests({ onClose }: Props) {
  const [activeId, setActiveId] = useState(categories[0].id)

  const activeCategory = categories.find(c => c.id === activeId) ?? categories[0]

  return (
    <div className={styles.mega} data-mega-menu-requests>
      <div className={styles.mega__body}>

        {/* Left column – category list */}
        <div className={styles.mega__left}>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`${styles.mega__cat_row} ${cat.id === activeId ? styles['mega__cat_row--active'] : ''}`}
              onMouseEnter={() => setActiveId(cat.id)}
              onClick={() => setActiveId(cat.id)}
            >
              <span className={styles.mega__cat_icon}>{cat.icon}</span>
              <span className={styles.mega__cat_label}>{cat.label}</span>
              <span className={`${styles.mega__cat_badge} ${cat.id === activeId ? styles['mega__cat_badge--active'] : ''}`}>
                {cat.subcategories.length}
              </span>
            </button>
          ))}
        </div>

        <div className={styles.mega__sep} />

        {/* Right column – subcategories */}
        <div className={styles.mega__middle}>
          <p className={styles.mega__section_heading}>
            {activeCategory.label} – välj underkategori
          </p>
          <div className={styles.mega__sub_grid}>
            {activeCategory.subcategories.map(sub => (
              <Link
                key={sub}
                href={`/requests?kategori=${activeCategory.id}&underkategori=${encodeURIComponent(sub)}`}
                className={styles.mega__sub_card}
                onClick={onClose}
              >
                <span className={styles.mega__sub_name}>{sub}</span>
                <span className={styles.mega__sub_hint}>Se öppna förfrågningar</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Footer bar */}
      <div className={styles.mega__footer}>
        <Link href="/requests" className={styles.mega__footer_all} onClick={onClose}>
          Bläddra bland alla förfrågningar →
        </Link>
        <span className={styles.mega__footer_hint}>
          Har du ett behov? Lägg ut din egen förfrågan.
        </span>
      </div>
    </div>
  )
}
