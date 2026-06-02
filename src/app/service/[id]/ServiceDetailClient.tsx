'use client'

import OrderModal from '@/components/OrderModal'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import styles from './servicedetail.module.scss'
import refStyles from './references.module.scss'
import { CheckCircle, Star, User, Wallet, Pencil, Trash2, Lock, MessageCircle, Shield, ChevronLeft, ChevronRight } from 'lucide-react'

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
}

export default function ServiceDetailClient({ service, reviews, avgRating, references = [] }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Description expand/collapse ───────────────────────────────────────────
  const [expanded, setExpanded] = useState(false)
  const descLong = service.description && service.description.length > 280

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

      <div className={styles.layout}>

        {/* ── LEFT: main content ──────────────────────────────────────────── */}
        <div className={styles.main}>

          {/* Badges */}
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

          {/* H1 */}
          <h1 className={styles.title}>{service.title}</h1>

          {/* Om tjänsten */}
          <div className={styles.section}>
            <h2 className={styles.section_title}>Om tjänsten</h2>
            <p className={`${styles.description} ${descLong && !expanded ? styles['description--collapsed'] : ''}`}>
              {service.description}
            </p>
            {descLong && (
              <button className={styles.read_more_btn} onClick={() => setExpanded(e => !e)}>
                {expanded ? 'Visa mindre' : 'Läs mer'}
              </button>
            )}
          </div>

          {/* Utförda projekt (references slideshow) */}
          {references.length > 0 && (
            <div className={`${styles.section} ${refStyles.refs}`}>
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
                      className={refStyles.refs__card}
                      onClick={() => setActiveRef(ref)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && setActiveRef(ref)}
                    >
                      <div className={refStyles.refs__card_img_wrap}>
                        <img src={ref.image_url} alt={ref.title} className={refStyles.refs__card_img} />
                      </div>
                      <span className={refStyles.refs__card_label}>{ref.title}</span>
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
          <div className={styles.section}>
            <div className={styles.reviews_header}>
              <h2 className={styles.section_title}>
                Recensioner
                {reviews.length > 0 && (
                  <span className={styles.reviews_count} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {avgRating !== null && <><Star size={13} /> {avgRating}</>} · {reviews.length} recensioner
                  </span>
                )}
              </h2>
            </div>

            {reviews.length === 0 ? (
              <p className={styles.no_reviews}>Inga recensioner ännu.</p>
            ) : (
              <div className={styles.reviews}>
                {reviews.map(r => (
                  <div key={r.id} className={`${styles.review} card`}>
                    <div className={styles.review_header}>
                      <strong className={styles.review_name}>{r.reviewer_name}</strong>
                      <span className={styles.review_stars} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {Array.from({ length: r.rating }, (_, i) => <Star key={i} size={13} fill="currentColor" />)}
                      </span>
                    </div>
                    {r.comment && <p className={styles.review_comment}>{r.comment}</p>}
                    <span className={styles.review_date}>
                      {new Date(r.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT: sidebar ──────────────────────────────────────────────── */}
        <div className={styles.sidebar}>

          {/* Seller + price + order */}
          <div className={`${styles.seller} card`}>

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
                  <Star size={13} /> {avgRating ?? service.rating ?? '–'} ({reviews.length} recensioner)
                </span>
                <Link href={`/provider/${service.user_id}`} className={styles.seller_profile_btn}>
                  <User size={13} /> Se profil →
                </Link>
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
              </>
            )}
          </div>

          {/* SvippoSafe */}
          <div className={`${styles.safe} card`}>
            <Shield size={20} />
            <div>
              <strong>Känn dig trygg med SvippoSafe</strong>
              <p>Vi hjälper till att hantera trassel som kan dyka upp.</p>
            </div>
          </div>

          {/* Verifierad kompetens */}
          {matchingCerts.length > 0 && (
            <div className={`${styles.certs} card`}>
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
