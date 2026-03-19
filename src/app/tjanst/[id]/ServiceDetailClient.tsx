'use client'

import OrderModal from '@/components/OrderModal'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  rating: number
  reviews: number
  custom_questions?: CustomQuestion[]
}

type Props = {
  service: Service
}

export default function ServiceDetailClient({ service }: Props) {
  const { user } = useAuth()
  const router = useRouter()
  const [showOrder, setShowOrder] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [inProgressCount, setInProgressCount] = useState(0)

  const isOwner = user?.id === service.user_id

  // Hämta aktiva beställningar för denna tjänst
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
    if (inProgressCount > 0) return // Ska inte kunna klicka, men extra säkerhet

    const warningMsg = activeOrdersCount > 0
      ? `Du har ${activeOrdersCount} aktiv(a) beställning(ar) på denna tjänst. Är du säker på att du vill ta bort den?`
      : 'Är du säker på att du vill ta bort denna tjänst?'

    if (!confirm(warningMsg)) return

    setDeleting(true)
    await supabase.from('services').delete().eq('id', service.id)
    router.push('/profil')
  }

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
            </div>

            <h1 className={styles.detail__title}>{service.title}</h1>

            <div className={styles.detail__section}>
              <h2 className={styles.detail__section_title}>Om tjänsten</h2>
              <p className={styles.detail__description}>{service.description}</p>
            </div>

            <div className={styles.detail__section}>
              <h2 className={styles.detail__section_title}>Recensioner</h2>
              <p className={styles.detail__no_reviews}>Inga recensioner ännu.</p>
            </div>
          </div>

          {/* Höger – utförare & beställning */}
          <div className={styles.detail__sidebar}>

            {/* Utförare */}
            <div className={`${styles.detail__seller} card`}>
              <div className={styles.detail__seller_header}>
                <div className={styles.detail__seller_avatar}>
                  {service.user_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={styles.detail__seller_info}>
                  <Link href={`/svippare/${service.user_id}`} className={styles.detail__seller_name}>
                    {service.user_name}
                  </Link>
                  <span className={styles.detail__seller_rating}>
                    ⭐ {service.rating || '–'} ({service.reviews} recensioner)
                  </span>
                  <Link href={`/svippare/${service.user_id}`} className={styles.detail__seller_profile_btn}>
                    👤 Se profil →
                  </Link>
                </div>
              </div>

              {/* Prisbox */}
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
                <a
                  href={`mailto:${service.user_email}`}
                  className={`btn btn-outline ${styles.detail__question_btn}`}
                >
                  💬 Har du en fråga?
                </a>
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
          customQuestions={service.custom_questions || []}
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