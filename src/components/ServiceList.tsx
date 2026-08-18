'use client'

import Link from 'next/link'
import Image from 'next/image'
import AdCard from './AdCard'
import ServiceCard from './ServiceCard'
import { useState } from 'react'
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
  avatar_url?: string | null
}

type Props = {
  services: Service[]
  requests: Request[]
}

export default function ServiceList({ services, requests }: Props) {
  const [activeTab, setActiveTab] = useState<'services' | 'requests'>('services')

  return (
    <section className={styles.servicelist}>
      <div className="container">

        {/* Header med tabs */}
        <div className={styles.servicelist__header}>
          <div className={styles.servicelist__tabs}>
            <button
              className={`${styles.servicelist__tab} ${activeTab === 'services' ? `${styles['servicelist__tab--active']} ${styles['servicelist__tab--active-services']}` : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Tjänster
            </button>
            <button
              className={`${styles.servicelist__tab} ${activeTab === 'requests' ? `${styles['servicelist__tab--active']} ${styles['servicelist__tab--active-requests']}` : ''}`}
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

        {/* Tjänster */}
        {activeTab === 'services' && (
          <div className={styles.servicelist__list}>
            {services.length === 0 ? (
              <div className={styles.servicelist__empty}>
                <p>Inga tjänster hittades ännu.</p>
                <Link href="/create-service" className="btn btn-primary">Skapa första tjänsten</Link>
              </div>
            ) : (
              services.flatMap((s, idx) => {
                const card = <ServiceCard key={s.id} {...s} />
                // Insert AdCard after index 2 (or after the last card if fewer than 3)
                const adInsertAfter = services.length >= 3 ? 2 : services.length - 1
                if (idx === adInsertAfter) {
                  return [card, <AdCard key="ad-card" />]
                }
                return [card]
              })
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
                    {r.avatar_url
                      ? <Image src={r.avatar_url} alt={r.user_name} width={52} height={52} className={styles.service_card__avatar_img} />
                      : <div className={`${styles.service_card__avatar_placeholder} ${styles['service_card__avatar_placeholder--orange']}`}>
                          {r.user_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                    }
                  </div>
                  <div className={styles.service_card__info}>
                    <div className={styles.service_card__meta}>
                      <span className={styles.service_card__name}>{r.user_name}</span>
                      <span className={styles.service_card__distance}>· {r.location}</span>
                    </div>
                    <p className={styles.service_card__title}>{r.title}</p>
                    <span className={`${styles.service_card__category} ${styles['service_card__category--request']}`}>{r.subcategory}</span>
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

      </div>
    </section>
  )
}