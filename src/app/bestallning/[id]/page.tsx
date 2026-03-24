'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from '@/styles/orderdetail.module.scss'

type ProjectStatus = 'not_started' | 'in_progress' | 'almost_done' | 'completed'
type ServiceType = 'typ1' | 'typ2' | 'typ3'

type Order = {
  id: string
  service_id: string
  service_title: string
  seller_id: string
  seller_name: string
  buyer_id: string
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  message: string
  answers?: Record<string, string>
  custom_answers?: Record<string, string>
  status: 'pending' | 'accepted' | 'rejected'
  project_status: ProjectStatus
  payment_status: 'unpaid' | 'paid'
  service_type: ServiceType
  subcategory?: string
  delivered_at?: string | null
  created_at: string
}

type Review = {
  id: string
  rating: number
  comment: string
  service_title: string
  reviewer_name: string
  created_at: string
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [buyerReviews, setBuyerReviews] = useState<Review[]>([])
  const [buyerAvatarUrl, setBuyerAvatarUrl] = useState<string | null>(null)
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      const { id } = await params
      const { data } = await supabase.from('orders').select('*').eq('id', id).single()
      if (data) {
        setOrder(data)

        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', data.buyer_id)
          .single()
        setBuyerAvatarUrl(userData?.avatar_url ?? null)

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('reviewee_id', data.buyer_id)
          .eq('role', 'seller')
          .order('created_at', { ascending: false })
        setBuyerReviews(reviewsData ?? [])

        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('order_id', id)
          .eq('role', 'seller')
          .single()
        if (existingReview) setHasReviewed(true)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [])

  const handleStatus = async (status: 'accepted' | 'rejected') => {
    if (!order) return
    setUpdating(true)
    await supabase.from('orders').update({ status }).eq('id', order.id)
    setOrder(prev => prev ? { ...prev, status } : prev)

    await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      type: status === 'accepted' ? 'order_accepted' : 'order_rejected',
      order_id: order.id,
      service_title: order.service_title,
      actor_name: order.seller_name,
      message: status === 'accepted'
        ? `${order.seller_name} har godkänt din beställning av "${order.service_title}"! 🎉`
        : `${order.seller_name} har tyvärr nekat din beställning av "${order.service_title}".`,
      action_url: `/min-bestallning/${order.id}`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })
    setUpdating(false)
  }

  const handleProjectStatus = async (status: ProjectStatus) => {
    if (!order) return
    setUpdating(true)
    await supabase.from('orders').update({ project_status: status }).eq('id', order.id)
    setOrder(prev => prev ? { ...prev, project_status: status } : prev)

    if (status === 'completed') {
      await supabase.from('notifications').insert([
        {
          user_id: order.buyer_id,
          type: 'project_completed',
          order_id: order.id,
          service_title: order.service_title,
          message: `${order.seller_name} har markerat projektet "${order.service_title}" som slutfört!`,
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          user_id: order.seller_id,
          type: 'request_review',
          order_id: order.id,
          service_title: order.service_title,
          message: `Projektet "${order.service_title}" är slutfört – glöm inte ta betalt och lämna en recension!`,
          read: false,
          created_at: new Date().toISOString(),
        }
      ])
    }
    setUpdating(false)
  }

  const handlePayment = async (status: 'paid' | 'unpaid') => {
    if (!order) return
    setUpdating(true)
    await supabase.from('orders').update({ payment_status: status }).eq('id', order.id)
    setOrder(prev => prev ? { ...prev, payment_status: status } : prev)
    setUpdating(false)
  }

  const handleMarkDelivered = async () => {
  if (!order) return
  setUpdating(true)
  const now = new Date().toISOString()
  await supabase.from('orders').update({ delivered_at: now }).eq('id', order.id)
  setOrder(prev => prev ? { ...prev, delivered_at: now } : prev)

  await supabase.from('notifications').insert({
    user_id: order.buyer_id,
    type: 'delivery_marked',
    order_id: order.id,
    service_title: order.service_title,
    actor_name: order.seller_name,
    message: `${order.seller_name} har markerat uppdraget som levererat. Allt okej? Om du inte hör av dig inom 24 timmar bekräftas uppdraget automatiskt.`,
    action_url: `/min-bestallning/${order.id}`,
    read: false,
    dismissed: false,
    email_sent: false,
    created_at: now,
  })

  setUpdating(false)
}

  const handleReview = async () => {
    if (!order || !user) return
    await supabase.from('reviews').insert({
      order_id: order.id,
      service_id: order.service_id,
      service_title: order.service_title,
      reviewer_id: user.id,
      reviewer_name: order.seller_name,
      reviewee_id: order.buyer_id,
      reviewee_name: order.buyer_name,
      role: 'seller',
      rating: reviewRating,
      comment: reviewText,
      created_at: new Date().toISOString(),
    })
    setReviewSuccess(true)
    setHasReviewed(true)
    setShowReviewForm(false)
  }

  if (loading) return <div className={styles.loading}>Laddar beställning...</div>
  if (!order) return (
    <div className={styles.loading}>
      <p>Beställningen hittades inte.</p>
      <button className="btn btn-primary" onClick={() => router.push('/profil')}>Tillbaka till profil</button>
    </div>
  )

  const isSeller = user?.id === order.seller_id
  const projectStatus = order.project_status
  const serviceType = order.service_type ?? 'typ1'

  // Typ-specifik info från answers
  const preferredDate = order.answers?.['Önskat datum']
  const preferredTime = order.answers?.['Önskad tid']
  const address = order.answers?.['Adress']
  const desiredDeadline = order.answers?.['Önskat slutdatum']
  const milestones = order.answers?.['Föreslagna milstolpar']
  const pickupAddress = order.answers?.['Upphämtningsadress']
  const deliveryAddress = order.answers?.['Leveransadress']
  const pickupDate = order.answers?.['Datum']
  const pickupTime = order.answers?.['Tid']

  // Filtrera bort typ-specifika nycklar från answers så de inte visas dubbelt
  const typeSpecificKeys = ['Önskat datum', 'Önskad tid', 'Adress', 'Önskat slutdatum', 'Föreslagna milstolpar', 'Upphämtningsadress', 'Leveransadress', 'Datum', 'Tid']
  const filteredAnswers = order.answers
    ? Object.fromEntries(Object.entries(order.answers).filter(([key]) => !typeSpecificKeys.includes(key)))
    : {}

  const PROGRESS_STEPS = [
    { status: 'not_started' as ProjectStatus, label: 'Ej påbörjat', desc: 'Projektet väntar på att starta', num: 1 },
    { status: 'in_progress' as ProjectStatus, label: 'Pågår', desc: 'Projektet är igång', num: 2 },
    { status: 'almost_done' as ProjectStatus, label: 'Nästan klart', desc: 'Sista finishen återstår', num: 3 },
    { status: 'completed' as ProjectStatus, label: 'Slutfört', desc: 'Projektet är klart! 🎉', num: 4 },
  ]

  const stepOrder = ['not_started', 'in_progress', 'almost_done', 'completed']
  const currentIdx = stepOrder.indexOf(projectStatus)

  return (
    <div className={`${styles.orderdetail} ${projectStatus === 'completed' ? styles['orderdetail--completed'] : ''}`}>
      <div className={`container ${styles.orderdetail__inner}`}>

        <button className={styles.orderdetail__back} onClick={() => router.push('/profil')}>
          ← Tillbaka till profil
        </button>

        {projectStatus === 'completed' && (
          <div className={styles.completed_banner}>🎉 Detta projekt är avslutat</div>
        )}

        <div className={styles.orderdetail__layout}>

          {/* Vänster */}
          <div className={styles.orderdetail__main}>

            <div className={`${styles.orderdetail__header} card`}>
              <div className={styles.header_top}>
                <div>
                  <span className={styles.label}>Beställning av</span>
                  <h1 className={styles.title}>{order.service_title}</h1>
                  <span className={styles.date}>
                    {new Date(order.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <span className={`${styles.status_badge} ${styles[`status--${order.status}`]}`}>
                  {order.status === 'pending' ? '⏳ Väntar' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                </span>
              </div>
              <Link href={`/tjanst/${order.service_id}`} className={styles.service_link}>
                🔗 Visa tjänsten →
              </Link>
            </div>

            {/* Typ-specifik info */}
            {serviceType === 'typ1' && (preferredDate || address) && (
              <div className={`${styles.orderdetail__type_info} card`}>
                <h2 className={styles.section_title}>📅 Datum & plats</h2>
                <div className={styles.type_info_grid}>
                  {preferredDate && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Önskat datum</span>
                      <strong>{preferredDate}</strong>
                    </div>
                  )}
                  {preferredTime && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Önskad tid</span>
                      <strong>{preferredTime}</strong>
                    </div>
                  )}
                  {address && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Adress</span>
                      <strong>{address}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {serviceType === 'typ2' && (desiredDeadline || milestones) && (
              <div className={`${styles.orderdetail__type_info} card`}>
                <h2 className={styles.section_title}>🗓️ Tidslinje</h2>
                <div className={styles.type_info_grid}>
                  {desiredDeadline && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Önskat slutdatum</span>
                      <strong>{desiredDeadline}</strong>
                    </div>
                  )}
                  {milestones && (
                    <div className={`${styles.type_info_item} ${styles['type_info_item--full']}`}>
                      <span className={styles.type_info_label}>Föreslagna milstolpar</span>
                      <p className={styles.type_info_text}>{milestones}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {serviceType === 'typ3' && (pickupAddress || deliveryAddress) && (
              <div className={`${styles.orderdetail__type_info} card`}>
                <h2 className={styles.section_title}>📦 Upphämtning & leverans</h2>
                <div className={styles.type_info_grid}>
                  {pickupAddress && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Upphämtning</span>
                      <strong>{pickupAddress}</strong>
                    </div>
                  )}
                  {deliveryAddress && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Leverans</span>
                      <strong>{deliveryAddress}</strong>
                    </div>
                  )}
                  {pickupDate && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Datum</span>
                      <strong>{pickupDate}</strong>
                    </div>
                  )}
                  {pickupTime && (
                    <div className={styles.type_info_item}>
                      <span className={styles.type_info_label}>Tid</span>
                      <strong>{pickupTime}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`${styles.orderdetail__form} card`}>
              <h2 className={styles.section_title}>📋 Ifyllt formulär</h2>

              <div className={styles.field}>
                <span className={styles.field_label}>Meddelande</span>
                <div className={`${styles.field_value} ${styles.field_message}`}>{order.message}</div>
              </div>

              {Object.keys(filteredAnswers).length > 0 && (
                <div className={styles.field}>
                  <span className={styles.field_label}>Svar på frågor</span>
                  <div className={styles.answers}>
                    {Object.entries(filteredAnswers).map(([key, value]) => (
                      <div key={key} className={styles.answer_row}>
                        <span className={styles.answer_key}>{key}</span>
                        <span className={styles.answer_value}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.custom_answers && Object.keys(order.custom_answers).length > 0 && (
                <div className={styles.field}>
                  <span className={styles.field_label}>Svar på dina frågor</span>
                  <div className={styles.answers}>
                    {Object.entries(order.custom_answers).map(([key, value]) => (
                      <div key={key} className={styles.answer_row}>
                        <span className={styles.answer_key}>{key}</span>
                        <span className={styles.answer_value}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Beställarens recensioner */}
            <div className={`${styles.orderdetail__buyer_reviews} card`}>
              <h2 className={styles.section_title}>⭐ {order.buyer_name}s recensioner</h2>
              {buyerReviews.length === 0 ? (
                <p className={styles.no_reviews}>
                  {order.buyer_name} har inga tidigare recensioner på Svippo än.
                </p>
              ) : (
                <div className={styles.buyer_reviews_list}>
                  {buyerReviews.map(r => (
                    <div key={r.id} className={styles.buyer_review}>
                      <div className={styles.buyer_review__header}>
                        <span className={styles.buyer_review__service}>{r.service_title}</span>
                        <span className={styles.buyer_review__stars}>{'⭐'.repeat(r.rating)}</span>
                      </div>
                      {r.comment && <p className={styles.buyer_review__comment}>{r.comment}</p>}
                      <span className={styles.buyer_review__date}>
                        {new Date(r.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Höger */}
          <div className={styles.orderdetail__sidebar}>

            <div className={`${styles.customer_card} card`}>
              <h2 className={styles.section_title}>👤 Kundinformation</h2>
              <div className={styles.customer_avatar}>
                {buyerAvatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={buyerAvatarUrl} alt={order.buyer_name} className={styles.customer_avatar_img} />
                  : order.buyer_name?.charAt(0).toUpperCase()
                }
              </div>
              <strong className={styles.customer_name}>{order.buyer_name}</strong>
              <div className={styles.customer_details}>
                <div className={styles.detail_row}>
                  <span>📧</span>
                  <a href={`mailto:${order.buyer_email}`}>{order.buyer_email}</a>
                </div>
                {order.buyer_phone && (
                  <div className={styles.detail_row}>
                    <span>📱</span>
                    <a href={`tel:${order.buyer_phone}`}>{order.buyer_phone}</a>
                  </div>
                )}
              </div>
              <div className={styles.contact_actions}>
                <a href={`mailto:${order.buyer_email}`} className="btn btn-primary">✉️ Skicka e-post</a>
                {order.buyer_phone && <a href={`tel:${order.buyer_phone}`} className="btn btn-outline">📱 Ring kunden</a>}
              </div>
            </div>

            {order.status === 'accepted' && isSeller && (
              <div className={`${styles.chat_card} card`}>
                <h2 className={styles.section_title}>💬 Meddelanden</h2>
                <p className={styles.progress_hint}>Kommunicera med {order.buyer_name} om uppdraget.</p>
                <Link href={`/meddelanden?orderId=${order.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  💬 Öppna chatten
                </Link>
              </div>
            )}
            
            {isSeller && (
              <div className={`${styles.actions_card} card`}>
                <h2 className={styles.section_title}>⚡ Hantera beställning</h2>
                <div className={`${styles.current_status} ${styles[`status--${order.status}`]}`}>
                  {order.status === 'pending' ? '⏳ Väntar på ditt svar' : order.status === 'accepted' ? '✅ Du har godkänt denna beställning' : '❌ Du har nekat denna beställning'}
                </div>
                {order.status === 'pending' && (
                  <div className={styles.action_btns}>
                    <button className="btn btn-primary" onClick={() => handleStatus('accepted')} disabled={updating}>✅ Godkänn beställning</button>
                    <button className={`btn btn-outline ${styles.reject_btn}`} onClick={() => handleStatus('rejected')} disabled={updating}>❌ Neka beställning</button>
                  </div>
                )}
                {order.status === 'rejected' && (
                  <button className="btn btn-primary" onClick={() => handleStatus('accepted')} disabled={updating}>Ångra – Godkänn beställning</button>
                )}
              </div>
            )}

            {order.status === 'accepted' && isSeller && (
              <div className={`${styles.progress_card} card`}>
                <h2 className={styles.section_title}>📊 Projektstatus</h2>
                <p className={styles.progress_hint}>Uppdatera hur långt projektet kommit.</p>
                <div className={styles.progress_steps}>
                  {PROGRESS_STEPS.map((step, idx) => {
                    const isDone = idx < currentIdx
                    const isActive = idx === currentIdx
                    const isCompleted = step.status === 'completed' && projectStatus === 'completed'
                    return (
                      <button
                        key={step.status}
                        className={`${styles.progress_step} ${isActive ? styles['progress_step--active'] : ''} ${isDone ? styles['progress_step--done'] : ''} ${isCompleted ? styles['progress_step--completed'] : ''}`}
                        onClick={() => step.status === 'completed' ? setShowCompleteConfirm(true) : handleProjectStatus(step.status)}
                        disabled={updating || projectStatus === 'completed'}
                      >
                        <div className={styles.progress_dot}>{isDone || isCompleted ? '✓' : step.num}</div>
                        <div className={styles.progress_info}>
                          <strong>{step.label}</strong>
                          <span>{step.desc}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {projectStatus === 'completed' && isSeller && (
              <div className={`${styles.payment_card} card`}>
                <h2 className={styles.section_title}>💰 Betalning</h2>
                <p className={styles.progress_hint}>Har du tagit betalt av {order.buyer_name}?</p>
                {order.payment_status === 'paid' ? (
                  <div className={styles.payment_done}>✅ Du har markerat betalningen som mottagen!</div>
                ) : (
                  <div className={styles.action_btns}>
                    <button className="btn btn-primary" onClick={() => handlePayment('paid')} disabled={updating}>✅ Ja, jag har fått betalt</button>
                    <button className="btn btn-outline" onClick={() => handlePayment('unpaid')} disabled={updating}>⏳ Inte än</button>
                  </div>
                )}
              </div>
            )}

            {serviceType === 'typ3' && order.status === 'accepted' && projectStatus !== 'completed' && isSeller && (
              <div className={`${styles.payment_card} card`}>
                <h2 className={styles.section_title}>📦 Leverans</h2>
                <p className={styles.progress_hint}>
                  Har du levererat uppdraget till {order.buyer_name}?
                </p>
                {order.delivered_at ? (
                  <div className={styles.payment_done}>
                    ✅ Markerat som levererat – väntar på bekräftelse från {order.buyer_name}
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleMarkDelivered}
                    disabled={updating}
                  >
                    📦 Markera som levererat
                  </button>
                )}
              </div>
            )}

            {projectStatus === 'completed' && isSeller && !hasReviewed && !reviewSuccess && (
              <div className={`${styles.review_card} card`}>
                <h2 className={styles.section_title}>⭐ Lämna en recension</h2>
                {showReviewForm ? (
                  <div className={styles.review_form}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '24px' }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                          {n <= reviewRating ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    <textarea className="form-textarea" placeholder={`Beskriv din upplevelse med ${order.buyer_name}...`} value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} />
                    <button className="btn btn-primary" onClick={handleReview} disabled={!reviewText}>Skicka recension</button>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowReviewForm(true)}>
                    ⭐ Recensera {order.buyer_name}
                  </button>
                )}
              </div>
            )}

            {(hasReviewed || reviewSuccess) && projectStatus === 'completed' && isSeller && (
              <div className={`${styles.review_card} card`}>
                <div className={styles.payment_done}>⭐ Du har lämnat en recension för denna beställning!</div>
              </div>
            )}

          </div>
        </div>
      </div>

      {showCompleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowCompleteConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Är du säker? 🎉</h2>
            <p style={{ color: 'var(--color-gray)', marginBottom: '16px' }}>Detta går inte att ångra. Projektet markeras som slutfört och beställaren meddelas.</p>
            <div className={styles.confirm_checklist}>
              {['✅ Beställaren meddelas att projektet är klart', '⭐ Båda parter får möjlighet att lämna recensioner', '💰 Du påminns om att ta betalt', '🔒 Projektstatus låses och kan inte ändras'].map(item => (
                <div key={item} className={styles.confirm_item}>{item}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCompleteConfirm(false)}>Avbryt</button>
              <button className="btn btn-primary" onClick={async () => { await handleProjectStatus('completed'); setShowCompleteConfirm(false) }} disabled={updating}>
                {updating ? 'Slutför...' : '🎉 Ja, projektet är klart!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}