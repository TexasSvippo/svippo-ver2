'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from '@/styles/orderdetail.module.scss'



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
  buyer_phone: string
  message: string
  answers?: Record<string, string>
  custom_answers?: Record<string, string>
  status: 'pending' | 'accepted' | 'rejected'
  project_status: ProjectStatus
  payment_status: 'unpaid' | 'paid'
  subcategory?: string
  created_at: string
}

type Props = {
  params: Promise<{ id: string }>
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

  useEffect(() => {
    const fetchOrder = async () => {
      const { id } = await params
      const { data } = await supabase.from('orders').select('*').eq('id', id).single()
      if (data) setOrder(data)
      setLoading(false)
    }
    fetchOrder()
  }, [])

  const handleStatus = async (status: 'accepted' | 'rejected') => {
    if (!order) return
    setUpdating(true)
    await supabase.from('orders').update({ status }).eq('id', order.id)
    setOrder(prev => prev ? { ...prev, status } : prev)
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

            <div className={`${styles.orderdetail__form} card`}>
              <h2 className={styles.section_title}>📋 Ifyllt formulär</h2>

              <div className={styles.field}>
                <span className={styles.field_label}>Meddelande</span>
                <div className={`${styles.field_value} ${styles.field_message}`}>{order.message}</div>
              </div>

              {order.answers && Object.keys(order.answers).length > 0 && (
                <div className={styles.field}>
                  <span className={styles.field_label}>Svar på frågor</span>
                  <div className={styles.answers}>
                    {Object.entries(order.answers).map(([key, value]) => (
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

          </div>

          {/* Höger */}
          <div className={styles.orderdetail__sidebar}>

            <div className={`${styles.customer_card} card`}>
              <h2 className={styles.section_title}>👤 Kundinformation</h2>
              <div className={styles.customer_avatar}>{order.buyer_name?.charAt(0).toUpperCase()}</div>
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

            {projectStatus === 'completed' && isSeller && !reviewSuccess && (
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

            {reviewSuccess && (
              <div className={`${styles.review_card} card`}>
                <div className={styles.payment_done}>⭐ Tack för din recension!</div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bekräftelsepopup */}
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