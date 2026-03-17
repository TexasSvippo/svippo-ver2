'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { categories } from '@/data/categories'
import styles from './tjanster.module.scss'

type Service = {
  id: string
  title: string
  description: string
  category_id: string
  subcategory: string
  price_type: string
  price: number
  location: string
  user_name: string
  user_id: string
  rating: number
  reviews: number
}

type Props = {
  services: Service[]
}

export default function TjansterClient({ services }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('kategori') ?? '')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  // Uppdatera URL när sökning ändras
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (selectedCategory) params.set('kategori', selectedCategory)
    const query = params.toString()
    router.replace(query ? `/tjanster?${query}` : '/tjanster', { scroll: false })
  }, [search, selectedCategory])

  const locations = [...new Set(services.map(s => s.location).filter(Boolean))]

  const filtered = services
    .filter(s => {
      const matchSearch = search === '' ||
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.subcategory?.toLowerCase().includes(search.toLowerCase())
      const matchCategory = selectedCategory === '' || s.category_id === selectedCategory
      const matchLocation = selectedLocation === '' || s.location === selectedLocation
      return matchSearch && matchCategory && matchLocation
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedLocation('')
    setSortBy('newest')
  }

  const hasFilters = search || selectedCategory || selectedLocation || sortBy !== 'newest'

  return (
    <div className={styles.tjanster}>
      <div className={`container ${styles.tjanster__inner}`}>

        {/* Header */}
        <div className={styles.tjanster__header}>
          <h1 className={styles.tjanster__title}>Tjänster</h1>
          <p className={styles.tjanster__subtitle}>{filtered.length} tjänster hittades</p>
        </div>

        {/* Sök & filter */}
        <div className={styles.tjanster__filters}>
          <div className={styles.tjanster__search}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Sök tjänster..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.tjanster__search_input}
            />
            {search && (
              <button className={styles.tjanster__clear_search} onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className={styles.tjanster__filter_row}>
            <select
              className={styles.tjanster__select}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Alla kategorier</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
              ))}
            </select>

            <select
              className={styles.tjanster__select}
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              <option value="">Alla platser</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <select
              className={styles.tjanster__select}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Nyast först</option>
              <option value="price_asc">Lägst pris</option>
              <option value="price_desc">Högst pris</option>
              <option value="rating">Bäst betyg</option>
            </select>

            {hasFilters && (
              <button className={styles.tjanster__clear_btn} onClick={clearFilters}>
                Rensa filter
              </button>
            )}
          </div>
        </div>

        {/* Aktiva filter-taggar */}
        {hasFilters && (
          <div className={styles.tjanster__active_filters}>
            {search && (
              <span className={styles.tjanster__filter_tag}>
                🔍 &quot;{search}&quot;
                <button onClick={() => setSearch('')}>✕</button>
              </span>
            )}
            {selectedCategory && (
              <span className={styles.tjanster__filter_tag}>
                {categories.find(c => c.id === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory('')}>✕</button>
              </span>
            )}
            {selectedLocation && (
              <span className={styles.tjanster__filter_tag}>
                📍 {selectedLocation}
                <button onClick={() => setSelectedLocation('')}>✕</button>
              </span>
            )}
          </div>
        )}

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className={styles.tjanster__empty}>
            <p>Inga tjänster matchar din sökning.</p>
            <button className="btn btn-outline" onClick={clearFilters}>Rensa filter</button>
          </div>
        ) : (
          <div className={styles.tjanster__list}>
            {filtered.map(s => (
              <Link href={`/tjanst/${s.id}`} key={s.id} className={`${styles.service_card} card`}>
                <div className={styles.service_card__avatar}>
                  <div className={styles.service_card__avatar_placeholder}>
                    {s.user_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>

                <div className={styles.service_card__info}>
                  <div className={styles.service_card__meta}>
                    <span className={styles.service_card__name}>{s.user_name}</span>
                    <span className={styles.star_rating}>⭐ <strong>{s.rating || '–'}</strong></span>
                    <span className={styles.service_card__reviews}>({s.reviews})</span>
                    <span className={styles.service_card__distance}>· {s.location}</span>
                  </div>
                  <p className={styles.service_card__title}>{s.title}</p>
                  <span className={styles.service_card__category}>{s.subcategory}</span>
                </div>

                <div className={styles.service_card__price}>
                  <span className={styles.service_card__price_type}>
                    {s.price_type === 'offert' ? '' : 'från:'}
                  </span>
                  <strong>
                    {s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}