'use client'

import CategorySubscriptions from '@/components/CategorySubscriptions'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { categories } from '@/data/categories'
import styles from './forfragningar.module.scss'
import { Search, MapPin } from 'lucide-react'

type Request = {
  id: string
  title: string
  description: string
  subcategory: string
  category_id: string
  budget: number
  budget_type: string
  location: string
  user_name: string
  user_id: string
  image_url: string
  created_at: string
}

type Props = {
  requests: Request[]
}

export default function ForfragningarClient({ requests }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilterModal, setShowFilterModal] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const query = params.toString()
    router.replace(query ? `/requests?${query}` : '/requests', { scroll: false })
  }, [search])

  const locations = [...new Set(requests.map(r => r.location).filter(Boolean))]

  const filtered = requests
    .filter(r => {
      const matchSearch = search === '' ||
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.subcategory?.toLowerCase().includes(search.toLowerCase())
      const matchCategory = selectedCategory === '' || r.category_id === selectedCategory
      const matchLocation = selectedLocation === '' || r.location === selectedLocation
      return matchSearch && matchCategory && matchLocation
    })
    .sort((a, b) => {
      if (sortBy === 'budget_asc') return a.budget - b.budget
      if (sortBy === 'budget_desc') return b.budget - a.budget
      return 0
    })

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedLocation('')
    setSortBy('newest')
  }

  const activeFilterCount = [selectedCategory, selectedLocation, sortBy !== 'newest' ? sortBy : ''].filter(Boolean).length
  const hasFilters = search || selectedCategory || selectedLocation || sortBy !== 'newest'

  return (
    <div className={styles.requests}>
      <div className={`container ${styles.requests__inner}`}>

        {/* Header */}
        <div className={styles.requests__header}>
          <div>
            <h1 className={styles.requests__title}>Förfrågningar</h1>
            <p className={styles.requests__subtitle}>{filtered.length} förfrågningar hittades</p>
          </div>
          <Link href="/create-request" className="btn btn-orange">
            + Skapa förfrågan
          </Link>
        </div>

        {/* Kategori-prenumerationer */}
        <CategorySubscriptions />

        {/* Sök & filter */}
        <div className={styles.requests__filters}>
          <div className={styles.requests__search}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Sök förfrågningar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.requests__search_input}
            />
            {search && <button className={styles.requests__clear_search} onClick={() => setSearch('')}>✕</button>}
          </div>

          {/* Desktop filter-rad */}
          <div className={styles.requests__filter_row}>
            <select className={styles.requests__select} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">Alla kategorier</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}
            </select>
            <select className={styles.requests__select} value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
              <option value="">Alla platser</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
            <select className={styles.requests__select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Nyast först</option>
              <option value="budget_asc">Lägst budget</option>
              <option value="budget_desc">Högst budget</option>
            </select>
            {hasFilters && <button className={styles.requests__clear_btn} onClick={clearFilters}>Rensa filter</button>}
          </div>

          {/* Mobil filter-knapp */}
          <div className={styles.requests__mobile_filter_row}>
            <button
              className={`${styles.requests__filter_btn} ${activeFilterCount > 0 ? styles['requests__filter_btn--active'] : ''}`}
              onClick={() => setShowFilterModal(true)}
            >
              🎛️ Filter
              {activeFilterCount > 0 && <span className={styles.requests__filter_badge}>{activeFilterCount}</span>}
            </button>
            {hasFilters && <button className={styles.requests__clear_btn} onClick={clearFilters}>Rensa</button>}
          </div>
        </div>

        {/* Aktiva filter-taggar */}
        {hasFilters && (
          <div className={styles.requests__active_filters}>
            {search && <span className={styles.requests__filter_tag}><Search size={12} /> &quot;{search}&quot;<button onClick={() => setSearch('')}>✕</button></span>}
            {selectedCategory && <span className={styles.requests__filter_tag}>{categories.find(c => c.id === selectedCategory)?.label}<button onClick={() => setSelectedCategory('')}>✕</button></span>}
            {selectedLocation && <span className={styles.requests__filter_tag}><MapPin size={12} /> {selectedLocation}<button onClick={() => setSelectedLocation('')}>✕</button></span>}
          </div>
        )}

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className={styles.requests__empty}>
            <p>Inga förfrågningar matchar din sökning.</p>
            <button className="btn btn-outline" onClick={clearFilters}>Rensa filter</button>
          </div>
        ) : (
          <div className={styles.requests__list}>
            {filtered.map(r => (
              <Link href={`/request/${r.id}`} key={r.id} className={`${styles.request_card} card`}>
                {r.image_url && (
                  <div className={styles.request_card__image}>
                    <img src={r.image_url} alt={r.title} />
                  </div>
                )}
                <div className={styles.request_card__content}>
                  <div className={styles.request_card__meta}>
                    <span className={styles.request_card__category}>{r.subcategory}</span>
                    <span className={styles.request_card__location} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {r.location}</span>
                  </div>
                  <h2 className={styles.request_card__title}>{r.title}</h2>
                  <p className={styles.request_card__description}>{r.description}</p>
                  <div className={styles.request_card__footer}>
                    <div className={styles.request_card__user}>
                      <div className={styles.request_card__avatar}>{r.user_name?.charAt(0).toUpperCase()}</div>
                      <span>{r.user_name}</span>
                    </div>
                    <div className={styles.request_card__budget}>
                      <span>Budget:</span>
                      <strong>{r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget} kr`}</strong>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>

      {/* Mobil filter-modal */}
      {showFilterModal && (
        <div className="modal-backdrop" onClick={() => setShowFilterModal(false)}>
          <div className={`modal-box ${styles.filter_modal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.filter_modal__header}>
              <h2>Filter</h2>
              <button onClick={() => setShowFilterModal(false)}>✕</button>
            </div>
            <div className={styles.filter_modal__body}>
              <div className={styles.filter_modal__group}>
                <label>Kategori</label>
                <select className={styles.requests__select} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="">Alla kategorier</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}
                </select>
              </div>
              <div className={styles.filter_modal__group}>
                <label>Plats</label>
                <select className={styles.requests__select} value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                  <option value="">Alla platser</option>
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className={styles.filter_modal__group}>
                <label>Sortera</label>
                <select className={styles.requests__select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Nyast först</option>
                  <option value="budget_asc">Lägst budget</option>
                  <option value="budget_desc">Högst budget</option>
                </select>
              </div>
            </div>
            <div className={styles.filter_modal__footer}>
              <button className="btn btn-outline" onClick={() => { clearFilters(); setShowFilterModal(false) }}>Rensa filter</button>
              <button className="btn btn-orange" onClick={() => setShowFilterModal(false)}>Visa {filtered.length} förfrågningar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}