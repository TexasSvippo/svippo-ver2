'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from '@/styles/orderdetail.module.scss'
import { Package, Clock, CheckCircle, XCircle, Link as LinkIcon, ClipboardList, Star, User, MessageCircle, BarChart2, Wallet, ArrowLeft, Tag, Calendar } from 'lucide-react'
import { renderStars } from '@/utils/renderStars'

type ProjectStatus = 'not_started' | 'in_progress' | 'almost_done' | 'awaiting_confirmation' | 'completed'
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
  from_request?: boolean
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
    const update = status === 'accepted' ? { status, project_status: 'in_progress' as ProjectStatus } : { status }
    await supabase.from('orders').update(update).eq('id', order.id)
    setOrder(prev => prev ? { ...prev, ...update } : prev)

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
  const PROGRESS_STEPS = [
    { status: 'not_started' as ProjectStatus, label: 'Ej påbörjat', desc: 'Projektet väntar på att starta', num: 1 },
    { status: 'in_progress' as ProjectStatus, label: 'Pågår', desc: 'Projektet är igång', num: 2 },
    { status: 'completed' as ProjectStatus, label: 'Markera som klart', desc: 'Slutför uppdraget', num: 3 },
  ]

  const stepOrder = ['not_started', 'in_progress', 'completed']
  const currentIdx = (projectStatus === 'almost_done' || projectStatus === 'awaiting_confirmation')
    ? 1
    : stepOrder.indexOf(projectStatus)

  const dotColor = projectStatus === 'completed' ? 'green'
    : projectStatus === 'awaiting_confirmation' ? 'blue'
    : isCancelled ? 'gray'
    : order.status === 'accepted' ? 'blue'
    : order.status === 'pending' ? 'gray'
    : 'red'

  const statusLabel = projectStatus === 'completed' ? 'Slutfört'
    : projectStatus === 'awaiting_confirmation' ? 'Inväntar beställarens bekräftelse'
    : isCancelled ? 'Avbrutet'
    : order.status === 'accepted' ? 'Aktivt'
    : order.status === 'pending' ? 'Väntar på svar'
    : 'Nekat'

  const priceDisplay = order.active_price != null
    ? `Godkänt pris: ${order.active_price} kr`
    : order.price_type === 'fastpris' ? 'Fastpris'
    : order.price_type === 'timpris' ? 'Timpris'
    : order.price_type === 'offert' ? 'Offert'
    : null

  const sellerNextStep = projectStatus === 'completed' ? 'Uppdraget är avslutat'
    : projectStatus === 'awaiting_confirmation' ? 'Inväntar beställarens bekräftelse'
    : order.status === 'pending' ? 'Inväntar ditt godkännande'
    : order.price_status === 'proposal_pending' ? 'Väntar på beställarens godkännande av prisförslag'
    : order.price_status === 'price_approved' ? 'Uppdraget pågår'
    : 'Skicka ett prisförslag till beställaren'

  const t0 = new Date(order.created_at).getTime()
  const feedEvents: Array<{ id: string; icon: React.ReactNode; iconType: string; text: string; ts: string }> = [
    { id: 'created', icon: <Package size={14} />, iconType: 'created', text: 'Beställningen skapades', ts: order.created_at },
  ]
  if (order.status === 'accepted') {
    feedEvents.push({ id: 'status', icon: <CheckCircle size={14} />, iconType: 'accepted', text: 'Du godkände beställningen', ts: new Date(t0 + 60000).toISOString() })
  } else if (order.status === 'rejected') {
    feedEvents.push({ id: 'status', icon: <XCircle size={14} />, iconType: 'rejected', text: 'Du nekade beställningen', ts: new Date(t0 + 60000).toISOString() })
  } else if (isCancelled) {
    feedEvents.push({ id: 'status', icon: <XCircle size={14} />, iconType: 'rejected', text: 'Du avbröt beställningen', ts: new Date(t0 + 60000).toISOString() })
  }
  for (const p of proposals) {
    if (p.status === 'approved' && p.responded_at) {
      feedEvents.push({ id: `p-${p.id}`, icon: <CheckCircle size={14} />, iconType: 'approved', text: `Prisförslag godkänt – ${p.amount} kr`, ts: p.responded_at })
    } else if (p.status === 'rejected' && p.responded_at) {
      feedEvents.push({ id: `p-${p.id}`, icon: <XCircle size={14} />, iconType: 'price_rejected', text: `Prisförslag avböjt – ${p.amount} kr`, ts: p.responded_at })
    } else {
      feedEvents.push({ id: `p-${p.id}`, icon: <Tag size={14} />, iconType: 'pending', text: `Prisförslag skickat – ${p.amount} kr`, ts: p.created_at })
    }
  }
  if (projectStatus !== 'not_started') {
    const psLabel = projectStatus === 'in_progress' ? 'Pågår'
      : projectStatus === 'almost_done' ? 'Nästan klart'
      : projectStatus === 'awaiting_confirmation' ? 'Inväntar bekräftelse'
      : projectStatus === 'completed' ? 'Slutfört'
      : projectStatus
    feedEvents.push({ id: 'project-status', icon: <BarChart2 size={14} />, iconType: 'status', text: `Projektstatus uppdaterad till: ${psLabel}`, ts: new Date(t0 + 120000).toISOString() })
  }
  if (projectStatus === 'awaiting_confirmation') {
    feedEvents.push({ id: 'awaiting', icon: <CheckCircle size={14} />, iconType: 'status', text: 'Uppdraget markerat som klart – inväntar beställarens bekräftelse', ts: new Date(t0 + 180000).toISOString() })
  }
  if (projectStatus === 'completed') {
    feedEvents.push({ id: 'completed', icon: <CheckCircle size={14} />, iconType: 'completed', text: 'Uppdraget markerades som klart', ts: new Date(t0 + 180000).toISOString() })
  }
  feedEvents.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

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
              <>
                <div className={`${styles.orderdetail__header} staticcard`}>
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

                <div className={`${styles.status_summary} staticcard`}>
                  <div className={styles.status_summary__item}>
                    <span className={styles.status_summary__label}>Status</span>
                    <span className={styles.status_summary__value}>
                      <span className={`${styles.status_dot} ${styles[`status_dot--${dotColor}`]}`} />
                      {statusLabel}
                    </span>
                  </div>
                  {priceDisplay && (
                    <div className={styles.status_summary__item}>
                      <span className={styles.status_summary__label}>Pris</span>
                      <span className={styles.status_summary__value}>{priceDisplay}</span>
                    </div>
                  )}
                  <div className={styles.status_summary__item}>
                    <span className={styles.status_summary__label}>Nästa steg</span>
                    <span className={styles.status_summary__next}>{sellerNextStep}</span>
                  </div>
                </div>
                <div className={`${styles.orderdetail__form} staticcard`}>
                  <div className={styles.feed}>
                    {feedEvents.map(e => (
                      <div key={e.id} className={styles.feed__item}>
                        <div className={`${styles.feed__icon} ${styles[`feed__icon--${e.iconType}`]}`}>{e.icon}</div>
                        <span className={styles.feed__text}>{e.text}</span>
                        <span className={styles.feed__date}>{new Date(e.ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className={`${styles.tab_actions} staticcard`}>
                    <button className="btn btn-primary" onClick={() => handleStatus('accepted')} disabled={updating}>
                      <CheckCircle size={16} /> Godkänn beställning
                    </button>
                    <button className={`btn btn-outline ${styles.reject_btn}`} onClick={() => handleStatus('rejected')} disabled={updating}>
                      <XCircle size={16} /> Neka beställning
                    </button>
                  </div>
                )}

                {order.status === 'accepted' && projectStatus !== 'completed' && projectStatus !== 'awaiting_confirmation' && (
                  <div className={`${styles.tab_actions} staticcard`}>
                    <button className="btn btn-primary" onClick={() => router.push(`/order/${order.id}/complete`)}>
                      <CheckCircle size={16} /> Markera som klart
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowPriceForm(true)}>
                      <Tag size={16} /> Föreslå nytt pris
                    </button>
                  </div>
                )}

                {order.status === 'accepted' && projectStatus === 'awaiting_confirmation' && (
                  <div className={`${styles.tab_actions} staticcard`}>
                    <p className={styles.tab_actions__info}>Inväntar beställarens bekräftelse</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'detaljer' && (
              <>
                <div className={`${styles.orderdetail__header} staticcard`}>
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
                  <div className={`${styles.orderdetail__type_info} staticcard`}>
                    <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📅 Datum & plats</h2>
                    <div className={styles.type_info_grid}>
                      {preferredDate && <div className={styles.type_info_item}><span className={styles.type_info_label}>Önskat datum</span><strong>{preferredDate}</strong></div>}
                      {preferredTime && <div className={styles.type_info_item}><span className={styles.type_info_label}>Önskad tid</span><strong>{preferredTime}</strong></div>}
                      {address && <div className={styles.type_info_item}><span className={styles.type_info_label}>Adress</span><strong>{address}</strong></div>}
                    </div>
                  </div>
                )}

                {serviceType === 'typ2' && (desiredDeadline || milestones) && (
                  <div className={`${styles.orderdetail__type_info} staticcard`}>
                    <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> Tidslinje</h2>
                    <div className={styles.type_info_grid}>
                      {desiredDeadline && <div className={styles.type_info_item}><span className={styles.type_info_label}>Önskat slutdatum</span><strong>{desiredDeadline}</strong></div>}
                      {milestones && <div className={`${styles.type_info_item} ${styles['type_info_item--full']}`}><span className={styles.type_info_label}>Föreslagna milstolpar</span><p className={styles.type_info_text}>{milestones}</p></div>}
                    </div>
                  </div>
                )}

                {serviceType === 'typ3' && (pickupAddress || deliveryAddress) && (
                  <div className={`${styles.orderdetail__type_info} staticcard`}>
                    <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={18} /> Upphämtning & leverans</h2>
                    <div className={styles.type_info_grid}>
                      {pickupAddress && <div className={styles.type_info_item}><span className={styles.type_info_label}>Upphämtning</span><strong>{pickupAddress}</strong></div>}
                      {deliveryAddress && <div className={styles.type_info_item}><span className={styles.type_info_label}>Leverans</span><strong>{deliveryAddress}</strong></div>}
                      {pickupDate && <div className={styles.type_info_item}><span className={styles.type_info_label}>Datum</span><strong>{pickupDate}</strong></div>}
                      {pickupTime && <div className={styles.type_info_item}><span className={styles.type_info_label}>Tid</span><strong>{pickupTime}</strong></div>}
                    </div>
                  </div>
                )}

                <div className={`${styles.orderdetail__form} staticcard`}>
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

                <div className={`${styles.orderdetail__buyer_reviews} staticcard`}>
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
              <div className={`${styles.orderdetail__form} staticcard`} style={{ color: 'var(--color-gray)', fontSize: '14px', fontStyle: 'italic' }}>
                Leveranser kommer snart
              </div>
            )}

          </div>

          {/* Höger */}
          <div className={styles.orderdetail__sidebar}>

            <div className={`${styles.customer_card} staticcard`}>
              <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Kundinformation</h2>
              <div className={styles.customer_avatar}>
                {buyerAvatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={buyerAvatarUrl} alt={order.buyer_name} className={styles.customer_avatar_img} />
                  : order.buyer_name?.charAt(0).toUpperCase()
                }
              </div>
              <strong className={styles.customer_name}>{order.buyer_name}</strong>
              <Link href={`/messages?orderId=${order.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                <MessageCircle size={16} /> Meddela
              </Link>
            </div>

            {order.status === 'accepted' && isSeller && (
              <div className={`${styles.progress_card} staticcard`}>
                <h2 className={styles.section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BarChart2 size={18} /> Projektstatus</h2>
                <p className={styles.progress_hint}>Uppdragets nuvarande fas.</p>
                <div className={styles.progress_steps}>
                  {PROGRESS_STEPS.map((step, idx) => {
                    const allDone = projectStatus === 'completed'
                    const displayIdx = (projectStatus === 'awaiting_confirmation' || projectStatus === 'completed') ? 2
                      : (projectStatus === 'in_progress' || projectStatus === 'almost_done') ? 1 : 0
                    const isDone = allDone || idx < displayIdx
                    const isActive = !allDone && idx === displayIdx
                    const isCompleted = allDone

                    return (
                      <div
                        key={step.status}
                        className={`${styles.progress_step} ${isActive ? styles['progress_step--active'] : ''} ${isDone ? styles['progress_step--done'] : ''} ${isCompleted ? styles['progress_step--completed'] : ''}`}
                      >
                        <div className={styles.progress_dot}>{isDone || isCompleted ? '✓' : step.num}</div>
                        <div className={styles.progress_info}>
                          <strong>{step.label}</strong>
                          <span>{step.desc}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {order.status === 'accepted' && isSeller && order.project_status !== 'completed' && (
              <div className={`${styles.price_card} staticcard`}>
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
              <div className={`${styles.payment_card} staticcard`}>
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

          </div>
        </div>
      </div>

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