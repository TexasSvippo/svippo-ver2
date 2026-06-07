'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './intresseanmalningar.module.scss'
import { Star, User, CheckCircle, XCircle, Mail, ChevronDown } from 'lucide-react'

type IncomingInterest = {
  id: string
  request_id: string
  request_title: string
  svippar_id: string
  svippar_name: string
  svippar_email: string
  svippar_phone: string
  message: string
  price: number | null
  status: string
  created_at: string
  avatar_url?: string | null
  rating?: number | null
  reviews?: number
}

type RequestGroup = {
  request_id: string
  request_title: string
  request_meta: string
  interests: IncomingInterest[]
}

interface Props {
  userId: string
}

export default function Intresseanmalningar({ userId }: Props) {
  const [incomingInterests, setIncomingInterests] = useState<IncomingInterest[]>([])
  const [fetching, setFetching] = useState(true)
  const [interestAcceptingId, setInterestAcceptingId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const [interestFilterStatus, setInterestFilterStatus] = useState<'alla' | 'pending' | 'accepted' | 'rejected'>('alla')

  useEffect(() => {
    const fetchInterests = async () => {
      const { data: rawInterests } = await supabase
        .from('interests')
        .select('*')
        .eq('request_owner_id', userId)
        .order('created_at', { ascending: false })

      if (!rawInterests || rawInterests.length === 0) {
        setFetching(false)
        return
      }

      const svipparIds = [...new Set(rawInterests.map(i => i.svippar_id))]

      const { data: users } = await supabase
        .from('users')
        .select('id, avatar_url')
        .in('id', svipparIds)

      const { data: reviews } = await supabase
        .from('reviews')
        .select('reviewee_id, rating')
        .in('reviewee_id', svipparIds)
        .eq('role', 'buyer')

      const ratingMap: Record<string, { sum: number; count: number }> = {}
      reviews?.forEach(r => {
        if (!ratingMap[r.reviewee_id]) ratingMap[r.reviewee_id] = { sum: 0, count: 0 }
        ratingMap[r.reviewee_id].sum += r.rating
        ratingMap[r.reviewee_id].count += 1
      })

      const avatarMap: Record<string, string | null> = {}
      users?.forEach(u => { avatarMap[u.id] = u.avatar_url ?? null })

      const enriched = rawInterests.map(i => ({
        ...i,
        avatar_url: avatarMap[i.svippar_id] ?? null,
        rating: ratingMap[i.svippar_id]
          ? Math.round(ratingMap[i.svippar_id].sum / ratingMap[i.svippar_id].count * 10) / 10
          : null,
        reviews: ratingMap[i.svippar_id]?.count ?? 0,
      }))

      setIncomingInterests(enriched)
      setFetching(false)
    }
    fetchInterests()
  }, [userId])

  const handleAccept = async (interest: IncomingInterest) => {
    setInterestAcceptingId(interest.id)
    try {
      await supabase.from('interests').update({ status: 'accepted' }).eq('id', interest.id)

      // Update accepted interest in local state immediately after DB write
      setIncomingInterests(prev => prev.map(i => i.id === interest.id ? { ...i, status: 'accepted' } : i))

      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('from_request', true)
        .eq('service_id', interest.request_id)
        .maybeSingle()

      if (existingOrder) {
        alert('Du har redan valt en utförare för denna förfrågan.')
        setInterestAcceptingId(null)
        return
      }

      const { data: userData } = await supabase.from('users').select('name, email').eq('id', userId).single()

      const { data: requestData } = await supabase
        .from('requests')
        .select('budget_type')
        .eq('id', interest.request_id)
        .maybeSingle()
      const budgetType = requestData?.budget_type ?? 'offert'

      const { data: order } = await supabase.from('orders').insert({
        service_id: interest.request_id,
        service_title: interest.request_title,
        seller_id: interest.svippar_id,
        seller_name: interest.svippar_name,
        buyer_id: userId,
        buyer_name: userData?.name || '',
        buyer_email: userData?.email || '',
        buyer_phone: '',
        subcategory: '',
        message: interest.message,
        answers: {},
        custom_answers: {},
        status: 'accepted',
        project_status: 'not_started',
        payment_status: 'unpaid',
        from_request: true,
        created_at: new Date().toISOString(),
        price_type: budgetType,
        initial_price: budgetType === 'fastpris' && interest.price ? interest.price : null,
        hourly_rate: budgetType === 'timpris' && interest.price ? interest.price : null,
        price_status: interest.price ? 'price_approved' : 'no_price',
      }).select().single()

      await supabase.from('requests').update({ status: 'assigned' }).eq('id', interest.request_id)

      if (order) {
        await supabase.from('notifications').insert({
          user_id: interest.svippar_id,
          type: 'new_order',
          order_id: order.id,
          service_title: interest.request_title,
          actor_name: userData?.name || '',
          message: `Din intresseanmälan för "${interest.request_title}" har godkänts! 🎉`,
          action_url: `/order/${order.id}`,
          read: false,
          dismissed: false,
          email_sent: false,
          created_at: new Date().toISOString(),
        })
      }

      if (order && interest.price) {
        await supabase.from('price_proposals').insert({
          order_id: order.id,
          proposed_by: interest.svippar_id,
          amount: interest.price,
          currency: 'SEK',
          status: 'approved',
          responded_by: userId,
          responded_at: new Date().toISOString(),
        })
        await supabase.from('orders').update({
          active_price: interest.price,
          price_status: 'price_approved',
        }).eq('id', order.id)
      }

      // Auto-reject all other pending interests on the same request and notify them
      const otherPending = incomingInterests.filter(i =>
        i.request_id === interest.request_id && i.id !== interest.id && i.status === 'pending'
      )
      if (otherPending.length > 0) {
        await supabase.from('interests').update({ status: 'rejected' }).eq('request_id', interest.request_id).eq('status', 'pending').neq('id', interest.id)
        const rejectionNotifs = otherPending.map(other => ({
          user_id: other.svippar_id,
          type: 'interest_rejected',
          actor_name: '',
          message: `Tack för ditt intresse för "${interest.request_title}" – en annan utförare valdes den här gången.`,
          action_url: '/requests',
          read: false, dismissed: false, email_sent: false,
          created_at: new Date().toISOString(),
        }))
        await supabase.from('notifications').insert(rejectionNotifs)
        setIncomingInterests(prev => prev.map(i =>
          i.request_id === interest.request_id && i.id !== interest.id && i.status === 'pending'
            ? { ...i, status: 'rejected' }
            : i
        ))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInterestAcceptingId(null)
    }
  }

  const handleReject = async (interest: IncomingInterest) => {
    await supabase.from('interests').update({ status: 'rejected' }).eq('id', interest.id)

    // Update local state immediately after DB write
    setIncomingInterests(prev => prev.map(i => i.id === interest.id ? { ...i, status: 'rejected' } : i))

    await supabase.from('notifications').insert({
      user_id: interest.svippar_id,
      type: 'interest_rejected',
      actor_name: '',
      message: `Tack för ditt intresse för "${interest.request_title}" – en annan utförare valdes den här gången.`,
      action_url: `/requests`,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })
  }

  const groupedByRequest = useMemo(() => {
    const map = new Map<string, RequestGroup>()
    incomingInterests.forEach(i => {
      let group = map.get(i.request_id)
      if (!group) {
        group = { request_id: i.request_id, request_title: i.request_title, request_meta: '', interests: [] }
        map.set(i.request_id, group)
      }
      group.interests.push(i)
    })
    map.forEach(group => {
      const earliest = group.interests.reduce((min, i) => i.created_at < min ? i.created_at : min, group.interests[0].created_at)
      group.request_meta = `Första intresseanmälan ${new Date(earliest).toLocaleDateString('sv-SE')}`
    })
    return Array.from(map.values())
  }, [incomingInterests])

  const filteredGroups = useMemo(() => {
    return groupedByRequest
      .map(group => {
        if (interestFilterStatus === 'pending') {
          const pending = group.interests.filter(i => i.status === 'pending')
          return pending.length > 0 ? { ...group, interests: pending } : null
        }
        if (interestFilterStatus === 'accepted') {
          return group.interests.some(i => i.status === 'accepted') ? group : null
        }
        if (interestFilterStatus === 'rejected') {
          return group.interests.every(i => i.status === 'rejected') ? group : null
        }
        return group
      })
      .filter((g): g is RequestGroup => g !== null)
  }, [groupedByRequest, interestFilterStatus])

  const isGroupOpen = (group: RequestGroup) =>
    group.request_id in expandedGroups
      ? expandedGroups[group.request_id]
      : group.interests.some(i => i.status === 'pending')

  const toggleGroup = (group: RequestGroup) =>
    setExpandedGroups(prev => ({ ...prev, [group.request_id]: !isGroupOpen(group) }))

  function truncate(text: string, max: number) {
    if (!text) return ''
    return text.length > max ? text.slice(0, max) + '...' : text
  }

  if (fetching) return <p style={{ color: 'var(--color-gray)', fontSize: 14 }}>Laddar intresseanmälningar...</p>

  if (incomingInterests.length === 0) {
    return (
      <div className={styles.empty}>
        <span>📭</span>
        <p>Inga intresseanmälningar ännu.</p>
        <Link href="/create-request" className="btn btn-orange">Skapa en förfrågan</Link>
      </div>
    )
  }

  return (
    <>
      {/* Filter-flikar */}
      <div className={styles.filters}>
        <div className={styles.filters__tabs}>
          {(['alla', 'pending', 'accepted', 'rejected'] as const).map(s => (
            <button
              key={s}
              className={`${styles.filters__tab} ${interestFilterStatus === s ? styles['filters__tab--active'] : ''}`}
              onClick={() => setInterestFilterStatus(s)}
            >
              {s === 'alla' ? 'Alla' : s === 'pending' ? 'Väntande' : s === 'accepted' ? 'Godkända' : 'Nekade'}
              <span className={styles.filters__tab_count}>
                {s === 'alla' ? incomingInterests.length : incomingInterests.filter(i => i.status === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grupperad vy per förfrågan */}
      {filteredGroups.length === 0 ? (
        <div className={styles.groups_empty}>
          <p>Inga intresseanmälningar matchar valt filter.</p>
        </div>
      ) : (
        <div className={styles.groups}>
          {filteredGroups.map(group => {
            const open = isGroupOpen(group)
            return (
              <div key={group.request_id} className={styles.group}>
                <button type="button" className={styles.group__header} onClick={() => toggleGroup(group)}>
                  <div className={styles.group__info}>
                    <span className={styles.group__title}>{truncate(group.request_title, 60)}</span>
                    <span className={styles.group__meta}>{group.request_meta}</span>
                  </div>
                  <div className={styles.group__right}>
                    <span className={styles.group__count}>{group.interests.length} intresseanmälning{group.interests.length !== 1 ? 'ar' : ''}</span>
                    <ChevronDown size={18} className={`${styles.group__chevron} ${open ? styles['group__chevron--open'] : ''}`} />
                  </div>
                </button>

                {open && (
                  <div className={styles.group__body}>
                    {group.interests.map(interest => (
                      <div key={interest.id} className={styles.interest_row}>
                        <div className={styles.svippar_avatar}>
                          {interest.avatar_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={interest.avatar_url} alt={interest.svippar_name} className={styles.svippar_avatar_img} />
                            : interest.svippar_name?.charAt(0).toUpperCase()
                          }
                        </div>

                        <div className={styles.interest_row__main}>
                          <div className={styles.interest_row__top}>
                            <span className={styles.interest_row__name}>{interest.svippar_name}</span>
                            {interest.rating !== null && interest.rating !== undefined ? (
                              <span className={styles.rating_cell} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <Star size={13} fill="#EF9F27" color="#EF9F27" /> {interest.rating}
                                <span className={styles.rating_count}>({interest.reviews})</span>
                              </span>
                            ) : (
                              <span className={styles.rating_new}>Ny</span>
                            )}
                          </div>
                          <p className={styles.interest_row__message}>{interest.message}</p>
                        </div>

                        <div className={styles.interest_row__price}>{interest.price ? `${interest.price} kr` : '–'}</div>
                        <div className={styles.interest_row__date}>{new Date(interest.created_at).toLocaleDateString('sv-SE')}</div>

                        <div className={styles.interest_row__actions}>
                          <Link href={`/provider/${interest.svippar_id}`} className={styles.action_btn}><User size={16} /></Link>
                          <a href={`mailto:${interest.svippar_email}`} className={styles.action_btn}><Mail size={16} /></a>
                          {interest.status === 'pending' ? (
                            <>
                              <button className={styles.select_btn} onClick={() => handleAccept(interest)} disabled={interestAcceptingId === interest.id}>
                                {interestAcceptingId === interest.id ? '...' : <><CheckCircle size={14} /> Välj</>}
                              </button>
                              <button className={`${styles.action_btn} ${styles['action_btn--reject']}`} onClick={() => handleReject(interest)}>
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <span className={`${styles.status_badge} ${interest.status === 'accepted' ? styles['status_badge--accepted'] : styles['status_badge--rejected']}`}>
                              {interest.status === 'accepted' ? <><CheckCircle size={14} /> Godkänd</> : <><XCircle size={14} /> Nekad</>}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
