'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './AdCard.module.scss'

type Ad = {
  id: string
  company_name: string
  logo_url: string
  headline: string
  description: string
  cta_label: string
  cta_url: string
}

export default function AdCard() {
  const [ad, setAd] = useState<Ad | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('ads')
        .select('id, company_name, logo_url, headline, description, cta_label, cta_url')
      // RLS already filters to is_active=true and within starts_at/ends_at window

      if (!data || data.length === 0) return

      const picked = data[Math.floor(Math.random() * data.length)] as Ad
      setAd(picked)

      // Track impression via server route (bypasses RLS for the increment)
      fetch(`/api/ads/impression?id=${picked.id}`).catch(() => {})
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ad) return null

  const handleClick = () => {
    fetch(`/api/ads/click?id=${ad.id}`).catch(() => {})
    window.open(ad.cta_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={styles.card}>
      {/* Header row */}
      <div className={styles.header}>
        <span className={styles.badge}>Reklam</span>
        <span className={styles.company}>{ad.company_name}</span>
      </div>

      {/* Body: logo + content */}
      <div className={styles.body}>
        <img src={ad.logo_url} alt={ad.company_name} className={styles.logo} />
        <div className={styles.content}>
          <p className={styles.headline}>{ad.headline}</p>
          <p className={styles.description}>{ad.description}</p>
          <button type="button" className={styles.cta} onClick={handleClick}>
            {ad.cta_label}
          </button>
        </div>
      </div>
    </div>
  )
}
