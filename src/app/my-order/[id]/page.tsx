'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './myorderdetail.module.scss'
import orderStyles from '@/styles/orderdetail.module.scss'
import { Clock, CheckCircle, XCircle, Link as LinkIcon, ClipboardList, FileText, MessageCircle, BarChart2, Package, Wrench, User, Shield, Star, ArrowLeft } from 'lucide-react'

type ProjectStatus = 'not_started' | 'in_progress' | 'almost_done' | 'completed'

type Order = {
  id: string
  service_id: string
  service_title: string
  seller_id: string
  seller_name: string
  seller_email?: string
  buyer_id: string
  buyer_name: string
  buyer_email: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  project_status: ProjectStatus
  subcategory?: string
  answers?: Record<string, string>
  custom_answers?: Record<string, string>
  from_request?: boolean
  service_type?: 'typ1' | 'typ2' | 'typ3'
  dispute_status?: string | null
  dispute_message?: string | null
  delivered_at?: string | null
  chat_enabled?: boolean
  email_triggers?: Record<string, boolean>
  created_at: string
}

const STATUS_STEPS = [
  { key: 'not_started', label: 'Ej påbörjat', desc: 'Projektet väntar på att starta', num: 1 },
  { key: 'in_progress', label: 'Pågår', desc: 'Projektet är igång', num: 2 },
  { key: 'almost_done', label: 'Nästan klart', desc: 'Sista finishen återstår', num: 3 },
  { key: 'completed', label: 'Slutfört', desc: 'Projektet är klart! 🎉', num: 4 },
]

// [MEJLPLATS] – Triggerlogik för mejlutskick
// När Resend är aktiverat ersätts dessa med faktiska mejlutskick
async function triggerEmail(type: string, orderId: string) {
  try {
    await supabase.from('orders').update({
      email_triggers: { [type]: true, [`${type}_at`]: new Date().toISOString() }
    }).eq('id', orderId)
    console.log(`[MEJLPLATS] Trigger: ${type} för order ${orderId}`)
  } catch (err) {
    console.error('Email trigger error:', err)
  }
}

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

  // Avvikelseflöde
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeMessage, setDisputeMessage] = useState('')
  const [disputeSending, setDisputeSending] = useState(false)
  const [disputeSent, setDisputeSent] = useState(false)

  // Typ 3 – bekräftelse
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      const { id } = await params
      const { data } = await supabase.from('orders').select('*').eq('id', id).single()
      if (data) {
        setOrder(data)
        if (data.dispute_status) setDisputeSent(true)
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

    // [MEJLPLATS] – Skicka tack-mejl till beställaren
    await triggerEmail('review_sent', order.id)

    setReviewSuccess(true)
    setAlreadyReviewed(true)
    setShowReviewForm(false)
  }

  // Avvikelseflöde
  const handleDispute = async () => {
    if (!order || !disputeMessage) return
    setDisputeSending(true)
    try {
      await supabase.from('orders').update({
        dispute_status: 'open',
        dispute_message: disputeMessage,
        dispute_at: new Date().toISOString(),
      }).eq('id', order.id)

      // Notifiera utföraren
      await supabase.from('notifications').insert({
        user_id: order.seller_id,
        type: 'dispute_opened',
        order_id: order.id,
        service_title: order.service_title,
        actor_name: order.buyer_name,
        message: `${order.buyer_name} har rapporterat ett problem med "${order.service_title}". Svippo tittar på det – håll kommunikationsytan öppen.`,
        action_url: `/order/${order.id}`,
        read: false,
        dismissed: false,
        email_sent: false,
        created_at: new Date().toISOString(),
      })

      // [MEJLPLATS] – Skicka mejl till Svippo-admin och utföraren
      await triggerEmail('dispute_opened', order.id)

      setOrder(prev => prev ? { ...prev, dispute_status: 'open', dispute_message: disputeMessage } : prev)
      setDisputeSent(true)
      setShowDisputeForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setDisputeSending(false)
    }
  }

  // Typ 3 – Beställaren bekräftar leverans manuellt
  const handleConfirmDelivery = async () => {
    if (!order) return
    setConfirmingDelivery(true)
    try {
      await supabase.from('orders').update({
        project_status: 'completed',
      }).eq('id', order.id)

      await supabase.from('notifications').insert({
        user_id: order.seller_id,
        type: 'project_completed',
        order_id: order.id,
        service_title: order.service_title,
        actor_name: order.buyer_name,
        message: `${order.buyer_name} har bekräftat att leveransen gick bra! 🎉`,
        action_url: `/order/${order.id}`,
        read: false,
        dismissed: false,
        email_sent: false,
        created_at: new Date().toISOString(),
      })

      // [MEJLPLATS] – Skicka bekräftelsemejl till båda parter
      await triggerEmail('delivery_confirmed', order.id)

      setOrder(prev => prev ? { ...prev, project_status: 'completed' } : prev)
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmingDelivery(false)
    }
  }

  if (loading) return <div className={styles.loading}>Laddar beställning...</div>
  if (!order) return (
    <div className={styles.loading}>
      <p>Beställningen hittades inte.</p>
      <button className="btn btn-primary" onClick={() => router.push('/profile')}>Tillbaka till profil</button>
    </div>
  )

  if (user && user.id !== order.buyer_id) {
    router.push('/profile')
    return null
  }

  const projectStatus = order.project_status || 'not_started'
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === projectStatus)
  const isTyp3 = order.service_type === 'typ3'
  const isDelivered = !!order.delivered_at
  const hasDispute = !!order.dispute_status

  return (
    <div className={styles.myorder}>
      <div className={`container ${styles.myorder__inner}`}>

        <button className={orderStyles.orderdetail__back} onClick={() => router.push('/profile')}>
          <ArrowLeft size={16} /> Tillbaka till profil
        </button>

        {projectStatus === 'completed' && (
          <div className={orderStyles.completed_banner}>🎉 Detta projekt är avslutat</div>
        )}

        {hasDispute && (
          <div className={styles.dispute_banner}>
            <span>⚠️</span>
            <div>
              <strong>Ärendet är rapporterat</strong>
              <p>Vi har tagit emot ditt ärende och återkommer inom 24 timmar. Under tiden kan du kontakta {order.seller_name} direkt via e-post.</p>
            </div>
          </div>
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
                  {order.status === 'pending' ? <><Clock size={14} /> Väntar på godkännande</> : order.status === 'accepted' ? <><CheckCircle size={14} /> Godkänd</> : <><XCircle size={14} /> Nekad</>}
                </span>
              </div>
              <Link
                href={order.from_request ? `/request/${order.service_id}` : `/service/${order.service_id}`}
                className={orderStyles.service_link}
              >
                <LinkIcon size={16} /> {order.from_request ? 'Visa din förfrågan →' : 'Visa tjänsten →'}
              </Link>
            </div>

            <div className={`${styles.myorder__message} card`}>
              <h2 className={orderStyles.section_title}><ClipboardList size={18} /> Ditt meddelande</h2>
              <div className={`${orderStyles.field_value} ${orderStyles.field_message}`}>{order.message}</div>
            </div>

            {order.answers && Object.keys(order.answers).length > 0 && (
              <div className={`${styles.myorder__message} card`}>
                <h2 className={orderStyles.section_title}><FileText size={18} /> Dina svar</h2>
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
                <h2 className={orderStyles.section_title}><MessageCircle size={18} /> Svar på utförarens frågor</h2>
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

            {order.status === 'accepted' && !isTyp3 && (
              <div className={`${styles.myorder__progress} card`}>
                <h2 className={orderStyles.section_title}><BarChart2 size={18} /> Projektstatus</h2>
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

            {/* Typ 3 – bekräftelse vid leverans */}
            {isTyp3 && isDelivered && projectStatus !== 'completed' && (
              <div className={`${styles.myorder__delivery} card`}>
                <h2 className={orderStyles.section_title}><Package size={18} /> Leverans</h2>
                <p className={orderStyles.progress_hint}>
                  {order.seller_name} har markerat uppdraget som levererat. Stämmer allt?
                </p>
                <div className={styles.delivery_actions}>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmDelivery}
                    disabled={confirmingDelivery}
                  >
                    {confirmingDelivery ? 'Bekräftar...' : <><CheckCircle size={16} /> Ja, allt är okej!</>}
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ color: 'var(--color-orange)', borderColor: 'var(--color-orange)' }}
                    onClick={() => setShowDisputeForm(true)}
                  >
                    ⚠️ Något stämmer inte
                  </button>
                </div>
                <p className={styles.delivery_auto_hint}>
                  Om du inte svarar bekräftas uppdraget automatiskt inom 24 timmar.
                </p>
              </div>
            )}

          </div>

          {/* Höger */}
          <div className={styles.myorder__sidebar}>

            <div className={`${styles.seller_card} card`}>
              <h2 className={orderStyles.section_title}><Wrench size={18} /> Utförare</h2>
              <div className={orderStyles.customer_avatar}>{order.seller_name?.charAt(0).toUpperCase()}</div>
              <strong className={orderStyles.customer_name}>{order.seller_name}</strong>
              <Link href={`/provider/${order.seller_id}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                <User size={16} /> Se profil
              </Link>
            </div>

            {/* CHATT */}
            {order.status === 'accepted' && (
              <div className={`${styles.svipposafe_card} card`}>
                <div className={styles.svipposafe__header}>
                  <MessageCircle size={18} />
                  <strong>Meddelanden</strong>
                </div>
                <p className={styles.svipposafe__text}>
                  Kommunicera med {order.seller_name} om uppdraget.
                </p>
                <Link href={`/messages?orderId=${order.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <MessageCircle size={16} /> Öppna chatten
                </Link>
              </div>
            )}

            {/* SvippoSafe */}
            {order.status === 'accepted' && projectStatus !== 'completed' && !hasDispute && (
              <div className={`${styles.svipposafe_card} card`}>
                <div className={styles.svipposafe__header}>
                  <Shield size={18} />
                  <strong>SvippoSafe</strong>
                </div>
                <p className={styles.svipposafe__text}>
                  Om något inte stämmer med ditt uppdrag hjälper vi till att lösa det.
                </p>
                {!showDisputeForm ? (
                  <button
                    className={`btn btn-outline ${styles.svipposafe__btn}`}
                    onClick={() => setShowDisputeForm(true)}
                  >
                    ⚠️ Rapportera ett problem
                  </button>
                ) : (
                  <div className={styles.dispute_form}>
                    <label className={styles.dispute_label}>Berätta vad som hände</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Beskriv problemet så hjälper vi dig..."
                      value={disputeMessage}
                      onChange={e => setDisputeMessage(e.target.value)}
                      rows={4}
                    />
                    <div className={styles.dispute_actions}>
                      <button
                        className="btn btn-outline"
                        onClick={() => { setShowDisputeForm(false); setDisputeMessage('') }}
                      >
                        Avbryt
                      </button>
                      <button
                        className="btn btn-orange"
                        onClick={handleDispute}
                        disabled={!disputeMessage || disputeSending}
                      >
                        {disputeSending ? 'Skickar...' : 'Skicka'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {disputeSent && (
              <div className={`${styles.svipposafe_card} card`}>
                <div className={styles.dispute_sent}>
                  <CheckCircle size={18} />
                  <div>
                    <strong>Ärendet är skickat</strong>
                    <p>Vi återkommer inom 24 timmar.</p>
                  </div>
                </div>
              </div>
            )}

            {projectStatus === 'completed' && !alreadyReviewed && !reviewSuccess && (
              <div className={`${orderStyles.review_card} card`}>
                <h2 className={orderStyles.section_title}><Star size={18} /> Lämna en recension</h2>
                <p className={orderStyles.progress_hint}>Hur var din upplevelse med {order.seller_name}?</p>
                {showReviewForm ? (
                  <div className={orderStyles.review_form}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                          {n <= reviewRating ? <Star size={22} fill="currentColor" /> : <Star size={22} />}
                        </button>
                      ))}
                    </div>
                    <textarea className="form-textarea" placeholder={`Beskriv din upplevelse med ${order.seller_name}...`} value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} />
                    <button className="btn btn-primary" onClick={handleReview} disabled={!reviewText}>Skicka recension</button>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowReviewForm(true)}>
                    <Star size={16} /> Recensera {order.seller_name}
                  </button>
                )}
              </div>
            )}

            {(alreadyReviewed || reviewSuccess) && (
              <div className={`${orderStyles.review_card} card`}>
                <div className={orderStyles.payment_done}><Star size={16} /> Du har lämnat en recension!</div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Avvikelse-popup för Typ 3 */}
      {showDisputeForm && isTyp3 && (
        <div className="modal-backdrop" onClick={() => setShowDisputeForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>⚠️ Rapportera ett problem</h2>
            <p style={{ color: 'var(--color-gray)', marginBottom: '16px' }}>Berätta vad som hände så hjälper vi dig.</p>
            <textarea
              className="form-textarea"
              placeholder="Beskriv problemet..."
              value={disputeMessage}
              onChange={e => setDisputeMessage(e.target.value)}
              rows={4}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowDisputeForm(false)}>Avbryt</button>
              <button
                className="btn btn-orange"
                onClick={handleDispute}
                disabled={!disputeMessage || disputeSending}
              >
                {disputeSending ? 'Skickar...' : 'Skicka ärendet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}