'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './intresseanmalningar.module.scss'

type Interest = {
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
}

type SvippareProfile = {
  user_id: string
  avatar_url?: string
  rating?: number
  reviews?: number
}

type GroupedInterests = {
  request_id: string
  request_title: string
  interests: (Interest & { avatar_url?: string | null; rating?: number; reviews?: number })[]
}

export default function IntresseanmalningarPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [groups, setGroups] = useState<GroupedInterests[]>([])
  const [fetching, setFetching] = useState(true)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/logga-in')
  }, [loading, user])

  useEffect(() => {
    if (!user) return
    const fetchInterests = async () => {
      const { data: interests } = await supabase
        .from('interests')
        .select('*')
        .eq('request_owner_id', user.id)
        .order('created_at', { ascending: false })

      if (!interests || interests.length === 0) {
        setFetching(false)
        return
      }

      // Hämta profilbilder och betyg för alla Svippare
      const svipparIds = [...new Set(interests.map(i => i.svippar_id))]
      const { data: users } = await supabase
        .from('users')
        .select('id, avatar_url')
        .in('id', svipparIds)

      const { data: svippareProfiles } = await supabase
        .from('svippare_profiles')
        .select('user_id')
        .in('user_id', svipparIds)

      // Hämta snittbetyg per Svippare
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

      // Berika interests med avatar och betyg
      const enriched = interests.map(i => ({
        ...i,
        avatar_url: avatarMap[i.svippar_id] ?? null,
        rating: ratingMap[i.svippar_id]
          ? Math.round(ratingMap[i.svippar_id].sum / ratingMap[i.svippar_id].count * 10) / 10
          : null,
        reviews: ratingMap[i.svippar_id]?.count ?? 0,
      }))

      // Gruppera per förfrågan
      const grouped: Record<string, GroupedInterests> = {}
      enriched.forEach(i => {
        if (!grouped[i.request_id]) {
          grouped[i.request_id] = {
            request_id: i.request_id,
            request_title: i.request_title,
            interests: [],
          }
        }
        grouped[i.request_id].interests.push(i)
      })

      const groupList = Object.values(grouped)
      setGroups(groupList)

      // Expandera första gruppen automatiskt
      if (groupList.length > 0) setExpandedGroup(groupList[0].request_id)

      setFetching(false)
    }
    fetchInterests()
  }, [user])

  const handleAccept = async (interest: GroupedInterests['interests'][0]) => {
    if (!user) return
    setAcceptingId(interest.id)
    try {
        // Markera intresseanmälan som godkänd
        await supabase
        .from('interests')
        .update({ status: 'accepted' })
        .eq('id', interest.id)

        // Skapa en order från intresseanmälan
        const { data: requestData } = await supabase
        .from('requests')
        .select('category_id, budget, budget_type')
        .eq('id', interest.request_id)
        .single()

        const { data: order } = await supabase.from('orders').insert({
        service_id: interest.request_id,
        service_title: interest.request_title,
        seller_id: interest.svippar_id,
        seller_name: interest.svippar_name,
        buyer_id: user.id,
        buyer_name: (await supabase.from('users').select('name').eq('id', user.id).single()).data?.name || '',
        buyer_email: (await supabase.auth.getUser()).data.user?.email || '',
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

        // Notifiera Svipparen
        if (order) {
        await supabase.from('notifications').insert({
            user_id: interest.svippar_id,
            type: 'new_order',
            order_id: order.id,
            service_title: interest.request_title,
            actor_name: '',
            message: `Din intresseanmälan för "${interest.request_title}" har godkänts! 🎉`,
            action_url: `/bestallning/${order.id}`,
            read: false,
            dismissed: false,
            email_sent: false,
            created_at: new Date().toISOString(),
        })
        }

        // Uppdatera lokalt state
        setGroups(prev => prev.map(g => ({
        ...g,
        interests: g.interests.map(i =>
            i.id === interest.id ? { ...i, status: 'accepted' } : i
        )
        })))
    } catch (err) {
        console.error(err)
    } finally {
        setAcceptingId(null)
    }
    }

  if (loading || fetching) return (
    <div className={styles.loading}>Laddar intresseanmälningar...</div>
  )

  return (
    <div className={styles.page}>
      <div className={`container ${styles.page__inner}`}>

        <div className={styles.page__header}>
          <h1 className={styles.page__title}>Intresseanmälningar</h1>
          <p className={styles.page__subtitle}>
            Svippare som visat intresse för dina förfrågningar
          </p>
        </div>

        {groups.length === 0 ? (
          <div className={styles.empty}>
            <span>📭</span>
            <p>Inga intresseanmälningar ännu.</p>
            <Link href="/forfragningar" className="btn btn-orange">Utforska förfrågningar</Link>
          </div>
        ) : (
          <div className={styles.groups}>
            {groups.map(group => (
              <div key={group.request_id} className={styles.group}>

                {/* Grupprubrik */}
                <button
                  className={styles.group__header}
                  onClick={() => setExpandedGroup(expandedGroup === group.request_id ? null : group.request_id)}
                >
                  <div className={styles.group__header_left}>
                    <h2 className={styles.group__title}>{group.request_title}</h2>
                    <span className={styles.group__count}>
                      {group.interests.length} intresseanmälan{group.interests.length !== 1 ? 'ar' : ''}
                    </span>
                  </div>
                  <div className={styles.group__header_right}>
                    <Link
                      href={`/forfragning/${group.request_id}`}
                      className={styles.group__link}
                      onClick={e => e.stopPropagation()}
                    >
                      Se förfrågan →
                    </Link>
                    <span className={styles.group__chevron}>
                      {expandedGroup === group.request_id ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {/* Svippare-kort */}
                {expandedGroup === group.request_id && (
                  <div className={styles.group__cards}>
                    {group.interests.map(interest => (
                      <div key={interest.id} className={styles.interest_card}>

                        {/* Avatar + namn + betyg */}
                        <div className={styles.interest_card__header}>
                          <div className={styles.interest_card__avatar}>
                            {interest.avatar_url
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={interest.avatar_url} alt={interest.svippar_name} className={styles.interest_card__avatar_img} />
                              : interest.svippar_name?.charAt(0).toUpperCase()
                            }
                          </div>
                          <div className={styles.interest_card__info}>
                            <div className={styles.interest_card__name_row}>
                              <strong className={styles.interest_card__name}>{interest.svippar_name}</strong>
                              {interest.price && (
                                <span className={styles.interest_card__price}>{interest.price} kr</span>
                              )}
                            </div>
                            <div className={styles.interest_card__meta}>
                              {interest.rating !== null && interest.rating !== undefined ? (
                                <span className={styles.interest_card__rating}>
                                  ⭐ {interest.rating} ({interest.reviews} recensioner)
                                </span>
                              ) : (
                                <span className={styles.interest_card__rating}>Ny på Svippo</span>
                              )}
                              <span className={styles.interest_card__date}>
                                {new Date(interest.created_at).toLocaleDateString('sv-SE')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Meddelande */}
                        <p className={styles.interest_card__message}>{interest.message}</p>

                        {/* Åtgärder */}
                        <div className={styles.interest_card__actions}>
                        <Link href={`/svippare/${interest.svippar_id}`} className="btn btn-outline">
                            👤 Se profil
                        </Link>
                        <a href={`mailto:${interest.svippar_email}`} className="btn btn-outline">
                            ✉️ Kontakta
                        </a>
                        {interest.status !== 'accepted' ? (
                            <button
                            className="btn btn-orange"
                            onClick={() => handleAccept(interest)}
                            disabled={acceptingId === interest.id}
                            >
                            {acceptingId === interest.id ? 'Godkänner...' : '✅ Godkänn'}
                            </button>
                        ) : (
                            <span className={styles.interest_card__accepted}>✅ Godkänd</span>
                        )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}