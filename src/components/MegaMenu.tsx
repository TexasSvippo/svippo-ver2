'use client'

import { useState } from 'react'
import Link from 'next/link'
import { categories } from '@/data/categories'
import type { ServiceType } from '@/data/categories'
import styles from './MegaMenu.module.scss'

const TYPE_LABELS: Record<ServiceType, string> = {
  typ1: 'Platsbunden',
  typ2: 'Digital',
  typ3: 'Engångstjänst',
}

const TYPE_HINTS: Record<ServiceType, string> = {
  typ1: 'Bokas för ett specifikt datum och plats',
  typ2: 'Utförs digitalt – följ projektet i plattformen',
  typ3: 'Snabbt och enkelt – bekräftelse direkt',
}

type Props = {
  onClose: () => void
}

export default function MegaMenu({ onClose }: Props) {
  const [activeId, setActiveId] = useState(categories[0].id)
  const activeCategory = categories.find(c => c.id === activeId) ?? categories[0]

  return (
    <div className={styles.mega} data-mega-menu>
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
        <div className={styles.mega__right}>
          <div className={styles.mega__right_top}>
            <span className={`${styles.mega__type_tag} ${styles[`mega__type_tag--${activeCategory.service_type}`]}`}>
              {TYPE_LABELS[activeCategory.service_type]}
            </span>
          </div>

          <p className={styles.mega__section_heading}>
            {activeCategory.label} – välj underkategori
          </p>

          <div className={styles.mega__sub_grid}>
            {activeCategory.subcategories.map(sub => (
              <Link
                key={sub}
                href={`/services?kategori=${activeCategory.id}&underkategori=${encodeURIComponent(sub)}`}
                className={styles.mega__sub_card}
                onClick={onClose}
              >
                <span className={styles.mega__sub_name}>{sub}</span>
                <span className={styles.mega__sub_hint}>{TYPE_HINTS[activeCategory.service_type]}</span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Footer bar */}
      <div className={styles.mega__footer}>
        <Link href="/services" className={styles.mega__footer_all} onClick={onClose}>
          Se alla tjänster →
        </Link>
        <span className={styles.mega__footer_hint}>
          Hittar du inte vad du söker? Lägg ut en förfrågan istället.
        </span>
      </div>
    </div>
  )
}
