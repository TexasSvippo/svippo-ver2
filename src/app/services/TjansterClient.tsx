'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { categories } from '@/data/categories'
import styles from './tjanster.module.scss'
import { MapPin, Star } from 'lucide-react'

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
  account_type: string
  avatar_url?: string
  rating: number
  reviews: number
}

type Props = {
  services: Service[]
}

const WORD_LIMIT = 20

const categoryDescriptions: Record<string, string> = {
  'digitala-tjanster': 'Hitta experter inom webb, app och IT och få hjälp med ditt digitala projekt idag.',
  'medie-design':      'Ge ditt varumärke ett lyft och anlita kreatörer inom design, foto och innehåll.',
  'utbildning':        'Lär dig något nytt eller få hjälp att nå dina mål och hitta din perfekta lärare.',
  'hushall':           'Få mer tid till det som betyder något och boka hjälp med hem och vardag.',
  'bil':               'Håll bilen i toppskick och hitta pålitlig hjälp med service, tvätt och transport.',
  'skonhet-halsa':     'Ta hand om dig själv och boka behandlingar inom skönhet, hälsa och träning.',
  'bygg-hantverk':     'Förverkliga ditt byggprojekt och anlita hantverkare du kan lita på.',
  'frakt-flytt':       'Flytta smidigt och stressfritt och hitta hjälp med transport och flytt nära dig.',
}

const DEFAULT_DESC = 'Svippo kopplar ihop dig med kvalificerade utförare inom hundratals kategorier.'

function truncate(text: string, limit: number) {
  if (!text) return ''
  const words = text.split(' ')
  if (words.length <= limit) return text
  return words.slice(0, limit).join(' ') + '...'
}

function getCardStyle(accountType: string) {
  if (accountType === 'foretag') return styles['service_card--foretag']
  if (accountType === 'uf-foretag') return styles['service_card--uf']
  return styles['service_card--svippare']
}

function getAvatarStyle(accountType: string) {
  if (accountType === 'foretag') return styles['service_card__avatar--foretag']
  if (accountType === 'uf-foretag') return styles['service_card__avatar--uf']
  return styles['service_card__avatar--svippare']
}

function getBadgeStyle(accountType: string) {
  if (accountType === 'foretag') return styles['service_card__badge--foretag']
  if (accountType === 'uf-foretag') return styles['service_card__badge--uf']
  return styles['service_card__badge--svippare']
}

function getBadgeLabel(accountType: string) {
  if (accountType === 'foretag') return 'Företag'
  if (accountType === 'uf-foretag') return 'UF företag'
  return 'Svippare'
}

export default function TjansterClient({ services }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const selectedCategory    = searchParams.get('kategori')     ?? ''
  const selectedSubcategory = searchParams.get('underkategori') ?? ''
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')

  const categoryLabel = categories.find(c => c.id === selectedCategory)?.label ?? ''

  const buildUrl = (cat: string, sub: string, srch: string) => {
    const params = new URLSearchParams()
    if (srch) params.set('search', srch)
    if (cat)  params.set('kategori', cat)
    if (sub)  params.set('underkategori', sub)
    return params.toString() ? `/services?${params.toString()}` : '/services'
  }

  const selectCategory = (catId: string) =>
    router.replace(buildUrl(catId, '', search), { scroll: false })

  const selectSubcategory = (sub: string) =>
    router.replace(buildUrl(selectedCategory, sub, search), { scroll: false })

  useEffect(() => {
    router.replace(buildUrl(selectedCategory, selectedSubcategory, search), { scroll: false })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const locations = [...new Set(services.map(s => s.location).filter(Boolean))]

  const filtered = services
    .filter(s => {
      const matchSearch = search === '' ||
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.subcategory?.toLowerCase().includes(search.toLowerCase())
      const matchCategory    = selectedCategory    === '' || s.category_id === selectedCategory
      const matchSubcategory = selectedSubcategory === '' || s.subcategory === selectedSubcategory
      const matchLocation    = selectedLocation    === '' || s.location    === selectedLocation
      const matchPrice       = maxPrice === '' || s.price_type === 'offert' || s.price <= Number(maxPrice)
      return matchSearch && matchCategory && matchSubcategory && matchLocation && matchPrice
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      if (sortBy === 'rating')     return (b.rating || 0) - (a.rating || 0)
      return 0
    })

  const clearFilters = () => {
    setSearch('')
    router.replace('/services', { scroll: false })
    setSelectedLocation('')
    setSortBy('newest')
    setMaxPrice('')
  }

  const hasFilters = search || selectedCategory || selectedSubcategory || selectedLocation || sortBy !== 'newest' || maxPrice
  const activeFilterCount = [selectedCategory, selectedSubcategory, selectedLocation, sortBy !== 'newest' ? sortBy : '', maxPrice].filter(Boolean).length

  return (
    <div className={styles.tjanster}>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className={styles.tjanster__hero}>
        <div className={styles.tjanster__hero_inner}>
          <div className={styles.tjanster__hero_card}>

            {/* Breadcrumbs */}
            <nav className={styles.tjanster__hero_bc}>
              <Link href="/" className={styles.tjanster__hero_bc_link}>Hem</Link>
              <span className={styles.tjanster__hero_bc_sep}>/</span>
              {selectedCategory ? (
                <>
                  <Link href="/services" className={styles.tjanster__hero_bc_link}>Tjänster</Link>
                  <span className={styles.tjanster__hero_bc_sep}>/</span>
                  <span className={styles.tjanster__hero_bc_active}>{categoryLabel}</span>
                </>
              ) : (
                <span className={styles.tjanster__hero_bc_active}>Tjänster</span>
              )}
            </nav>

            {/* H1 */}
            <h1 className={styles.tjanster__hero_title}>
              {selectedCategory ? categoryLabel : 'Tjänster'}
            </h1>

            {/* Kategoribeskrivning */}
            <p className={styles.tjanster__hero_desc}>
              {categoryDescriptions[selectedCategory] ?? DEFAULT_DESC}
            </p>

            {/* Sökfält */}
            <div className={styles.tjanster__hero_search}>
              <input
                type="text"
                className={styles.tjanster__hero_search_input}
                placeholder="Sök efter en tjänst..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && router.push(buildUrl(selectedCategory, selectedSubcategory, search))}
              />
              <button
                type="button"
                className={styles.tjanster__hero_search_btn}
                onClick={() => router.push(buildUrl(selectedCategory, selectedSubcategory, search))}
              >
                Sök
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Innehåll under hero ─────────────────────────────────── */}
      <div className={`container ${styles.tjanster__inner}`}>

        {/* Kategorier */}
        {!selectedCategory && (
          <div className={styles.tjanster__categories}>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={styles.tjanster__category_btn}
                onClick={() => selectCategory(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Underkategorier */}
        {selectedCategory && (
          <>
            <div className={styles.tjanster__subcategory_header}>
              <p className={styles.tjanster__subcategories_heading}>Förfina din sökning</p>
              <button
                className={`${styles.tjanster__filter_btn_compact} ${activeFilterCount > 0 ? styles['tjanster__filter_btn_compact--active'] : ''}`}
                onClick={() => setShowFilterModal(true)}
              >
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            </div>
            <div className={styles.tjanster__subcategories}>
              <button
                className={`${styles.tjanster__sub_pill} ${selectedSubcategory === '' ? styles['tjanster__sub_pill--active'] : ''}`}
                onClick={() => selectSubcategory('')}
              >
                Alla
              </button>
              {categories.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                <button
                  key={sub}
                  className={`${styles.tjanster__sub_pill} ${selectedSubcategory === sub ? styles['tjanster__sub_pill--active'] : ''}`}
                  onClick={() => selectSubcategory(sub)}
                >
                  {sub}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Aktiva filter-taggar */}
        {hasFilters && (
          <div className={styles.tjanster__active_filters}>
            {search         && <span className={styles.tjanster__filter_tag}>&quot;{search}&quot;<button onClick={() => setSearch('')}>✕</button></span>}
            {selectedCategory && <span className={styles.tjanster__filter_tag}>{categoryLabel}<button onClick={() => selectCategory('')}>✕</button></span>}
            {selectedSubcategory && <span className={styles.tjanster__filter_tag}>{selectedSubcategory}<button onClick={() => selectSubcategory('')}>✕</button></span>}
            {selectedLocation    && <span className={styles.tjanster__filter_tag}><MapPin size={12} /> {selectedLocation}<button onClick={() => setSelectedLocation('')}>✕</button></span>}
            {maxPrice            && <span className={styles.tjanster__filter_tag}>Pris: {maxPrice}kr<button onClick={() => setMaxPrice('')}>✕</button></span>}
            <button className={styles.tjanster__clear_btn} onClick={clearFilters}>Rensa alla</button>
          </div>
        )}

        {/* Huvud-layout: tjänster + filter */}
        <div className={styles.tjanster__layout}>

          {/* Tjänstelista */}
          <div className={styles.tjanster__content}>
            <p className={styles.tjanster__count}>Visar {filtered.length} inlägg</p>

            {filtered.length === 0 ? (
              <div className={styles.tjanster__empty}>
                <p>Inga tjänster matchar din sökning.</p>
                <button className="btn btn-outline" onClick={clearFilters}>Rensa filter</button>
              </div>
            ) : (
              <div className={styles.tjanster__list}>
                {filtered.map(s => (
                  <Link
                    href={`/service/${s.id}`}
                    key={s.id}
                    className={`${styles.service_card} ${getCardStyle(s.account_type)}`}
                  >
                    <div className={styles.service_card__top}>
                      <div className={styles.service_card__header}>
                        <div className={`${styles.service_card__avatar} ${getAvatarStyle(s.account_type)}`}>
                          {s.avatar_url
                            ? <img src={s.avatar_url} alt={s.user_name} className={styles.service_card__avatar_img} />
                            : s.user_name?.charAt(0).toUpperCase() || '?'
                          }
                        </div>
                        <div className={styles.service_card__meta}>
                          <div className={styles.service_card__meta_row}>
                            <span className={styles.service_card__name}>{s.user_name}</span>
                            <span className={styles.service_card__dot}>·</span>
                            <span className={styles.star_rating} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Star size={14} /> <strong>{s.rating || '–'}</strong></span>
                            <span className={styles.service_card__reviews}>({s.reviews})</span>
                            <span className={styles.service_card__dot}>·</span>
                            <span className={styles.service_card__location}>{s.location}</span>
                          </div>
                          <h3 className={styles.service_card__title}>{s.title}</h3>
                        </div>
                        <button className={styles.service_card__more}>···</button>
                      </div>

                      {s.description && (
                        <p className={styles.service_card__description}>
                          {truncate(s.description, WORD_LIMIT)}
                        </p>
                      )}
                    </div>

                    <div className={styles.service_card__footer}>
                      <div className={styles.service_card__badges}>
                        <span className={`${styles.service_card__badge} ${getBadgeStyle(s.account_type)}`}>
                          {getBadgeLabel(s.account_type)}
                        </span>
                        <span className={styles.service_card__subcategory_badge}>{s.subcategory}</span>
                      </div>
                      <div className={styles.service_card__price}>
                        <span className={styles.service_card__price_from}>
                          {s.price_type === 'offert' ? '' : 'från'}
                        </span>
                        <strong className={styles.service_card__price_value}>
                          {s.price_type === 'offert' ? 'Offert' : `${s.price}kr`}
                        </strong>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Filter-panel – höger sida */}
          <aside className={styles.tjanster__filter_panel}>
            <div className={styles.filter_panel__inner}>
              <h2 className={styles.filter_panel__title}>Filter</h2>

              {maxPrice && (
                <div className={styles.filter_panel__active_tag}>
                  Pris: {maxPrice}kr <button onClick={() => setMaxPrice('')}>✕</button>
                </div>
              )}

              <div className={styles.filter_panel__group}>
                <label className={styles.filter_panel__label}>Kategorier</label>
                <div className={styles.filter_panel__search_wrap}>
                  <input className={styles.filter_panel__search} placeholder="Sök efter kategori" onChange={() => {}} />
                </div>
                <div className={styles.filter_panel__checkboxes}>
                  {categories.map(cat => (
                    <label key={cat.id} className={styles.filter_panel__checkbox_label}>
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat.id}
                        onChange={() => selectCategory(selectedCategory === cat.id ? '' : cat.id)}
                      />
                      <span>{cat.icon} {cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedCategory && (
                <div className={styles.filter_panel__group}>
                  <label className={styles.filter_panel__label}>Underkategori</label>
                  <div className={styles.filter_panel__checkboxes}>
                    {categories.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                      <label key={sub} className={styles.filter_panel__checkbox_label}>
                        <input
                          type="checkbox"
                          checked={selectedSubcategory === sub}
                          onChange={() => selectSubcategory(selectedSubcategory === sub ? '' : sub)}
                        />
                        <span>{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.filter_panel__group}>
                <label className={styles.filter_panel__label}>Plats</label>
                <select className={styles.filter_panel__select} value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                  <option value="">Alla platser</option>
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              <div className={styles.filter_panel__group}>
                <label className={styles.filter_panel__label}>Max pris (kr)</label>
                <input
                  className={styles.filter_panel__input}
                  type="number"
                  placeholder="T.ex. 2000"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                />
              </div>

              <div className={styles.filter_panel__group}>
                <label className={styles.filter_panel__label}>Sortera</label>
                <select className={styles.filter_panel__select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Nyast först</option>
                  <option value="price_asc">Lägst pris</option>
                  <option value="price_desc">Högst pris</option>
                  <option value="rating">Bäst betyg</option>
                </select>
              </div>

              <button className={`btn btn-primary ${styles.filter_panel__btn}`} onClick={() => {}}>Filtrera</button>

              {hasFilters && (
                <button className={styles.filter_panel__clear} onClick={clearFilters}>Rensa filter</button>
              )}
            </div>
          </aside>

        </div>
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
                <select className={styles.filter_panel__select} value={selectedCategory} onChange={e => selectCategory(e.target.value)}>
                  <option value="">Alla kategorier</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}
                </select>
              </div>
              {selectedCategory && (
                <div className={styles.filter_modal__group}>
                  <label>Underkategori</label>
                  <select className={styles.filter_panel__select} value={selectedSubcategory} onChange={e => selectSubcategory(e.target.value)}>
                    <option value="">Alla underkategorier</option>
                    {categories.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={styles.filter_modal__group}>
                <label>Plats</label>
                <select className={styles.filter_panel__select} value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                  <option value="">Alla platser</option>
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <div className={styles.filter_modal__group}>
                <label>Max pris (kr)</label>
                <input className={styles.filter_panel__input} type="number" placeholder="T.ex. 2000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
              <div className={styles.filter_modal__group}>
                <label>Sortera</label>
                <select className={styles.filter_panel__select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Nyast först</option>
                  <option value="price_asc">Lägst pris</option>
                  <option value="price_desc">Högst pris</option>
                  <option value="rating">Bäst betyg</option>
                </select>
              </div>
            </div>
            <div className={styles.filter_modal__footer}>
              <button className="btn btn-outline" onClick={() => { clearFilters(); setShowFilterModal(false) }}>Rensa filter</button>
              <button className="btn btn-primary" onClick={() => setShowFilterModal(false)}>Visa {filtered.length} tjänster</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobil filter-knapp */}
      <div className={styles.tjanster__mobile_filter_bar}>
        <button
          className={`${styles.tjanster__filter_btn} ${activeFilterCount > 0 ? styles['tjanster__filter_btn--active'] : ''}`}
          onClick={() => setShowFilterModal(true)}
        >
          🎛️ Filter
          {activeFilterCount > 0 && <span className={styles.tjanster__filter_badge}>{activeFilterCount}</span>}
        </button>
        {hasFilters && <button className={styles.tjanster__clear_btn} onClick={clearFilters}>Rensa</button>}
      </div>

    </div>
  )
}
