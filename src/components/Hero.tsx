'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './Hero.module.scss'

type ActiveTab = 'services' | 'requests'

type Service = {
  id: string
  title: string
  subcategory: string
  location: string
  price: number
  price_type: string
}

type Request = {
  id: string
  title: string
  subcategory: string
  location: string
  budget: number
}

const POPULAR_PILLS = [
  { label: 'Städning',        kategori: 'hushall' },
  { label: 'Snickeri',        kategori: 'bygg-hantverk' },
  { label: 'Däckbyte',        kategori: 'bil' },
  { label: 'Webbutveckling',  kategori: 'digitala-tjanster' },
  { label: 'Fönsterputsning', kategori: 'hushall' },
  { label: 'Flytthjälp',      kategori: 'frakt-flytt' },
]

export default function Hero() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('services')
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (search.length < 2) {
      setServices([])
      setRequests([])
      setShowDropdown(false)
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        if (activeTab === 'services') {
          const { data } = await supabase
            .from('services')
            .select('id, title, subcategory, location, price, price_type')
            .or(`title.ilike.%${search}%,subcategory.ilike.%${search}%`)
            .limit(4)
          setServices(data ?? [])
        } else {
          const { data } = await supabase
            .from('requests')
            .select('id, title, subcategory, location, budget')
            .or(`title.ilike.%${search}%,subcategory.ilike.%${search}%`)
            .limit(4)
          setRequests(data ?? [])
        }
        setShowDropdown(true)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [search, activeTab])

  const handleSubmit = () => {
    if (!search.trim()) return
    const path = activeTab === 'services' ? '/services' : '/requests'
    router.push(`${path}?search=${encodeURIComponent(search.trim())}`)
    setShowDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab)
    setServices([])
    setRequests([])
    setShowDropdown(false)
  }

  const results = activeTab === 'services' ? services : requests

  return (
    <section className={styles.hero}>
      <div className={styles.hero__container}>
      <div className={styles.hero__card}>

        {/* Punchline badge */}
        <span className={styles.hero__badge}>
          Hitta hjälp. Tjäna pengar.
        </span>

        {/* H1 */}
        <h1 className={styles.hero__title}>
          Hitta tjänster för dig,{' '}
          <span className={styles['hero__title--italic']}>i ditt område!</span>
        </h1>

        {/* Tabs */}
        <div className={styles.hero__tabs}>
          <button
            type="button"
            className={`${styles.hero__tab} ${activeTab === 'services' ? styles['hero__tab--active'] : ''}`}
            onClick={() => switchTab('services')}
          >
            Hitta tjänster
          </button>
          <button
            type="button"
            className={`${styles.hero__tab} ${activeTab === 'requests' ? styles['hero__tab--active'] : ''}`}
            onClick={() => switchTab('requests')}
          >
            Hitta uppdrag
          </button>
        </div>

        {/* Search */}
        <div className={styles.hero__search_wrapper} ref={wrapperRef}>
          <div className={styles.hero__search}>
            <input
              type="text"
              className={styles.hero__search_input}
              placeholder="Vad behöver du hjälp med?"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className={`${styles.hero__search_btn} ${activeTab === 'services' ? styles['hero__search_btn--services'] : styles['hero__search_btn--requests']}`}
              onClick={handleSubmit}
            >
              Sök
            </button>
          </div>

          {showDropdown && (
            <div className={styles.hero__dropdown}>
              {loading ? (
                <div className={styles.hero__dropdown_state}>Söker...</div>
              ) : results.length === 0 ? (
                <div className={styles.hero__dropdown_state}>
                  Inga {activeTab === 'services' ? 'tjänster' : 'förfrågningar'} hittades
                </div>
              ) : (
                <>
                  {activeTab === 'services'
                    ? services.map(s => (
                        <Link
                          key={s.id}
                          href={`/service/${s.id}`}
                          className={styles.hero__dropdown_item}
                          onClick={() => { setShowDropdown(false); setSearch('') }}
                        >
                          <div className={styles.hero__dropdown_info}>
                            <strong>{s.title}</strong>
                            <span>{s.subcategory} · {s.location}</span>
                          </div>
                          <span className={styles.hero__dropdown_price}>
                            {s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}
                          </span>
                        </Link>
                      ))
                    : requests.map(r => (
                        <Link
                          key={r.id}
                          href={`/request/${r.id}`}
                          className={styles.hero__dropdown_item}
                          onClick={() => { setShowDropdown(false); setSearch('') }}
                        >
                          <div className={styles.hero__dropdown_info}>
                            <strong>{r.title}</strong>
                            <span>{r.subcategory} · {r.location}</span>
                          </div>
                          <span className={`${styles.hero__dropdown_price} ${styles['hero__dropdown_price--orange']}`}>
                            {r.budget} kr
                          </span>
                        </Link>
                      ))
                  }
                  <Link
                    href={`/${activeTab === 'services' ? 'services' : 'requests'}?search=${encodeURIComponent(search)}`}
                    className={styles.hero__dropdown_see_all}
                    onClick={() => { setShowDropdown(false); setSearch('') }}
                  >
                    Se alla resultat för &quot;{search}&quot; →
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Popular now */}
        <div className={styles.hero__popular}>
          <span className={styles.hero__popular_label}>Populärt nu:</span>
          <div className={styles.hero__popular_pills}>
            {POPULAR_PILLS.map(pill => (
              <button
                key={pill.label}
                type="button"
                className={styles.hero__pill}
                onClick={() => router.push(`/services?kategori=${pill.kategori}&underkategori=${encodeURIComponent(pill.label)}`)}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

      </div>
      </div>
    </section>
  )
}
