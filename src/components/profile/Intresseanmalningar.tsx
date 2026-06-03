'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './intresseanmalningar.module.scss'
import { Star, User, CheckCircle, XCircle, Clock, Mail } from 'lucide-react'

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

interface Props {
  userId: string
}

export default function Intresseanmalningar({ userId }: Props) {
  const [incomingInterests, setIncomingInterests] = useState<IncomingInterest[]>([])
  const [fetching, setFetching] = useState(true)
  const [interestAcceptingId, setInterestAcceptingId] = useState<string | null>(null)
  const [interestExpandedId, setInterestExpandedId] = useState<string | null>(null)

  const [interestFilterStatus, setInterestFilterStatus] = useState<'alla' | 'pending' | 'accepted' | 'rejected'>('alla')
  const [interestFilterRequest, setInterestFilterRequest] = useState('')
  const [interestFilterMinPrice, setInterestFilterMinPrice] = useState('')
  const [interestFilterMaxPrice, setInterestFilterMaxPrice] = useState('')
  const [interestFilterMinRating, setInterestFilterMinRating] = useState('')
  const [interestFilterHideNew, setInterestFilterHideNew] = useState(false)
  const [interestSortBy, setInterestSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating'>('newest')

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

      const { data: userData } = await supabase.from('users').select('name, email').eq('id', userId).single()

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

      setIncomingInterests(prev => prev.map(i => i.id === interest.id ? { ...i, status: 'accepted' } : i))
    } catch (err) {
      console.error(err)
    } finally {
      setInterestAcceptingId(null)
    }
  }

  const handleReject = async (interest: IncomingInterest) => {
    await supabase.from('interests').update({ status: 'rejected' }).eq('id', interest.id)

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

    setIncomingInterests(prev => prev.map(i => i.id === interest.id ? { ...i, status: 'rejected' } : i))
  }

  const uniqueRequests = useMemo(() => {
    const map: Record<string, string> = {}
    incomingInterests.forEach(i => { map[i.request_id] = i.request_title })
    return Object.entries(map)
  }, [incomingInterests])

  const filteredInterests = useMemo(() => {
    return incomingInterests
      .filter(i => {
        if (interestFilterStatus !== 'alla' && i.status !== interestFilterStatus) return false
        if (interestFilterRequest && i.request_id !== interestFilterRequest) return false
        if (interestFilterMinPrice && (i.price === null || i.price < Number(interestFilterMinPrice))) return false
        if (interestFilterMaxPrice && (i.price === null || i.price > Number(interestFilterMaxPrice))) return false
        if (interestFilterMinRating && (i.rating == null || i.rating < Number(interestFilterMinRating))) return false
        if (interestFilterHideNew && (i.rating == null || (i.reviews ?? 0) === 0)) return false
        return true
      })
      .sort((a, b) => {
        if (interestSortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (interestSortBy === 'price_asc') return (a.price ?? 0) - (b.price ?? 0)
        if (interestSortBy === 'price_desc') return (b.price ?? 0) - (a.price ?? 0)
        if (interestSortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [incomingInterests, interestFilterStatus, interestFilterRequest, interestFilterMinPrice, interestFilterMaxPrice, interestFilterMinRating, interestFilterHideNew, interestSortBy])

  const interestHasFilters = interestFilterStatus !== 'alla' || interestFilterRequest || interestFilterMinPrice || interestFilterMaxPrice || interestFilterMinRating || interestFilterHideNew || interestSortBy !== 'newest'

  const clearInterestFilters = () => {
    setInterestFilterStatus('alla')
    setInterestFilterRequest('')
    setInterestFilterMinPrice('')
    setInterestFilterMaxPrice('')
    setInterestFilterMinRating('')
    setInterestFilterHideNew(false)
    setInterestSortBy('newest')
  }

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
      {/* Filter-rad */}
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

        <div className={styles.filters__controls}>
          <select className={styles.filters__select} value={interestFilterRequest} onChange={e => setInterestFilterRequest(e.target.value)}>
            <option value="">Alla förfrågningar</option>
            {uniqueRequests.map(([id, title]) => (
              <option key={id} value={id}>{truncate(title, 40)}</option>
            ))}
          </select>

          <select className={styles.filters__select} value={interestSortBy} onChange={e => setInterestSortBy(e.target.value as typeof interestSortBy)}>
            <option value="newest">Nyast först</option>
            <option value="oldest">Äldst först</option>
            <option value="price_asc">Lägst pris</option>
            <option value="price_desc">Högst pris</option>
            <option value="rating">Högst betyg</option>
          </select>

          <select className={styles.filters__select} value={interestFilterMinRating} onChange={e => setInterestFilterMinRating(e.target.value)}>
            <option value="">Alla betyg</option>
            <option value="4">4+ ⭐</option>
            <option value="3">3+ ⭐</option>
            <option value="2">2+ ⭐</option>
          </select>

          <div className={styles.filters__price}>
            <input className={styles.filters__input} type="number" placeholder="Min kr" value={interestFilterMinPrice} onChange={e => setInterestFilterMinPrice(e.target.value)} />
            <span>–</span>
            <input className={styles.filters__input} type="number" placeholder="Max kr" value={interestFilterMaxPrice} onChange={e => setInterestFilterMaxPrice(e.target.value)} />
          </div>

          <label className={styles.filters__checkbox}>
            <input type="checkbox" checked={interestFilterHideNew} onChange={e => setInterestFilterHideNew(e.target.checked)} />
            Dölj nya på Svippo
          </label>

          {interestHasFilters && (
            <button className={styles.filters__clear} onClick={clearInterestFilters}>Rensa filter</button>
          )}
        </div>
      </div>

      {/* Tabell */}
      <div className={styles.table_wrap}>
        <div className={styles.table_header}>
          <span>Utförare</span>
          <span>Förfrågan</span>
          <span>Prisförslag</span>
          <span>Betyg</span>
          <span>Datum</span>
          <span>Status</span>
          <span>Åtgärd</span>
        </div>

        {filteredInterests.length === 0 ? (
          <div className={styles.table_empty}>
            <p>Inga intresseanmälningar matchar dina filter.</p>
            <button className="btn btn-outline" onClick={clearInterestFilters}>Rensa filter</button>
          </div>
        ) : (
          <div className={styles.table_body}>
            {filteredInterests.map(interest => (
              <div key={interest.id}>
                <div
                  className={`${styles.table_row} ${interestExpandedId === interest.id ? styles['table_row--expanded'] : ''}`}
                  onClick={() => setInterestExpandedId(interestExpandedId === interest.id ? null : interest.id)}
                >
                  <div className={styles.table_cell}>
                    <div className={styles.svippar_cell}>
                      <div className={styles.svippar_avatar}>
                        {interest.avatar_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={interest.avatar_url} alt={interest.svippar_name} className={styles.svippar_avatar_img} />
                          : interest.svippar_name?.charAt(0).toUpperCase()
                        }
                      </div>
                      <span className={styles.svippar_name}>{interest.svippar_name}</span>
                    </div>
                  </div>

                  <div className={styles.table_cell}>
                    <span className={styles.request_title}>{truncate(interest.request_title, 35)}</span>
                  </div>

                  <div className={styles.table_cell}>
                    <strong className={styles.price_cell}>{interest.price ? `${interest.price} kr` : '–'}</strong>
                  </div>

                  <div className={styles.table_cell}>
                    {interest.rating !== null && interest.rating !== undefined ? (
                      <span className={styles.rating_cell} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={14} fill="#EF9F27" color="#EF9F27" /> {interest.rating}
                        <span className={styles.rating_count}>({interest.reviews})</span>
                      </span>
                    ) : (
                      <span className={styles.rating_new}>Ny</span>
                    )}
                  </div>

                  <div className={styles.table_cell}>
                    <span className={styles.date_cell}>{new Date(interest.created_at).toLocaleDateString('sv-SE')}</span>
                  </div>

                  <div className={styles.table_cell}>
                    <span className={`${styles.status_badge} ${
                      interest.status === 'accepted' ? styles['status_badge--accepted'] :
                      interest.status === 'rejected' ? styles['status_badge--rejected'] :
                      styles['status_badge--pending']
                    }`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {interest.status === 'accepted' ? <><CheckCircle size={14} /> Godkänd</> : interest.status === 'rejected' ? <><XCircle size={14} /> Nekad</> : <><Clock size={14} /> Väntande</>}
                    </span>
                  </div>

                  <div className={styles.table_cell} onClick={e => e.stopPropagation()}>
                    <div className={styles.action_cell}>
                      <Link href={`/provider/${interest.svippar_id}`} className={styles.action_btn}><User size={16} /></Link>
                      <a href={`mailto:${interest.svippar_email}`} className={styles.action_btn}><Mail size={16} /></a>
                      {interest.status === 'pending' && (
                        <>
                          <button className={`${styles.action_btn} ${styles['action_btn--approve']}`} onClick={() => handleAccept(interest)} disabled={interestAcceptingId === interest.id}>
                            {interestAcceptingId === interest.id ? '...' : <CheckCircle size={16} />}
                          </button>
                          <button className={`${styles.action_btn} ${styles['action_btn--reject']}`} onClick={() => handleReject(interest)}>
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {interestExpandedId === interest.id && (
                  <div className={styles.table_row_expanded}>
                    <div className={styles.expanded_message}>
                      <span className={styles.expanded_label}>Meddelande</span>
                      <p>{interest.message}</p>
                    </div>
                    <div className={styles.expanded_actions}>
                      <Link href={`/provider/${interest.svippar_id}`} className="btn btn-outline"><User size={16} /> Se profil</Link>
                      <a href={`mailto:${interest.svippar_email}`} className="btn btn-outline"><Mail size={16} /> Kontakta</a>
                      {interest.status === 'pending' && (
                        <>
                          <button className="btn btn-orange" onClick={() => handleAccept(interest)} disabled={interestAcceptingId === interest.id}>
                            {interestAcceptingId === interest.id ? 'Godkänner...' : <><CheckCircle size={16} /> Godkänn utförare</>}
                          </button>
                          <button className="btn btn-outline" onClick={() => handleReject(interest)} style={{ color: 'var(--color-orange)', borderColor: 'var(--color-orange)' }}>
                            <XCircle size={16} /> Neka
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
