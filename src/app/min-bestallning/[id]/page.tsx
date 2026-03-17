'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './myorderdetail.module.scss'
import orderStyles from '../[id]/orderdetail.module.scss'

type ProjectStatus = 'not_started' | 'in_progress' | 'almost_done' | 'completed'

type Order = {
  id: string
  service_id: string
  service_title: string
  seller_id: string
  seller_name: string
  buyer_id: string
  buyer_name: string
  buyer_email: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  project_status: ProjectStatus
  subcategory?: string
  answers?: Record<string, string>
  custom_answers?: Record<string, string>
  created_at: string
}

const STATUS_STEPS = [
  { key: 'not_started', label: 'Ej påbörjat', desc: 'Projektet väntar på att starta', num: 1 },
  { key: 'in_progress', label: 'Pågår', desc: 'Projektet är igång', num: 2 },
  { key: 'almost_done', label: 'Nästan klart', desc: 'Sista finishen återstår', num: 3 },
  { key: 'completed', label: 'Slutfört', desc: 'Projektet är klart! 🎉', num: 4 },
]

export default function MyOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      const { id } = await params
      const { data } = await supabase.from('orders').select('*').eq('id', id).single()
      if (data) {
        setOrder(data)
        if (user) {
          const { data: existing } = await supabase
            .from('reviews')
            .select('id')
            .eq('order_id', id)
            .eq('reviewer_id', user.id)
            .single()
          setAlreadyReviewed(!!existing)
        }
      }
      setLoading(false)
    }
    fetchOrder()
  }, [user])

  const handleReview = async () => {
    if (!order || !user) return
    await supabase.from('reviews').insert({
      order_id: order.id,
      service_id: order.service_id,
      service_title: order.service_title,
      reviewer_id: user.id,
      reviewer_name: order.buyer_name,
      reviewee_id: order.seller_id,
      reviewee_name: order.seller_name,
      role: 'buyer',
      rating: reviewRating,
      comment: reviewText,
      created_at: new Date().toISOString(),
    })

    // Uppdatera tjänstens snittbetyg
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('service_id', order.service_id)
    if (reviews) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      await supabase.from('services').update({
        rating: Math.round(avg * 10) / 10,
        reviews: reviews.length,
      }).eq('id', order.service_id)
    }

    setReviewSuccess(true)
    setAlreadyReviewed(true)
    setShowReviewForm(false)
  }

  if (loading) return <div className={styles.loading}>Laddar beställning...</div>
  if (!order) return (
    <div className={styles.loading}>
      <p>Beställningen hittades inte.</p>
      <button className="btn btn-primary" onClick={() => router.push('/profil')}>Tillbaka till profil</button>
    </div>
  )

  if (user && user.id !== order.buyer_id) {
    router.push('/profil')
    return null
  }

  const projectStatus = order.project_status || 'not_started'
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === projectStatus)

  return (
    <div className={styles.myorder}>
      <div className={`container ${styles.myorder__inner}`}>

        <button className={orderStyles.orderdetail__back} onClick={() => router.push('/profil')}>
          ← Tillbaka till profil
        </button>

        {projectStatus === 'completed' && (
          <div className={orderStyles.completed_banner}>🎉 Detta projekt är avslutat</div>
        )}

        <div className={styles.myorder__layout}>

          {/* Vänster */}
          <div className={styles.myorder__main}>

            <div className={`${styles.myorder__header} card`}>
              <div className={styles.header_top}>
                <div>
                  <span className={orderStyles.label}>Din beställning av</span>
                  <h1 className={orderStyles.title}>{order.service_title}</h1>
                  <span className={orderStyles.date}>
                    {new Date(order.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <span className={`${orderStyles.status_badge} ${orderStyles[`status--${order.status}`]}`}>
                  {order.status === 'pending' ? '⏳ Väntar på godkännande' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                </span>
              </div>
              <Link href={`/tjanst/${order.service_id}`} className={orderStyles.service_link}>
                🔗 Visa tjänsten →
              </Link>
            </div>

            <div className={`${styles.myorder__message} card`}>
              <h2 className={orderStyles.section_title}>📋 Ditt meddelande</h2>
              <div className={`${orderStyles.field_value} ${orderStyles.field_message}`}>{order.message}</div>
            </div>

            {order.answers && Object.keys(order.answers).length > 0 && (
              <div className={`${styles.myorder__message} card`}>
                <h2 className={orderStyles.section_title}>📝 Dina svar</h2>
                <div className={orderStyles.answers}>
                  {Object.entries(order.answers).map(([key, value]) => (
                    <div key={key} className={orderStyles.answer_row}>
                      <span className={orderStyles.answer_key}>{key}</span>
                      <span className={orderStyles.answer_value}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.custom_answers && Object.keys(order.custom_answers).length > 0 && (
              <div className={`${styles.myorder__message} card`}>
                <h2 className={orderStyles.section_title}>💬 Svar på utförarens frågor</h2>
                <div className={orderStyles.answers}>
                  {Object.entries(order.custom_answers).map(([key, value]) => (
                    <div key={key} className={orderStyles.answer_row}>
                      <span className={orderStyles.answer_key}>{key}</span>
                      <span className={orderStyles.answer_value}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.status === 'accepted' && (
              <div className={`${styles.myorder__progress} card`}>
                <h2 className={orderStyles.section_title}>📊 Projektstatus</h2>
                <p className={orderStyles.progress_hint}>Följ hur {order.seller_name} arbetar med ditt projekt.</p>
                <div className={orderStyles.progress_steps}>
                  {STATUS_STEPS.map((step, index) => {
                    const isDone = index < currentStepIndex
                    const isActive = step.key === projectStatus
                    return (
                      <div
                        key={step.key}
                        className={`${orderStyles.progress_step} ${styles.readonly_step} ${isActive ? orderStyles['progress_step--active'] : ''} ${isDone ? orderStyles['progress_step--done'] : ''}`}
                      >
                        <div className={orderStyles.progress_dot}>{isDone ? '✓' : step.num}</div>
                        <div className={orderStyles.progress_info}>
                          <strong>{step.label}</strong>
                          <span>{step.desc}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Höger */}
          <div className={styles.myorder__sidebar}>

            <div className={`${styles.seller_card} card`}>
              <h2 className={orderStyles.section_title}>🛠️ Utförare</h2>
              <div className={orderStyles.customer_avatar}>{order.seller_name?.charAt(0).toUpperCase()}</div>
              <strong className={orderStyles.customer_name}>{order.seller_name}</strong>
              <Link href={`/svippare/${order.seller_id}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                👤 Se profil
              </Link>
            </div>

            {projectStatus === 'completed' && !alreadyReviewed && !reviewSuccess && (
              <div className={`${orderStyles.review_card} card`}>
                <h2 className={orderStyles.section_title}>⭐ Lämna en recension</h2>
                <p className={orderStyles.progress_hint}>Hur var din upplevelse med {order.seller_name}?</p>
                {showReviewForm ? (
                  <div className={orderStyles.review_form}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                          {n <= reviewRating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    <textarea className="form-textarea" placeholder={`Beskriv din upplevelse med ${order.seller_name}...`} value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} />
                    <button className="btn btn-primary" onClick={handleReview} disabled={!reviewText}>Skicka recension</button>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowReviewForm(true)}>
                    ⭐ Recensera {order.seller_name}
                  </button>
                )}
              </div>
            )}

            {(alreadyReviewed || reviewSuccess) && (
              <div className={`${orderStyles.review_card} card`}>
                <div className={orderStyles.payment_done}>⭐ Du har lämnat en recension!</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}