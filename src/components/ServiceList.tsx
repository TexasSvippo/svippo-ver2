import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './ServiceList.module.scss'
import { Star } from 'lucide-react'

type Service = {
  id: string
  title: string
  description: string
  category_id: string
  subcategory: string
  price_type: string
  price: number
  location: string
  user_name: string
  user_email: string
  user_id: string
  rating: number
  reviews: number
  avatar_url?: string | null
  created_at: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className={styles.star_rating}>
      <Star size={14} /><strong>{rating || '–'}</strong>
    </span>
  )
}

export default async function ServiceList() {
  const { data: servicesRaw, error } = await supabase
    .from('services')
    .select('*, users(avatar_url)')
    .order('created_at', { ascending: false })
    .limit(10)

  const services = (servicesRaw ?? []).map(s => {
    const { users, ...rest } = s as typeof s & { users: { avatar_url: string | null } | null }
    return { ...rest, avatar_url: users?.avatar_url ?? null }
  })

  if (error || !services) return null

  if (services.length === 0) return (
    <section className={styles.servicelist}>
      <div className="container">
        <div className={styles.servicelist__empty}>
          <p>Inga tjänster hittades ännu.</p>
          <Link href="/create-service" className="btn btn-primary">Skapa första tjänsten</Link>
        </div>
      </div>
    </section>
  )

  return (
    <section className={styles.servicelist}>
      <div className="container">
        <div className={styles.servicelist__header}>
          <h2 className={styles.servicelist__title}>Populärt just nu 🔥</h2>
          <Link href="/services" className={styles.servicelist__see_all}>Se alla →</Link>
        </div>

        <div className={styles.servicelist__list}>
          {services.map((s: Service) => (
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
          ))}
        </div>
      </div>
    </section>
  )
}
