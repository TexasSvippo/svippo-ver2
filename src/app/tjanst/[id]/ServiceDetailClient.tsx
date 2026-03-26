'use client'

import OrderModal from '@/components/OrderModal'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import styles from './servicedetail.module.scss'

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

type Props = {
  service: Service
  reviews: Review[]
  avgRating: number | null
}

export default function ServiceDetailClient({ service, reviews, avgRating }: Props) {
const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showOrder, setShowOrder] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [inProgressCount, setInProgressCount] = useState(0)

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
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, status, project_status')
        .eq('service_id', service.id)

      if (data) {
        setActiveOrdersCount(data.filter(o => o.status === 'accepted').length)
        setInProgressCount(data.filter(o =>
          o.project_status === 'in_progress' || o.project_status === 'almost_done'
        ).length)
      }
    }
    fetchOrders()
  }, [isOwner, service.id])

  const handleDelete = async () => {
    if (inProgressCount > 0) return

    const warningMsg = activeOrdersCount > 0
      ? `Du har ${activeOrdersCount} aktiv(a) beställning(ar) på denna tjänst. Är du säker på att du vill ta bort den?`
      : 'Är du säker på att du vill ta bort denna tjänst?'

    if (!confirm(warningMsg)) return

    setDeleting(true)
    await supabase.from('services').delete().eq('id', service.id)
    router.push('/profil')
  }

const handleContact = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    if (user.id === service.user_id) return

    // Kolla om konversation redan finns mellan dessa två för denna tjänst
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('anchor_id', service.id)
      .eq('participant_1_id', user.id)
      .eq('participant_2_id', service.user_id)
      .limit(1)

    if (existing && existing.length > 0) {
      router.push(`/meddelanden/${existing[0].id}`)
      return
    }

    // Kolla omvänt (ifall rollerna är bytta)
    const { data: existingReverse } = await supabase
      .from('conversations')
      .select('id')
      .eq('anchor_id', service.id)
      .eq('participant_1_id', service.user_id)
      .eq('participant_2_id', user.id)
      .limit(1)

    if (existingReverse && existingReverse.length > 0) {
      router.push(`/meddelanden/${existingReverse[0].id}`)
      return
    }

    // Skapa ny Typ A-konversation – skapas först när meddelande skickas
    // Navigera till meddelanden med info om vem vi pratar med
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        type: 'inquiry',
        anchor_type: 'listing',
        anchor_id: service.id,
        assignment_id: null,
        participant_1_id: user.id,
        participant_2_id: service.user_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newConv) {
      router.push(`/meddelanden/${newConv.id}`)
    }
  }

const filteredReviews = reviews

  return (
    <div className={styles.detail}>
      <div className={`container ${styles.detail__inner}`}>

        {/* Brödsmulor */}
        <div className={styles.detail__breadcrumb}>
          <Link href="/">Hem</Link>
          <span>·</span>
          <Link href="/tjanster">Tjänster</Link>
          <span>·</span>
          <span>{service.title}</span>
        </div>

        <div className={styles.detail__layout}>

          {/* Vänster – huvudinnehåll */}
          <div className={styles.detail__main}>
            <div className={styles.detail__badges}>
              <span className={styles.detail__badge}>{service.subcategory}</span>
              {service.offers_rut && (
                <span className={`${styles.detail__badge} ${styles['detail__badge--rut']}`}>✅ RUT-avdrag</span>
              )}
              {service.offers_rot && (
                <span className={`${styles.detail__badge} ${styles['detail__badge--rot']}`}>✅ ROT-avdrag</span>
              )}
            </div>

            <h1 className={styles.detail__title}>{service.title}</h1>

            <div className={styles.detail__section}>
              <h2 className={styles.detail__section_title}>Om tjänsten</h2>
              <p className={styles.detail__description}>{service.description}</p>
            </div>

            {/* Recensioner */}
            <div className={styles.detail__section}>
              <div className={styles.detail__reviews_header}>
                <h2 className={styles.detail__section_title}>
                  Recensioner
                  {reviews.length > 0 && (
                    <span className={styles.detail__reviews_count}>
                      {avgRating !== null && `⭐ ${avgRating}`} · {reviews.length} recensioner
                    </span>
                  )}
                </h2>

              </div>

              {filteredReviews.length === 0 ? (
              <p className={styles.detail__no_reviews}>
                Inga recensioner ännu.
              </p>
              ) : (
                <div className={styles.detail__reviews}>
                  {filteredReviews.map(r => (
                    <div key={r.id} className={`${styles.detail__review} card`}>
                      <div className={styles.detail__review_header}>
                        <strong className={styles.detail__review_name}>{r.reviewer_name}</strong>
                        <span className={styles.detail__review_stars}>{'⭐'.repeat(r.rating)}</span>
                      </div>
                      {r.comment && (
                        <p className={styles.detail__review_comment}>{r.comment}</p>
                      )}
                      <span className={styles.detail__review_date}>
                        {new Date(r.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Höger – utförare & beställning */}
          <div className={styles.detail__sidebar}>

            {/* Utförare */}
            <div className={`${styles.detail__seller} card`}>
              <div className={styles.detail__seller_header}>
                <div className={styles.detail__seller_avatar}>
                  {service.avatar_url
                    ? <img src={service.avatar_url} alt={service.user_name} className={styles.detail__seller_avatar_img} />
                    : service.user_name?.charAt(0).toUpperCase() || '?'
                  }
                </div>
                <div className={styles.detail__seller_info}>
                  <Link href={`/svippare/${service.user_id}`} className={styles.detail__seller_name}>
                    {service.user_name}
                  </Link>
                  <span className={styles.detail__seller_rating}>
                    ⭐ {avgRating ?? service.rating ?? '–'} ({reviews.length} recensioner)
                  </span>
                  <Link href={`/svippare/${service.user_id}`} className={styles.detail__seller_profile_btn}>
                    👤 Se profil →
                  </Link>
                </div>
              </div>

              <div className={styles.detail__price_box}>
                <div className={styles.detail__price_row}>
                  <span>Pristyp</span>
                  <span className={styles.detail__price_type}>{service.price_type}</span>
                </div>

                {service.price_type !== 'offert' && (
                  <div className={styles.detail__price_row}>
                    <span>Pris</span>
                    <strong className={styles.detail__price}>{service.price} kr</strong>
                  </div>
                )}

                <div className={styles.detail__price_row}>
                  <span>Plats</span>
                  <span>{service.location}</span>
                </div>
                {service.offers_rut && (
                  <div className={styles.detail__rut_info}>
                    <span>💰</span>
                    <div>
                      <strong>RUT-avdrag tillämpas</strong>
                      <p>Du betalar ca 50% av priset efter skattereduktion. Max 75 000 kr/år.</p>
                    </div>
                  </div>
                )}
                {service.offers_rot && (
                  <div className={styles.detail__rut_info}>
                    <span>💰</span>
                    <div>
                      <strong>ROT-avdrag tillämpas</strong>
                      <p>Du betalar ca 70% av priset efter skattereduktion. Max 50 000 kr/år.</p>
                    </div>
                  </div>
                )}
              </div>

              {isOwner ? (
                <div className={styles.detail__own_service}>
                  <div className={styles.detail__own_service_info}>
                    <span>✏️</span>
                    <div>
                      <strong>Detta är din tjänst</strong>
                      <p>Du kan inte beställa din egen tjänst.</p>
                    </div>
                  </div>
                  <div className={styles.detail__owner_actions}>
                    <button
                      className={`btn btn-outline ${styles.detail__edit_btn}`}
                      onClick={() => router.push(`/skapa-inlagg?edit=${service.id}`)}
                    >
                      ✏️ Redigera
                    </button>
                    <button
                      className={`btn btn-outline ${styles.detail__delete_btn}`}
                      onClick={handleDelete}
                      disabled={deleting || inProgressCount > 0}
                      title={inProgressCount > 0 ? 'Projektet pågår – kan inte tas bort' : ''}
                    >
                      {deleting ? 'Tar bort...' : inProgressCount > 0 ? '🔒 Pågår' : '🗑️ Ta bort'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={`btn btn-primary ${styles.detail__order_btn}`}
                  onClick={() => user ? setShowOrder(true) : setShowLoginPrompt(true)}
                >
                  Beställ
                </button>
              )}

              {!isOwner && (
                <button
                  className={`btn btn-outline ${styles.detail__question_btn}`}
                  onClick={handleContact}
                >
                  💬 Kontakta Svipparen
                </button>
              )}
            </div>

            {/* SvippoSafe */}
            <div className={`${styles.detail__safe} card`}>
              <span className={styles.detail__safe_icon}>🛡️</span>
              <div>
                <strong>Känn dig trygg med SvippoSafe</strong>
                <p>Vi hjälper till att hantera trassel som kan dyka upp.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

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
              <Link href="/logga-in" className="btn btn-primary">Logga in</Link>
              <Link href="/registrera" className="btn btn-outline">Skapa konto</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}