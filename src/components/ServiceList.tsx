'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Star } from 'lucide-react'
import styles from './ServiceList.module.scss'

type Service = {
  id: string
  title: string
  subcategory: string
  price_type: string
  price: number
  location: string
  user_name: string
  rating: number
  reviews: number
  avatar_url?: string | null
}

type Request = {
  id: string
  title: string
  subcategory: string
  budget_type: string
  budget: number
  location: string
  user_name: string
  created_at: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className={styles.star_rating} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Star size={14} /><strong>{rating || '–'}</strong>
    </span>
  )
}

export default function ServiceList() {
  const [activeTab, setActiveTab] = useState<'services' | 'requests'>('services')
  const [services, setServices] = useState<Service[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      const [servicesRes, requestsRes] = await Promise.all([
        supabase
          .from('services')
          .select('*, users(avatar_url)')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      const fetchedServices = (servicesRes.data ?? []).map(s => {
        const { users, ...rest } = s as typeof s & { users: { avatar_url: string | null } | null }
        return { ...rest, avatar_url: users?.avatar_url ?? null }
      })

      setServices(fetchedServices)
      setRequests(requestsRes.data ?? [])
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <section className={styles.servicelist}>
      <div className="container">

        {/* Header med tabs */}
        <div className={styles.servicelist__header}>
          <div className={styles.servicelist__tabs}>
            <button
              className={`${styles.servicelist__tab} ${activeTab === 'services' ? styles['servicelist__tab--active'] : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Tjänster
            </button>
            <button
              className={`${styles.servicelist__tab} ${activeTab === 'requests' ? styles['servicelist__tab--active'] : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Förfrågningar
            </button>
          </div>
          <Link
            href={activeTab === 'services' ? '/services' : '/requests'}
            className={styles.servicelist__see_all}
          >
            Se alla →
          </Link>
        </div>

        {loading ? (
          <div className={styles.servicelist__loading}>Laddar...</div>
        ) : (
          <>
            {/* Tjänster */}
            {activeTab === 'services' && (
              <div className={styles.servicelist__list}>
                {services.length === 0 ? (
                  <div className={styles.servicelist__empty}>
                    <p>Inga tjänster hittades ännu.</p>
                    <Link href="/create-service" className="btn btn-primary">Skapa första tjänsten</Link>
                  </div>
                ) : (
                  services.map((s) => (
                    <Link href={`/service/${s.id}`} key={s.id} className={`${styles.service_card} card`}>
                      <div className={styles.service_card__avatar}>
                        {s.avatar_url
                          ? <img src={s.avatar_url} alt={s.user_name} className={styles.service_card__avatar_img} />
                          : <div className={styles.service_card__avatar_placeholder}>{s.user_name?.charAt(0).toUpperCase() || '?'}</div>
                        }
                      </div>
                      <div className={styles.service_card__info}>
                        <div className={styles.service_card__meta}>
                          <span className={styles.service_card__name}>{s.user_name}</span>
                          <StarRating rating={s.rating} />
                          <span className={styles.service_card__reviews}>({s.reviews})</span>
                          <span className={styles.service_card__distance}>· {s.location}</span>
                        </div>
                        <p className={styles.service_card__title}>{s.title}</p>
                        <span className={styles.service_card__category}>{s.subcategory}</span>
                      </div>
                      <div className={styles.service_card__price}>
                        <span className={styles.service_card__price_type}>
                          {s.price_type === 'offert' ? '' : 'från:'}
                        </span>
                        <strong>
                          {s.price_type === 'offert' ? 'Offert' : `${s.price}kr`}
                        </strong>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Förfrågningar */}
            {activeTab === 'requests' && (
              <div className={styles.servicelist__list}>
                {requests.length === 0 ? (
                  <div className={styles.servicelist__empty}>
                    <p>Inga förfrågningar hittades ännu.</p>
                    <Link href="/create-request" className="btn btn-orange">Skapa en förfrågan</Link>
                  </div>
                ) : (
                  requests.map((r) => (
                    <Link href={`/request/${r.id}`} key={r.id} className={`${styles.service_card} card`}>
                      <div className={styles.service_card__avatar}>
                        <div className={`${styles.service_card__avatar_placeholder} ${styles['service_card__avatar_placeholder--orange']}`}>
                          {r.user_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      </div>
                      <div className={styles.service_card__info}>
                        <div className={styles.service_card__meta}>
                          <span className={styles.service_card__name}>{r.user_name}</span>
                          <span className={styles.service_card__distance}>· {r.location}</span>
                        </div>
                        <p className={styles.service_card__title}>{r.title}</p>
                        <span className={styles.service_card__category}>{r.subcategory}</span>
                      </div>
                      <div className={styles.service_card__price}>
                        <span className={styles.service_card__price_type}>
                          {r.budget_type === 'prisforslag' ? '' : 'budget:'}
                        </span>
                        <strong>
                          {r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget}kr`}
                        </strong>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>
    </section>
  )
}