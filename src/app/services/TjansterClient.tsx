'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { categories } from '@/data/categories'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './tjanster.module.scss'
import { MapPin, Star, Share2, Flag, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import AdCard from '@/components/AdCard'

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

type Props = { services: Service[] }

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncate(text: string, limit: number) {
  if (!text) return ''
  const plain = stripHtml(text)
  const words = plain.split(' ')
  return words.length <= limit ? plain : words.slice(0, limit).join(' ') + '...'
}
function getCardStyle(t: string) {
  if (t === 'foretag') return styles['service_card--foretag']
  if (t === 'uf-foretag') return styles['service_card--uf']
  return styles['service_card--svippare']
}
function getAvatarStyle(t: string) {
  if (t === 'foretag') return styles['service_card__avatar--foretag']
  if (t === 'uf-foretag') return styles['service_card__avatar--uf']
  return styles['service_card__avatar--svippare']
}
function getBadgeStyle(t: string) {
  if (t === 'foretag') return styles['service_card__badge--foretag']
  if (t === 'uf-foretag') return styles['service_card__badge--uf']
  return styles['service_card__badge--svippare']
}
function getBadgeLabel(t: string) {
  if (t === 'foretag') return 'Företag'
  if (t === 'uf-foretag') return 'UF företag'
  return 'Svippare'
}

const REPORT_REASONS = ['Felaktig information', 'Olämpligt innehåll', 'Spam', 'Annat']

export default function TjansterClient({ services }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const selectedCategory    = searchParams.get('kategori')     ?? ''
  const selectedSubcategory = searchParams.get('underkategori') ?? ''
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [maxPrice, setMaxPrice] = useState('')

  // Popup menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // Toast
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Report modal
  const [reportServiceId, setReportServiceId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportSending, setReportSending] = useState(false)

  const categoryLabel = categories.find(c => c.id === selectedCategory)?.label ?? ''

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2500)
  }

  const buildUrl = (cat: string, sub: string, srch: string) => {
    const p = new URLSearchParams()
    if (srch) p.set('search', srch)
    if (cat)  p.set('kategori', cat)
    if (sub)  p.set('underkategori', sub)
    return p.toString() ? `/services?${p.toString()}` : '/services'
  }

  const selectCategory    = (id: string)  => router.replace(buildUrl(id, '', search), { scroll: false })
  const selectSubcategory = (sub: string) => router.replace(buildUrl(selectedCategory, sub, search), { scroll: false })

  // ── Effects ────────────────────────────────────────────────────────────────

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { router.replace(buildUrl(selectedCategory, selectedSubcategory, search), { scroll: false }) }, [search])

  // Close popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-card-menu]')) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Data ───────────────────────────────────────────────────────────────────

  const locations = [...new Set(services.map(s => s.location).filter(Boolean))]

  const filtered = services
    .filter(s => !deletedIds.has(s.id))
    .filter(s => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        s.title?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.subcategory?.toLowerCase().includes(q)
      return (
        matchSearch &&
        (!selectedCategory    || s.category_id === selectedCategory) &&
        (!selectedSubcategory || s.subcategory  === selectedSubcategory) &&
        (!selectedLocation    || s.location     === selectedLocation) &&
        (!maxPrice            || s.price_type === 'offert' || s.price <= Number(maxPrice))
      )
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

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleShare = (e: React.MouseEvent, serviceId: string) => {
    e.preventDefault(); e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/service/${serviceId}`)
    showToast('Länk kopierad!')
    setOpenMenuId(null)
  }

  const handleDelete = async (e: React.MouseEvent, serviceId: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Är du säker på att du vill ta bort detta inlägg?')) return
    const { error } = await supabase.from('services').delete().eq('id', serviceId)
    if (!error) {
      setDeletedIds(prev => new Set([...prev, serviceId]))
      showToast('Inlägget togs bort')
    }
    setOpenMenuId(null)
  }

  const handleMessage = async (e: React.MouseEvent, sellerId: string) => {
    e.preventDefault(); e.stopPropagation()
    if (!user) { router.push('/login'); return }
    const check = async (p1: string, p2: string) => {
      const { data } = await supabase.from('conversations').select('id').eq('participant_1_id', p1).eq('participant_2_id', p2).limit(1)
      return data?.[0]?.id ?? null
    }
    const existing = (await check(user.id, sellerId)) ?? (await check(sellerId, user.id))
    if (existing) { router.push(`/messages/${existing}`); return }
    const { data: conv } = await supabase.from('conversations').insert({
      type: 'inquiry', anchor_type: 'listing', anchor_id: sellerId,
      participant_1_id: user.id, participant_2_id: sellerId,
      created_at: new Date().toISOString(),
    }).select().single()
    if (conv) router.push(`/messages/${conv.id}`)
    setOpenMenuId(null)
  }

  const handleReport = async () => {
    if (!reportReason || !reportServiceId) return
    setReportSending(true)
    await supabase.from('notifications').insert({
      user_id: user?.id ?? null,
      type: 'report',
      message: `Rapporterat tjänst: ${reportReason}`,
      action_url: `/service/${reportServiceId}`,
      order_id: reportServiceId,
      read: false, dismissed: false, email_sent: false,
      created_at: new Date().toISOString(),
    })
    setReportSending(false)
    setReportServiceId(null)
    setReportReason('')
    showToast('Inlägg rapporterat – tack!')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.tjanster}>

      {/* Hero */}
      <div className={styles.tjanster__hero}>
        <div className={styles.tjanster__hero_inner}>
          <div className={styles.tjanster__hero_card}>
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
            <h1 className={styles.tjanster__hero_title}>{selectedCategory ? categoryLabel : 'Tjänster'}</h1>
            <p className={styles.tjanster__hero_desc}>{categoryDescriptions[selectedCategory] ?? DEFAULT_DESC}</p>
            <div className={styles.tjanster__hero_search}>
              <input
                type="text"
                className={styles.tjanster__hero_search_input}
                placeholder="Sök efter en tjänst..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && router.push(buildUrl(selectedCategory, selectedSubcategory, search))}
              />
              <button type="button" className={styles.tjanster__hero_search_btn}
                onClick={() => router.push(buildUrl(selectedCategory, selectedSubcategory, search))}>
                Sök
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Innehåll */}
      <div className={`container ${styles.tjanster__inner}`}>

        {!selectedCategory && (
          <div className={styles.tjanster__categories}>
            {categories.map(cat => (
              <button key={cat.id} className={styles.tjanster__category_btn} onClick={() => selectCategory(cat.id)}>
                <span>{cat.icon}</span><span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

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
              <button className={`${styles.tjanster__sub_pill} ${!selectedSubcategory ? styles['tjanster__sub_pill--active'] : ''}`} onClick={() => selectSubcategory('')}>Alla</button>
              {categories.find(c => c.id === selectedCategory)?.subcategories.map(sub => (
                <button key={sub} className={`${styles.tjanster__sub_pill} ${selectedSubcategory === sub ? styles['tjanster__sub_pill--active'] : ''}`} onClick={() => selectSubcategory(sub)}>{sub}</button>
              ))}
            </div>
          </>
        )}

        {hasFilters && (
          <div className={styles.tjanster__active_filters}>
            {search            && <span className={styles.tjanster__filter_tag}>&quot;{search}&quot;<button onClick={() => setSearch('')}>✕</button></span>}
            {selectedCategory  && <span className={styles.tjanster__filter_tag}>{categoryLabel}<button onClick={() => selectCategory('')}>✕</button></span>}
            {selectedSubcategory && <span className={styles.tjanster__filter_tag}>{selectedSubcategory}<button onClick={() => selectSubcategory('')}>✕</button></span>}
            {selectedLocation  && <span className={styles.tjanster__filter_tag}><MapPin size={12} /> {selectedLocation}<button onClick={() => setSelectedLocation('')}>✕</button></span>}
            {maxPrice          && <span className={styles.tjanster__filter_tag}>Pris: {maxPrice}kr<button onClick={() => setMaxPrice('')}>✕</button></span>}
            <button className={styles.tjanster__clear_btn} onClick={clearFilters}>Rensa alla</button>
          </div>
        )}

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
                {filtered.flatMap((s, idx) => {
                  const adInsertAfter = filtered.length >= 3 ? 2 : filtered.length - 1
                  const card = (
                  <Link href={`/service/${s.id}`} key={s.id} className={`${styles.service_card} ${getCardStyle(s.account_type)}`}>
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
                            <span className={styles.star_rating} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {s.rating ? <Star size={14} fill="#EF9F27" color="#EF9F27" /> : null}
                              <strong>{s.rating || '–'}</strong>
                            </span>
                            <span className={styles.service_card__reviews}>({s.reviews})</span>
                            <span className={styles.service_card__dot}>·</span>
                            <span className={styles.service_card__location}>{s.location}</span>
                          </div>
                          <h3 className={styles.service_card__title}>{s.title}</h3>
                        </div>

                        {/* ··· popup trigger */}
                        <div className={styles.service_card__more_wrap} data-card-menu>
                          <button
                            className={styles.service_card__more}
                            onClick={e => {
                              e.preventDefault(); e.stopPropagation()
                              setOpenMenuId(prev => prev === s.id ? null : s.id)
                            }}
                          >···</button>

                          {openMenuId === s.id && (
                            <div className={styles.card_popup}>
                              <button className={styles.card_popup__item} onClick={e => handleShare(e, s.id)}>
                                <Share2 size={15} /> Dela inlägg
                              </button>
                              <button className={styles.card_popup__item} onClick={e => {
                                e.preventDefault(); e.stopPropagation()
                                setReportServiceId(s.id); setOpenMenuId(null)
                              }}>
                                <Flag size={15} /> Rapportera inlägg
                              </button>
                              {user && user.id !== s.user_id && (
                                <button className={styles.card_popup__item} onClick={e => handleMessage(e, s.user_id)}>
                                  <MessageCircle size={15} /> Skicka meddelande
                                </button>
                              )}
                              {user && user.id === s.user_id && (
                                <button className={styles.card_popup__item} onClick={e => {
                                  e.preventDefault(); e.stopPropagation()
                                  router.push(`/create-service?edit=${s.id}`); setOpenMenuId(null)
                                }}>
                                  <Pencil size={15} /> Redigera inlägg
                                </button>
                              )}
                              {user && user.id === s.user_id && (
                                <button className={`${styles.card_popup__item} ${styles['card_popup__item--danger']}`} onClick={e => handleDelete(e, s.id)}>
                                  <Trash2 size={15} /> Ta bort inlägg
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {s.description && (
                        <p className={styles.service_card__description}>{truncate(s.description, WORD_LIMIT)}</p>
                      )}
                    </div>

                    <div className={styles.service_card__footer}>
                      <div className={styles.service_card__badges}>
                        <span className={`${styles.service_card__badge} ${getBadgeStyle(s.account_type)}`}>{getBadgeLabel(s.account_type)}</span>
                        <span className={styles.service_card__subcategory_badge}>{s.subcategory}</span>
                      </div>
                      <div className={styles.service_card__price}>
                        <span className={styles.service_card__price_from}>{s.price_type === 'offert' ? '' : 'från'}</span>
                        <strong className={styles.service_card__price_value}>{s.price_type === 'offert' ? 'Offert' : `${s.price}kr`}</strong>
                      </div>
                    </div>
                  </Link>
                  )
                  if (idx === adInsertAfter) return [card, <AdCard key="ad-card" />]
                  return [card]
                })}
              </div>
            )}
          </div>

          {/* Filter-panel */}
          <aside className={styles.tjanster__filter_panel}>
            <div className={styles.filter_panel__inner}>
              <h2 className={styles.filter_panel__title}>Filter</h2>
              {maxPrice && <div className={styles.filter_panel__active_tag}>Pris: {maxPrice}kr <button onClick={() => setMaxPrice('')}>✕</button></div>}
              <div className={styles.filter_panel__group}>
                <label className={styles.filter_panel__label}>Kategorier</label>
                <div className={styles.filter_panel__search_wrap}>
                  <input className={styles.filter_panel__search} placeholder="Sök efter kategori" onChange={() => {}} />
                </div>
                <div className={styles.filter_panel__checkboxes}>
                  {categories.map(cat => (
                    <label key={cat.id} className={styles.filter_panel__checkbox_label}>
                      <input type="checkbox" checked={selectedCategory === cat.id} onChange={() => selectCategory(selectedCategory === cat.id ? '' : cat.id)} />
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
                        <input type="checkbox" checked={selectedSubcategory === sub} onChange={() => selectSubcategory(selectedSubcategory === sub ? '' : sub)} />
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
                <input className={styles.filter_panel__input} type="number" placeholder="T.ex. 2000" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
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
              {hasFilters && <button className={styles.filter_panel__clear} onClick={clearFilters}>Rensa filter</button>}
            </div>
          </aside>

        </div>
      </div>

      {/* Filter-modal (mobil) */}
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
                    {categories.find(c => c.id === selectedCategory)?.subcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
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
          🎛️ Filter{activeFilterCount > 0 && <span className={styles.tjanster__filter_badge}>{activeFilterCount}</span>}
        </button>
        {hasFilters && <button className={styles.tjanster__clear_btn} onClick={clearFilters}>Rensa</button>}
      </div>

      {/* Rapporteringsmodal */}
      {reportServiceId && (
        <div className={styles.report_overlay} onClick={() => setReportServiceId(null)}>
          <div className={styles.report_modal} onClick={e => e.stopPropagation()}>
            <div className={styles.report_modal__header}>
              <h2>Rapportera inlägg</h2>
              <button onClick={() => setReportServiceId(null)}>✕</button>
            </div>
            <div className={styles.report_modal__body}>
              {REPORT_REASONS.map(reason => (
                <label key={reason} className={styles.report_modal__option}>
                  <input
                    type="radio"
                    name="report_reason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={e => setReportReason(e.target.value)}
                  />
                  {reason}
                </label>
              ))}
            </div>
            <div className={styles.report_modal__footer}>
              <button className="btn btn-outline" onClick={() => setReportServiceId(null)}>Avbryt</button>
              <button className="btn btn-primary" onClick={handleReport} disabled={!reportReason || reportSending}>
                {reportSending ? 'Skickar...' : 'Skicka rapport'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}

    </div>
  )
}
