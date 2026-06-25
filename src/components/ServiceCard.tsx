'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import styles from './ServiceList.module.scss'

type Props = {
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

function StarRating({ rating }: { rating: number }) {
  if (!rating) return <span className={styles.star_rating}><strong>–</strong></span>
  return (
    <span className={styles.star_rating} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Star size={14} fill="#EF9F27" color="#EF9F27" /><strong>{rating}</strong>
    </span>
  )
}

export default function ServiceCard({ id, title, subcategory, price_type, price, location, user_name, rating, reviews, avatar_url }: Props) {
  return (
    <Link href={`/service/${id}`} className={`${styles.service_card} card`}>
      <div className={styles.service_card__avatar}>
        {avatar_url
          ? <img src={avatar_url} alt={user_name} className={styles.service_card__avatar_img} />
          : <div className={styles.service_card__avatar_placeholder}>{user_name?.charAt(0).toUpperCase() || '?'}</div>
        }
      </div>
      <div className={styles.service_card__info}>
        <div className={styles.service_card__meta}>
          <span className={styles.service_card__name}>{user_name}</span>
          <StarRating rating={rating} />
          <span className={styles.service_card__reviews}>({reviews})</span>
          <span className={styles.service_card__distance}>· {location}</span>
        </div>
        <p className={styles.service_card__title}>{title}</p>
        <span className={styles.service_card__category}>{subcategory}</span>
      </div>
      <div className={styles.service_card__price}>
        <span className={styles.service_card__price_type}>
          {price_type === 'offert' ? '' : 'från:'}
        </span>
        <strong>
          {price_type === 'offert' ? 'Offert' : `${price}kr`}
        </strong>
      </div>
    </Link>
  )
}
