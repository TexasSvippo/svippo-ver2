'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from '@/styles/orderdetail.module.scss'
import { Package, Clock, CheckCircle, XCircle, Link as LinkIcon, ClipboardList, Star, User, Mail, Smartphone, MessageCircle, Zap, BarChart2, Wallet, Lock, ArrowLeft, Tag } from 'lucide-react'
import { renderStars } from '@/utils/renderStars'

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
  price_type: string | null
  active_price: number | null
  price_status: string | null
  conversation_id: string | null
}

type PriceProposal = {
  id: string
  order_id: string
  proposed_by: string
  amount: number
  currency: string
  note: string | null
  status: string
  responded_by: string | null
  responded_at: string | null
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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successType, setSuccessType] = useState<'delivered' | 'completed'>('completed')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [buyerReviews, setBuyerReviews] = useState<Review[]>([])
  const [buyerAvatarUrl, setBuyerAvatarUrl] = useState<string | null>(null)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [proposals, setProposals] = useState<PriceProposal[]>([])
  const [showPriceForm, setShowPriceForm] = useState(false)
  const [priceAmount, setPriceAmount] = useState('')
  const [priceNote, setPriceNote] = useState('')
  const [priceSubmitting, setPriceSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'aktivitet' | 'detaljer' | 'leveranser'>('aktivitet')

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

        const { data: proposalsData } = await supabase
          .from('price_proposals')
          .select('*')
          .eq('order_id', id)
          .order('created_at', { ascending: false })
        setProposals(proposalsData ?? [])
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
      action_url: `/my-order/${order.id}`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })
    setUpdating(false)
  }

  // Typ1 & Typ2 – markera som slutfört direkt
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
          actor_name: order.seller_name,
          message: `${order.seller_name} har markerat projektet "${order.service_title}" som slutfört!`,
          action_url: `/my-order/${order.id}`,
          read: false,
          dismissed: false,
          email_sent: false,
          created_at: new Date().toISOString(),
        },
        {
          user_id: order.seller_id,
          type: 'request_review',
          order_id: order.id,
          service_title: order.service_title,
          message: `Projektet "${order.service_title}" är slutfört – glöm inte ta betalt och lämna en recension!`,
          read: false,
          dismissed: false,
          email_sent: false,
          created_at: new Date().toISOString(),
        }
      ])
    }
    setUpdating(false)
  }

  // Typ3 – "Slutfört" triggar leveransflödet istället
  const handleTyp3Complete = async () => {
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
      action_url: `/my-order/${order.id}`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: now,
    })

    setUpdating(false)
  }

  const handlePayment = async (status: 'paid' | 'unpaid') => {
    if (!order) return
    setUpdating(true)
    await supabase.from('orders').update({ payment_status: status }).eq('id', order.id)
    setOrder(prev => prev ? { ...prev, payment_status: status } : prev)
    setUpdating(false)
  }

  const handleSubmitProposal = async () => {
    if (!order || !priceAmount) return
    setPriceSubmitting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/price-proposals', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          amount: Number(priceAmount),
          note: priceNote || undefined,
        }),
      })
      if (res.ok) {
        const { data } = await supabase
          .from('price_proposals')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: false })
        setProposals(data ?? [])
        setOrder(prev => prev ? { ...prev, price_status: 'proposal_pending' } : prev)
        setShowPriceForm(false)
        setPriceAmount('')
        setPriceNote('')
      }
    } finally {
      setPriceSubmitting(false)
    }
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
      <button className="btn btn-primary" onClick={() => router.push('/profile')}>Tillbaka till profil</button>
    </div>
  )

  const isSeller = user?.id === order.seller_id
  const isBuyer = user?.id === order.buyer_id
  const isCancelled = (order.status as string) === 'cancelled' || (order.project_status as string) === 'cancelled'
  const projectStatus = order.project_status
  const serviceType = order.service_type ?? 'typ1'
  const isTyp3 = serviceType === 'typ3'

  const preferredDate = order.answers?.['Önskat datum']
  const preferredTime = order.answers?.['Önskad tid']
  const address = order.answers?.['Adress']
  const desiredDeadline = order.answers?.['Önskat slutdatum']
  const milestones = order.answers?.['Föreslagna milstolpar']
  const pickupAddress = order.answers?.['Upphämtningsadress']
  const deliveryAddress = order.answers?.['Leveransadress']
  const pickupDate = order.answers?.['Datum']
  const pickupTime = order.answers?.['Tid']

  const typeSpecificKeys = ['Önskat datum', 'Önskad tid', 'Adress', 'Önskat slutdatum', 'Föreslagna milstolpar', 'Upphämtningsadress', 'Leveransadress', 'Datum', 'Tid']
  const filteredAnswers = order.answers
    ? Object.fromEntries(Object.entries(order.answers).filter(([key]) => !typeSpecificKeys.includes(key)))
    : {}

  // Typ3: sista steget heter "Markera som levererat" och triggar leveransflödet
  const PROGRESS_STEPS = isTyp3 ? [
    { status: 'not_started' as ProjectStatus, label: 'Ej påbörjat', desc: 'Uppdraget väntar på att starta', num: 1 },
    { status: 'in_progress' as ProjectStatus, label: 'Pågår', desc: 'Uppdraget är igång', num: 2 },
    { status: 'almost_done' as ProjectStatus, label: 'Nästan klart', desc: 'Sista finishen återstår', num: 3 },
    { status: 'completed' as ProjectStatus, label: 'Markera som levererat', desc: order.delivered_at ? 'Väntar på bekräftelse från beställaren' : 'Klicka när du levererat uppdraget', num: 4 },
  ] : [
    { status: 'not_started' as ProjectStatus, label: 'Ej påbörjat', desc: 'Projektet väntar på att starta', num: 1 },
    { status: 'in_progress' as ProjectStatus, label: 'Pågår', desc: 'Projektet är igång', num: 2 },
    { status: 'almost_done' as ProjectStatus, label: 'Nästan klart', desc: 'Sista finishen återstår', num: 3 },
    { status: 'completed' as ProjectStatus, label: 'Slutfört', desc: 'Projektet är klart! 🎉', num: 4 },
  ]

  const stepOrder = ['not_started', 'in_progress', 'almost_done', 'completed']
  const currentIdx = isTyp3
    ? (order.delivered_at ? 3 : stepOrder.indexOf(projectStatus))
    : stepOrder.indexOf(projectStatus)

  return (
    <div className={`${styles.orderdetail} ${projectStatus === 'completed' && !isTyp3 ? styles['orderdetail--completed'] : ''}`}>
      <div className={`container ${styles.orderdetail__inner}`}>

        <button className={styles.orderdetail__back} onClick={() => router.push('/profile')}>
          <ArrowLeft size={16} /> Tillbaka till profil
        </button>

        {projectStatus === 'completed' && !isTyp3 && (
          <div className={styles.completed_banner}>🎉 Detta projekt är avslutat</div>
        )}

        {isTyp3 && order.delivered_at && projectStatus !== 'completed' && (
          <div className={styles.completed_banner} style={{ background: '#fff3e0', color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={16} /> Väntar på bekräftelse från {order.buyer_name}
          </div>
        )}

        {isTyp3 && projectStatus === 'completed' && (
          <div className={styles.completed_banner}>🎉 Uppdraget är bekräftat och avslutat</div>
        )}

        <div className={styles.orderdetail__layout}>

          {/* Vänster */}
          <div className={styles.orderdetail__main}>

            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'aktivitet' ? styles['tab--active'] : ''}`}
                onClick={() => setActiveTab('aktivitet')}
              >
                Aktivitet
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'detaljer' ? styles['tab--active'] : ''}`}
                onClick={() => setActiveTab('detaljer')}
              >
                Detaljer
              </button>
              {serviceType === 'typ2' && (
                <button
                  className={`${styles.tab} ${activeTab === 'leveranser' ? styles['tab--active'] : ''}`}
                  onClick={() => setActiveTab('leveranser')}
                >
                  Leveranser
                </button>
              )}
            </div>

            {activeTab === 'aktivitet' && (
              <div className={`${styles.orderdetail__form} card`} style={{ color: 'var(--color-gray)', fontSize: '14px', fontStyle: 'italic' }}>
                Aktivitetsfeed kommer snart
              </div>
            )}

            {activeTab === 'detaljer' && (
              <>
                <div className={`${styles.orderdetail__header} card`}>
                  <div className={styles.header_top}>
                    <div>
                      <span className={styles.label}>Beställning av</span>
                      <h1 className={styles.title}>{order.service_title}</h1>
                      <span className={styles.date}>
                        {new Date(order.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={`${styles.status_badge} ${styles[`status--${order.status}`]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {order.status === 'pending' ? <><Clock size={14} /> Väntar</> : order.status === 'accepted' ? <><CheckCircle size={14} /> Godkänd</> : <><XCircle size={14} /> Nekad</>}
                    </span>
                  </div>
                  <Link
                    href={order.from_request ? `/request/${order.service_id}` : `/service/${order.service_id}`}
                    className={styles.service_link}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <LinkIcon size={16} /> {order.from_request ? 'Visa förfrågan →' : 'Visa tjänsten →'}
                  </Link>
                </div>

                {serviceType === 'typ1' && (preferredDate || address) && (
                  <div className={`${styles.orderdetail__type_info} card`}>
                    <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Datum & plats</h2>
                    <div className={styles.type_info_grid}>
                      {preferredDate && <div className={styles.type_info_item}><span className={styles.type_info_label}>Önskat datum</span><strong>{preferredDate}</strong></div>}
                      {preferredTime && <div className={styles.type_info_item}><span className={styles.type_info_label}>Önskad tid</span><strong>{preferredTime}</strong></div>}
                      {address && <div className={styles.type_info_item}><span className={styles.type_info_label}>Adress</span><strong>{address}</strong></div>}
                    </div>
                  </div>
                )}

                {serviceType === 'typ2' && (desiredDeadline || milestones) && (
                  <div className={`${styles.orderdetail__type_info} card`}>
                    <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🗓️ Tidslinje</h2>
                    <div className={styles.type_info_grid}>
                      {desiredDeadline && <div className={styles.type_info_item}><span className={styles.type_info_label}>Önskat slutdatum</span><strong>{desiredDeadline}</strong></div>}
                      {milestones && <div className={`${styles.type_info_item} ${styles['type_info_item--full']}`}><span className={styles.type_info_label}>Föreslagna milstolpar</span><p className={styles.type_info_text}>{milestones}</p></div>}
                    </div>
                  </div>
                )}

                {serviceType === 'typ3' && (pickupAddress || deliveryAddress) && (
                  <div className={`${styles.orderdetail__type_info} card`}>
                    <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={18} /> Upphämtning & leverans</h2>
                    <div className={styles.type_info_grid}>
                      {pickupAddress && <div className={styles.type_info_item}><span className={styles.type_info_label}>Upphämtning</span><strong>{pickupAddress}</strong></div>}
                      {deliveryAddress && <div className={styles.type_info_item}><span className={styles.type_info_label}>Leverans</span><strong>{deliveryAddress}</strong></div>}
                      {pickupDate && <div className={styles.type_info_item}><span className={styles.type_info_label}>Datum</span><strong>{pickupDate}</strong></div>}
                      {pickupTime && <div className={styles.type_info_item}><span className={styles.type_info_label}>Tid</span><strong>{pickupTime}</strong></div>}
                    </div>
                  </div>
                )}

                <div className={`${styles.orderdetail__form} card`}>
                  <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={18} /> Ifyllt formulär</h2>
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

                <div className={`${styles.orderdetail__buyer_reviews} card`}>
                  <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={18} /> {order.buyer_name}s recensioner</h2>
                  {buyerReviews.length === 0 ? (
                    <p className={styles.no_reviews}>{order.buyer_name} har inga tidigare recensioner på Svippo än.</p>
                  ) : (
                    <div className={styles.buyer_reviews_list}>
                      {buyerReviews.map(r => (
                        <div key={r.id} className={styles.buyer_review}>
                          <div className={styles.buyer_review__header}>
                            <span className={styles.buyer_review__service}>{r.service_title}</span>
                            <span className={styles.buyer_review__stars}>{renderStars(r.rating, 14)}</span>
                          </div>
                          {r.comment && <p className={styles.buyer_review__comment}>{r.comment}</p>}
                          <span className={styles.buyer_review__date}>{new Date(r.created_at).toLocaleDateString('sv-SE')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'leveranser' && (
              <div className={`${styles.orderdetail__form} card`} style={{ color: 'var(--color-gray)', fontSize: '14px', fontStyle: 'italic' }}>
                Leveranser kommer snart
              </div>
            )}

          </div>

          {/* Höger */}
          <div className={styles.orderdetail__sidebar}>

            <div className={`${styles.customer_card} card`}>
              <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Kundinformation</h2>
              <div className={styles.customer_avatar}>
                {buyerAvatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={buyerAvatarUrl} alt={order.buyer_name} className={styles.customer_avatar_img} />
                  : order.buyer_name?.charAt(0).toUpperCase()
                }
              </div>
              <strong className={styles.customer_name}>{order.buyer_name}</strong>
              <div className={styles.customer_details}>
                <div className={styles.detail_row}><Mail size={16} /><a href={`mailto:${order.buyer_email}`}>{order.buyer_email}</a></div>
                {order.buyer_phone && <div className={styles.detail_row}><Smartphone size={16} /><a href={`tel:${order.buyer_phone}`}>{order.buyer_phone}</a></div>}
              </div>
              <div className={styles.contact_actions}>
                <a href={`mailto:${order.buyer_email}`} className="btn btn-primary">✉️ Skicka e-post</a>
                {order.buyer_phone && <a href={`tel:${order.buyer_phone}`} className="btn btn-outline"><Smartphone size={16} /> Ring kunden</a>}
              </div>
            </div>

            {order.status === 'accepted' && isSeller && (
              <div className={`${styles.chat_card} card`}>
                <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={18} /> Meddelanden</h2>
                <p className={styles.progress_hint}>Kommunicera med {order.buyer_name} om uppdraget.</p>
                <Link href={`/messages?orderId=${order.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <MessageCircle size={16} /> Öppna chatten
                </Link>
              </div>
            )}

            {(isSeller || (isCancelled && isBuyer)) && (
              <div className={`${styles.actions_card} card`}>
                <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={18} /> Hantera beställning</h2>
                <div className={`${styles.current_status} ${styles[`status--${order.status}`]}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {isCancelled
                    ? isSeller
                      ? <><XCircle size={14} /> Beställaren avbokade detta uppdrag.</>
                      : <><XCircle size={14} /> Du avbokade detta uppdrag.</>
                    : order.status === 'pending'
                    ? <><Clock size={14} /> Väntar på ditt svar</>
                    : order.status === 'accepted'
                    ? <><CheckCircle size={14} /> Du har godkänt denna beställning</>
                    : <><XCircle size={14} /> Du har nekat denna beställning</>
                  }
                </div>
                {!isCancelled && order.status === 'pending' && (
                  <div className={styles.action_btns}>
                    <button className="btn btn-primary" onClick={() => handleStatus('accepted')} disabled={updating}><CheckCircle size={16} /> Godkänn beställning</button>
                    <button className={`btn btn-outline ${styles.reject_btn}`} onClick={() => handleStatus('rejected')} disabled={updating}><XCircle size={16} /> Neka beställning</button>
                  </div>
                )}
                {!isCancelled && order.status === 'rejected' && (
                  <button className="btn btn-primary" onClick={() => handleStatus('accepted')} disabled={updating}>Ångra – Godkänn beställning</button>
                )}
              </div>
            )}

            {order.status === 'accepted' && isSeller && (
              <div className={`${styles.progress_card} card`}>
                <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={18} /> Projektstatus</h2>
                <p className={styles.progress_hint}>
                  {isTyp3 ? 'Uppdatera hur uppdraget fortskrider.' : 'Uppdatera hur långt projektet kommit.'}
                </p>
                <div className={styles.progress_steps}>
                  {PROGRESS_STEPS.map((step, idx) => {
                    const isDone = idx < currentIdx
                    const isActive = idx === currentIdx
                    const isCompleted = !isTyp3 && step.status === 'completed' && projectStatus === 'completed'
                    const isDelivered = isTyp3 && idx === 3 && !!order.delivered_at

                    return (
                      <button
                        key={step.status}
                        className={`${styles.progress_step} ${isActive || isDelivered ? styles['progress_step--active'] : ''} ${isDone ? styles['progress_step--done'] : ''} ${isCompleted ? styles['progress_step--completed'] : ''}`}
                        onClick={() => {
                          if (isTyp3 && idx === 3) {
                            if (!order.delivered_at) setShowCompleteConfirm(true)
                          } else if (!isTyp3 && step.status === 'completed') {
                            setShowCompleteConfirm(true)
                          } else {
                            handleProjectStatus(step.status)
                          }
                        }}
                        disabled={updating || (!isTyp3 && projectStatus === 'completed') || (isTyp3 && !!order.delivered_at && idx === 3)}
                      >
                        <div className={styles.progress_dot}>{isDone || isCompleted || isDelivered ? '✓' : step.num}</div>
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

            {order.status === 'accepted' && isSeller && order.project_status !== 'completed' && (
              <div className={`${styles.price_card} card`}>
                <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={18} /> Prisförslag</h2>

                {order.active_price != null && (
                  <div className={styles.price_active}>
                    <CheckCircle size={16} /> Godkänt pris: {order.active_price} kr
                  </div>
                )}

                {order.price_status === 'proposal_pending' && (
                  <div className={styles.price_pending_badge}>
                    <Clock size={14} /> Väntar på köparens godkännande
                  </div>
                )}

                {showPriceForm ? (
                  <div className={styles.price_form}>
                    <input
                      className={styles.price_form_input}
                      type="number"
                      placeholder="Belopp (kr)"
                      min={1}
                      value={priceAmount}
                      onChange={e => setPriceAmount(e.target.value)}
                    />
                    <input
                      className={styles.price_form_input}
                      type="text"
                      placeholder="Kommentar (valfritt)"
                      value={priceNote}
                      onChange={e => setPriceNote(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" onClick={() => { setShowPriceForm(false); setPriceAmount(''); setPriceNote('') }}>Avbryt</button>
                      <button className="btn btn-primary" onClick={handleSubmitProposal} disabled={!priceAmount || priceSubmitting}>
                        {priceSubmitting ? 'Skickar...' : 'Skicka förslag'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowPriceForm(true)}>
                    <Tag size={16} /> Föreslå pris
                  </button>
                )}

                {proposals.length > 0 && (
                  <div className={styles.price_history}>
                    {proposals.map(p => (
                      <div key={p.id} className={styles.price_history_item}>
                        <div className={styles.price_history_row}>
                          <strong>{p.amount} kr</strong>
                          <span className={`${styles.price_status_badge} ${p.status === 'approved' ? styles['price_status_badge--approved'] : p.status === 'rejected' ? styles['price_status_badge--rejected'] : styles['price_status_badge--pending']}`}>
                            {p.status === 'approved' ? 'Godkänt' : p.status === 'rejected' ? 'Avböjt' : 'Väntar'}
                          </span>
                        </div>
                        {p.note && <p className={styles.price_history_note}>{p.note}</p>}
                        <span className={styles.price_history_date}>{new Date(p.created_at).toLocaleDateString('sv-SE')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {projectStatus === 'completed' && isSeller && (
              <div className={`${styles.payment_card} card`}>
                <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={18} /> Betalning</h2>
                <p className={styles.progress_hint}>Har du tagit betalt av {order.buyer_name}?</p>
                {order.payment_status === 'paid' ? (
                  <div className={styles.payment_done} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><CheckCircle size={16} /> Du har markerat betalningen som mottagen!</div>
                ) : (
                  <div className={styles.action_btns}>
                    <button className="btn btn-primary" onClick={() => handlePayment('paid')} disabled={updating}><CheckCircle size={16} /> Ja, jag har fått betalt</button>
                    <button className="btn btn-outline" onClick={() => handlePayment('unpaid')} disabled={updating}><Clock size={16} /> Inte än</button>
                  </div>
                )}
              </div>
            )}

            {projectStatus === 'completed' && isSeller && !hasReviewed && !reviewSuccess && (
              <div className={`${styles.review_card} card`}>
                <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={18} /> Lämna en recension</h2>
                {showReviewForm ? (
                  <div className={styles.review_form}>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '24px' }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px' }}>
                          {n <= reviewRating ? <Star size={22} fill="currentColor" /> : <Star size={22} />}
                        </button>
                      ))}
                    </div>
                    <textarea className="form-textarea" placeholder={`Beskriv din upplevelse med ${order.buyer_name}...`} value={reviewText} onChange={e => setReviewText(e.target.value)} rows={3} />
                    <button className="btn btn-primary" onClick={handleReview} disabled={!reviewText}>Skicka recension</button>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowReviewForm(true)}>
                    <Star size={16} /> Recensera {order.buyer_name}
                  </button>
                )}
              </div>
            )}

            {(hasReviewed || reviewSuccess) && projectStatus === 'completed' && isSeller && (
              <div className={`${styles.review_card} card`}>
                <div className={styles.payment_done} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Star size={16} /> Du har lämnat en recension för denna beställning!</div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Bekräftelsepopup – Typ1/2 slutfört, Typ3 levererat */}
      {showCompleteConfirm && (
        <div className="modal-backdrop" onClick={() => setShowCompleteConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              {isTyp3 ? 'Markera som levererat? 📦' : 'Är du säker? 🎉'}
            </h2>
            <p style={{ color: 'var(--color-gray)', marginBottom: '16px' }}>
              {isTyp3
                ? 'Beställaren meddelas och får 24 timmar på sig att bekräfta eller rapportera ett problem.'
                : 'Detta går inte att ångra. Projektet markeras som slutfört och beställaren meddelas.'}
            </p>
            <div className={styles.confirm_checklist}>
              {isTyp3 ? (
                <>
                  <div className={styles.confirm_item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={14} /> Beställaren meddelas att leveransen är gjord</div>
                  <div className={styles.confirm_item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} /> Beställaren bekräftar eller rapporterar problem</div>
                  <div className={styles.confirm_item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⏱️ Auto-bekräftelse sker efter 24 timmar om inget svar</div>
                </>
              ) : (
                <>
                  <div className={styles.confirm_item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} /> Beställaren meddelas att projektet är klart</div>
                  <div className={styles.confirm_item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Star size={14} /> Båda parter får möjlighet att lämna recensioner</div>
                  <div className={styles.confirm_item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={14} /> Du påminns om att ta betalt</div>
                  <div className={styles.confirm_item} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={14} /> Projektstatus låses och kan inte ändras</div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowCompleteConfirm(false)}>Avbryt</button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (isTyp3) {
                    await handleTyp3Complete()
                    setSuccessType('delivered')
                  } else {
                    await handleProjectStatus('completed')
                    setSuccessType('completed')
                  }
                  setShowCompleteConfirm(false)
                  setShowSuccessPopup(true)
                }}
                disabled={updating}
              >
                {updating ? 'Sparar...' : isTyp3 ? <><Package size={16} /> Ja, leveransen är gjord!</> : '🎉 Ja, projektet är klart!'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="modal-backdrop" onClick={() => setShowSuccessPopup(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px 32px', maxWidth: '400px' }}>
            <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '10px', color: 'var(--color-dark)' }}>
              Svippad och klar!
            </h2>
            <p style={{ color: 'var(--color-gray)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              {successType === 'delivered'
                ? 'Uppdraget är markerat som levererat. Beställaren granskar nu.'
                : 'Uppdraget är avslutat. Bra jobbat!'}
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowSuccessPopup(false)}
            >
              Grymt! Låt mig fortsätta
            </button>
          </div>
        </div>
      )}
      
    </div>
  )
}