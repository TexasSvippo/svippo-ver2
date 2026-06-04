'use client'

import OrderModal from '@/components/OrderModal'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import styles from './servicedetail.module.scss'
import refStyles from './references.module.scss'
import { CheckCircle, Star, User, Wallet, Pencil, Trash2, Lock, MessageCircle, Shield, ChevronLeft, ChevronRight, Flag, MapPin } from 'lucide-react'
import { renderStars } from '@/utils/renderStars'

type CustomQuestion = {
  id: string
  label: string
  type: 'text' | 'select' | 'textarea'
  options?: string[]
  required: boolean
}

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
  user_email: string
  user_id: string
  avatar_url?: string
  service_type?: 'typ1' | 'typ2' | 'typ3'
  rating: number
  reviews: number
  custom_questions?: CustomQuestion[]
  offers_rut?: boolean
  offers_rot?: boolean
}

type Review = {
  id: string
  rating: number
  comment: string
  reviewer_name: string
  created_at: string
  service_id: string
}

type ServiceReference = {
  id: string
  image_url: string
  title: string
  description?: string
  sort_order: number
}

type Props = {
  service: Service
  reviews: Review[]
  avgRating: number | null
  references?: ServiceReference[]
  bio?: string | null
}

export default function ServiceDetailClient({ service, reviews, avgRating, references = [], bio }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Description expand/collapse ───────────────────────────────────────────
  const [expanded, setExpanded] = useState(false)
  // Strip tags to measure actual text length (description may contain HTML from TipTap)
  const descTextLength = service.description
    ? service.description.replace(/<[^>]*>/g, '').length
    : 0
  const descLong = descTextLength > 280

  // ── References slideshow ──────────────────────────────────────────────────
  const refContainerRef = useRef<HTMLDivElement>(null)
  const [refIndex, setRefIndex] = useState(0)
  const [activeRef, setActiveRef] = useState<ServiceReference | null>(null)

  const getRefStep = useCallback(() => {
    const track = refContainerRef.current?.firstElementChild as HTMLElement | null
    const c0 = track?.children[0] as HTMLElement | undefined
    const c1 = track?.children[1] as HTMLElement | undefined
    if (c0 && c1) return c1.getBoundingClientRect().left - c0.getBoundingClientRect().left
    return c0?.getBoundingClientRect().width ?? 0
  }, [])

  const refPrev = () => refContainerRef.current?.scrollBy({ left: -getRefStep(), behavior: 'smooth' })
  const refNext = () => refContainerRef.current?.scrollBy({ left: getRefStep(), behavior: 'smooth' })

  const handleRefScroll = useCallback(() => {
    const el = refContainerRef.current
    const step = getRefStep()
    if (!el || step === 0) return
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
      setRefIndex(references.length - 1); return
    }
    setRefIndex(Math.round(el.scrollLeft / step))
  }, [getRefStep, references.length])

  // ── Order / contact state ─────────────────────────────────────────────────
  const [showOrder, setShowOrder] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [inProgressCount, setInProgressCount] = useState(0)
  const [matchingCerts, setMatchingCerts] = useState<{ id: string; name: string; file_url: string }[]>([])

  const [activeTab, setActiveTab] = useState<string>('om-tjansten')

  // ── Reviews filter + pagination ───────────────────────────────────────────
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(5)
  const filteredReviews = ratingFilter === null ? reviews : reviews.filter(r => r.rating === ratingFilter)
  const visibleReviews = filteredReviews.slice(0, visibleCount)
  const hasMoreReviews = filteredReviews.length > visibleCount

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const isOwner = user?.id === service.user_id
  const shouldAutoOpen = searchParams.get('order') === 'true' && !isOwner

  useEffect(() => {
    if (shouldAutoOpen && user) {
      const timer = setTimeout(() => setShowOrder(true), 0)
      return () => clearTimeout(timer)
    }
  }, [shouldAutoOpen, user])

  useEffect(() => {
    if (!isOwner) return
    supabase
      .from('orders')
      .select('id, status, project_status')
      .eq('service_id', service.id)
      .then(({ data }) => {
        if (data) {
          setActiveOrdersCount(data.filter(o => o.status === 'accepted').length)
          setInProgressCount(data.filter(o =>
            o.project_status === 'in_progress' || o.project_status === 'almost_done'
          ).length)
        }
      })
  }, [isOwner, service.id])

  useEffect(() => {
    supabase
      .from('certificates')
      .select('id, name, file_url')
      .eq('user_id', service.user_id)
      .eq('subcategory', service.subcategory)
      .then(({ data }) => setMatchingCerts(data ?? []))
  }, [service.user_id, service.subcategory])

  const handleDelete = async () => {
    if (inProgressCount > 0) return
    const msg = activeOrdersCount > 0
      ? `Du har ${activeOrdersCount} aktiv(a) beställning(ar) på denna tjänst. Är du säker?`
      : 'Är du säker på att du vill ta bort denna tjänst?'
    if (!confirm(msg)) return
    setDeleting(true)
    await supabase.from('services').delete().eq('id', service.id)
    router.push('/profile')
  }

  const handleContact = async () => {
    if (!user) { setShowLoginPrompt(true); return }
    if (user.id === service.user_id) return

    const check = async (p1: string, p2: string) => {
      const { data } = await supabase
        .from('conversations').select('id')
        .eq('anchor_id', service.id).eq('participant_1_id', p1).eq('participant_2_id', p2).limit(1)
      return data?.[0]?.id ?? null
    }
    const existing = (await check(user.id, service.user_id)) ?? (await check(service.user_id, user.id))
    if (existing) { router.push(`/messages/${existing}`); return }

    const { data: newConv } = await supabase.from('conversations').insert({
      type: 'inquiry', anchor_type: 'listing', anchor_id: service.id,
      assignment_id: null, participant_1_id: user.id, participant_2_id: service.user_id,
      created_at: new Date().toISOString(),
    }).select().single()
    if (newConv) router.push(`/messages/${newConv.id}`)
  }

  return (
    <div className={styles.page}>

      {/* Breadcrumbs */}
      <nav className={styles.breadcrumb}>
        <Link href="/">Hem</Link>
        <span>·</span>
        <Link href="/services">Tjänster</Link>
        <span>·</span>
        <span>{service.title}</span>
      </nav>

      {/* Mobile-only: badges + title shown ABOVE the grid so they appear before sidebar */}
      <div className={styles.main_header}>
        <div className={styles.badges}>
          <span className={styles.badge}>{service.subcategory}</span>
          {service.offers_rut && (
            <span className={`${styles.badge} ${styles['badge--rut']}`}><CheckCircle size={13} /> RUT-avdrag</span>
          )}
          {service.offers_rot && (
            <span className={`${styles.badge} ${styles['badge--rot']}`}><CheckCircle size={13} /> ROT-avdrag</span>
          )}
        </div>
        <h1 className={styles.title}>{service.title}</h1>
        <div className={styles.meta_row}>
          <span className={styles.meta_item}>
            <MapPin size={14} /> från {service.location}
          </span>
          {(avgRating ?? service.rating) ? (
            <span className={styles.meta_item}>
              <Star size={14} fill="#EF9F27" color="#EF9F27" /> {avgRating ?? service.rating} {reviews.length} omdömen
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.layout}>

        {/* ── LEFT: main content ──────────────────────────────────────────── */}
        <div className={styles.main}>

          {/* Desktop-only: badges + title (hidden on mobile — shown in main_header above) */}
          <div className={styles.main_body_header}>
            <div className={styles.badges}>
              <span className={styles.badge}>{service.subcategory}</span>
              {service.offers_rut && (
                <span className={`${styles.badge} ${styles['badge--rut']}`}>
                  <CheckCircle size={13} /> RUT-avdrag
                </span>
              )}
              {service.offers_rot && (
                <span className={`${styles.badge} ${styles['badge--rot']}`}>
                  <CheckCircle size={13} /> ROT-avdrag
                </span>
              )}
            </div>
            <h1 className={styles.title}>{service.title}</h1>
            <div className={styles.meta_row}>
              <span className={styles.meta_item}>
                <MapPin size={14} /> från {service.location}
              </span>
              {(avgRating ?? service.rating) ? (
                <span className={styles.meta_item}>
                  <Star size={14} fill="#EF9F27" color="#EF9F27" /> {avgRating ?? service.rating} {reviews.length} omdömen
                </span>
              ) : null}
            </div>
          </div>

          {/* Tab navigation */}
          <div className={styles.tabs}>
            {[
              { id: 'om-tjansten', label: 'Om tjänsten' },
              { id: 'referenser',  label: 'Referenser'  },
              { id: 'omdomen',     label: 'Omdömen'     },
              { id: 'om-oss',      label: 'Om oss'      },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${activeTab === tab.id ? styles['tab--active'] : ''}`}
                onClick={() => { setActiveTab(tab.id); scrollToSection(tab.id) }}
              >
                {tab.label}
              </button>
            ))}
            <button type="button" className={styles.tab_report}>
              <Flag size={13} /> Rapportera
            </button>
          </div>

          {/* Om tjänsten */}
          <div id="om-tjansten" className={styles.section}>
            <h2 className={styles.section_title}>Om tjänsten</h2>
            <div
              className={`${styles.description} ${descLong && !expanded ? styles['description--collapsed'] : ''}`}
              dangerouslySetInnerHTML={{ __html: service.description }}
            />
            {descLong && (
              <button className={styles.read_more_btn} onClick={() => setExpanded(e => !e)}>
                {expanded ? 'Visa mindre' : 'Läs mer'}
              </button>
            )}
          </div>

          {/* Utförda projekt (references slideshow) */}
          {references.length > 0 && (
            <div id="referenser" className={`${styles.section} ${refStyles.refs}`}>
              <div className={refStyles.refs__head}>
                <h2 className={`${styles.section_title} ${refStyles.refs__title}`}>Utförda projekt</h2>
                {references.length > 1 && (
                  <div className={refStyles.refs__nav}>
                    <button type="button" className={refStyles.refs__nav_btn} onClick={refPrev} aria-label="Föregående">
                      <ChevronLeft size={18} />
                    </button>
                    <button type="button" className={refStyles.refs__nav_btn} onClick={refNext} aria-label="Nästa">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className={refStyles.refs__track_wrap} ref={refContainerRef} onScroll={handleRefScroll}>
                <div className={refStyles.refs__track}>
                  {references.map(ref => (
                    <div
                      key={ref.id}
                      className={`${refStyles.refs__card} ${styles.ref_card}`}
                      onClick={() => setActiveRef(ref)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setActiveRef(ref)}
                    >
                      <div className={`${refStyles.refs__card_img_wrap} ${styles.ref_card_img_wrap}`}>
                        <img src={ref.image_url} alt={ref.title} className={refStyles.refs__card_img} />
                      </div>
                      <span className={`${refStyles.refs__card_label} ${styles.ref_card_label}`}>{ref.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {references.length > 1 && (
                <div className={refStyles.refs__dots}>
                  {references.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`${refStyles.refs__dot} ${i === refIndex ? refStyles['refs__dot--active'] : ''}`}
                      onClick={() => {
                        refContainerRef.current?.scrollTo({ left: i * getRefStep(), behavior: 'smooth' })
                        setRefIndex(i)
                      }}
                      aria-label={`Gå till projekt ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recensioner */}
          <div id="omdomen" className={styles.section}>
            <h2 className={styles.section_title}>Recensioner</h2>

            <div className={styles.reviews_card}>
            {reviews.length === 0 ? (
              <p className={styles.no_reviews}>Inga recensioner ännu.</p>
            ) : (
              <>
                {/* Summary: big rating + count */}
                <div className={styles.reviews_summary}>
                  <span className={styles.reviews_big_rating}>{avgRating ?? service.rating ?? '–'}</span>
                  <span className={styles.reviews_count_label}>{reviews.length} omdömen</span>
                </div>

                {/* Filter pills */}
                <div className={styles.reviews_pills}>
                  <button
                    type="button"
                    className={`${styles.review_pill} ${ratingFilter === null ? styles['review_pill--active'] : ''}`}
                    onClick={() => { setRatingFilter(null); setVisibleCount(5) }}
                  >
                    Alla
                  </button>
                  {[5, 4, 3, 2, 1].map(n => (
                    <button
                      key={n}
                      type="button"
                      className={`${styles.review_pill} ${ratingFilter === n ? styles['review_pill--active'] : ''}`}
                      onClick={() => { setRatingFilter(n); setVisibleCount(5) }}
                    >
                      <Star size={12} fill="#EF9F27" color="#EF9F27" /> {n}/5
                    </button>
                  ))}
                </div>

                {/* Review list */}
                <div className={styles.reviews}>
                  {filteredReviews.length === 0 ? (
                    <p className={styles.no_reviews}>Inga omdömen med det betyget.</p>
                  ) : (
                    visibleReviews.map((r, i) => (
                      <div key={r.id}>
                        {i > 0 && <div className={styles.review_divider} />}
                        <div className={styles.review}>
                          <div className={styles.review_header}>
                            <div className={styles.review_avatar}>
                              {r.reviewer_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className={styles.review_meta}>
                              <strong className={styles.review_name}>{r.reviewer_name}</strong>
                              <div className={styles.review_stars}>{renderStars(r.rating, 13)}</div>
                            </div>
                          </div>
                          {r.comment && <p className={styles.review_comment}>{r.comment}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Load more */}
                {hasMoreReviews && (
                  <button
                    type="button"
                    className={styles.reviews_load_more}
                    onClick={() => setVisibleCount(c => c + 5)}
                  >
                    Se fler
                  </button>
                )}
              </>
            )}
            </div>
          </div>

          {/* Om oss */}
          <div id="om-oss" className={styles.section}>
            <h2 className={styles.section_title}>Om oss</h2>
            <div className={styles.om_oss_card}>
              <div className={styles.om_oss_header}>
                <div className={styles.om_oss_avatar}>
                  {service.avatar_url
                    ? <img src={service.avatar_url} alt={service.user_name} className={styles.seller_avatar_img} />
                    : service.user_name?.charAt(0).toUpperCase() || '?'
                  }
                </div>
                <strong className={styles.om_oss_name}>{service.user_name}</strong>
              </div>
              {bio && bio.trim()
                ? <p className={styles.om_oss_bio}>{bio}</p>
                : <p className={styles.om_oss_placeholder}>Den här utföraren har inte fyllt i någon information om sig själv ännu.</p>
              }
            </div>
          </div>

          {/* SvippoSafe + certs – mobile only (shown in sidebar on desktop) */}
          <div className={styles.main_bottom}>
            <div className={`${styles.safe} sidebarCard`}>
              <Shield size={20} />
              <div>
                <strong>Känn dig trygg med SvippoSafe</strong>
                <p>Vi hjälper till att hantera trassel som kan dyka upp.</p>
              </div>
            </div>
            {matchingCerts.length > 0 && (
              <div className={`${styles.certs} sidebarCard`}>
                <div className={styles.certs_header}>
                  <CheckCircle size={15} />
                  <strong>Verifierad kompetens</strong>
                </div>
                {matchingCerts.map(cert => (
                  <div key={cert.id} className={styles.cert_row}>
                    <span>{cert.name}</span>
                    <a href={cert.file_url} target="_blank" rel="noopener noreferrer">Visa PDF</a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT: sidebar ──────────────────────────────────────────────── */}
        <div className={styles.sidebar}>

          {/* Seller + price + order */}
          <div className={`${styles.seller} sidebarCard`}>

            {/* Seller header */}
            <div className={styles.seller_header}>
              <div className={styles.seller_avatar}>
                {service.avatar_url
                  ? <img src={service.avatar_url} alt={service.user_name} className={styles.seller_avatar_img} />
                  : service.user_name?.charAt(0).toUpperCase() || '?'
                }
              </div>
              <div className={styles.seller_info}>
                <Link href={`/provider/${service.user_id}`} className={styles.seller_name}>
                  {service.user_name}
                </Link>
                <span className={styles.seller_rating} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {(avgRating ?? service.rating) ? <Star size={13} fill="#EF9F27" color="#EF9F27" /> : null} {avgRating ?? service.rating ?? '–'} ({reviews.length} recensioner)
                </span>
              </div>
            </div>

            {/* Info table */}
            <div className={styles.price_box}>
              <div className={styles.price_row}>
                <span>Pristyp</span>
                <span className={styles.price_type_label}>{service.price_type}</span>
              </div>
              {service.price_type !== 'offert' && (
                <div className={styles.price_row}>
                  <span>Pris</span>
                  <strong className={styles.price}>{service.price} kr</strong>
                </div>
              )}
              <div className={styles.price_row}>
                <span>Plats</span>
                <span>{service.location}</span>
              </div>
              {service.offers_rut && (
                <div className={styles.rut_info}>
                  <Wallet size={16} />
                  <div>
                    <strong>RUT-avdrag tillämpas</strong>
                    <p>Du betalar ca 50% av priset efter skattereduktion. Max 75 000 kr/år.</p>
                  </div>
                </div>
              )}
              {service.offers_rot && (
                <div className={styles.rut_info}>
                  <Wallet size={16} />
                  <div>
                    <strong>ROT-avdrag tillämpas</strong>
                    <p>Du betalar ca 70% av priset efter skattereduktion. Max 50 000 kr/år.</p>
                  </div>
                </div>
              )}
            </div>

            {/* CTA: owner vs buyer */}
            {isOwner ? (
              <div className={styles.own_service}>
                <div className={styles.own_service_info}>
                  <Pencil size={16} />
                  <div>
                    <strong>Detta är din tjänst</strong>
                    <p>Du kan inte beställa din egen tjänst.</p>
                  </div>
                </div>
                <div className={styles.owner_actions}>
                  <button
                    className={`btn btn-outline ${styles.edit_btn}`}
                    onClick={() => router.push(`/create-service?edit=${service.id}`)}
                  >
                    <Pencil size={14} /> Redigera
                  </button>
                  <button
                    className={`btn btn-outline ${styles.delete_btn}`}
                    onClick={handleDelete}
                    disabled={deleting || inProgressCount > 0}
                    title={inProgressCount > 0 ? 'Projektet pågår – kan inte tas bort' : ''}
                  >
                    {deleting ? 'Tar bort...' : inProgressCount > 0 ? <><Lock size={14} /> Pågår</> : <><Trash2 size={14} /> Ta bort</>}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  className={`btn btn-primary ${styles.order_btn}`}
                  onClick={() => user ? setShowOrder(true) : setShowLoginPrompt(true)}
                >
                  Beställ
                </button>
                <button
                  className={`btn btn-outline ${styles.question_btn}`}
                  onClick={handleContact}
                >
                  <MessageCircle size={15} /> Kontakta Svipparen
                </button>
                <div className={styles.seller_divider} />
                <Link href={`/provider/${service.user_id}`} className={styles.seller_profile_full_btn}>
                  <User size={15} /> Se profil
                </Link>
              </>
            )}
          </div>

          {/* SvippoSafe + certs – desktop only (moved to .main_bottom on mobile) */}
          <div className={styles.sidebar_only}>
            <div className={`${styles.safe} sidebarCard`}>
              <Shield size={20} />
              <div>
                <strong>Känn dig trygg med SvippoSafe</strong>
                <p>Vi hjälper till att hantera trassel som kan dyka upp.</p>
              </div>
            </div>

            {matchingCerts.length > 0 && (
              <div className={`${styles.certs} sidebarCard`}>
                <div className={styles.certs_header}>
                  <CheckCircle size={15} />
                  <strong>Verifierad kompetens</strong>
                </div>
                {matchingCerts.map(cert => (
                  <div key={cert.id} className={styles.cert_row}>
                    <span>{cert.name}</span>
                    <a href={cert.file_url} target="_blank" rel="noopener noreferrer">Visa PDF</a>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modals */}
      {showOrder && (
        <OrderModal
          serviceId={service.id}
          serviceTitle={service.title}
          sellerId={service.user_id}
          sellerName={service.user_name}
          subcategory={service.subcategory}
          priceType={service.price_type}
          price={service.price}
          location={service.location}
          serviceType={service.service_type}
          customQuestions={service.custom_questions || []}
          offersRut={service.offers_rut}
          offersRot={service.offers_rot}
          onClose={() => setShowOrder(false)}
        />
      )}

      {showLoginPrompt && (
        <div className="modal-backdrop" onClick={() => setShowLoginPrompt(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p>Du måste logga in för att beställa en tjänst.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Link href="/login" className="btn btn-primary">Logga in</Link>
              <Link href="/register" className="btn btn-outline">Skapa konto</Link>
            </div>
          </div>
        </div>
      )}

      {activeRef && (
        <div className={refStyles.modal_overlay} onClick={() => setActiveRef(null)}>
          <div className={refStyles.modal} onClick={e => e.stopPropagation()}>
            <button type="button" className={refStyles.modal_close} onClick={() => setActiveRef(null)} aria-label="Stäng">✕</button>
            <div className={refStyles.modal_img_wrap}>
              <img src={activeRef.image_url} alt={activeRef.title} className={refStyles.modal_img} />
            </div>
            <div className={refStyles.modal_body}>
              <h2 className={refStyles.modal_title}>{activeRef.title}</h2>
              {activeRef.description && <p className={refStyles.modal_desc}>{activeRef.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
