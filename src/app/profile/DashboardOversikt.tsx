'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, ShoppingBag, Star, FileText, ShoppingCart, MessageCircle, Package, CheckCircle, Clock, Wallet } from 'lucide-react'
import { sanityClient } from '@/sanity/client'
import { blogPostsQuery } from '@/sanity/queries'
import styles from './dashboard.module.scss'

type Service  = { id: string; title: string; subcategory: string; price_type: string; price: number }
type Order    = { id: string; service_title: string; buyer_name: string; status: string; project_status: string; created_at?: string }
type Placed   = { id: string; service_title: string; seller_name: string; status: string; project_status: string; created_at?: string }
type Request  = { id: string; title: string; subcategory: string; budget: number; budget_type: string }
type Interest = { id: string; request_title: string; svippar_name: string; price: number; created_at?: string }
type Notif    = { id: string; type: string; order_id: string; service_title: string; message: string; read: boolean }

type BlogPost = {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  category?: string
  publishedAt?: string
  targetRole?: string[]
  mainImage?: { asset: { url: string } }
}

type Props = {
  displayName: string
  avatarUrl?: string | null
  dbAccountType: string | null
  canCreateService: boolean
  services: Service[]
  incomingOrders: Order[]
  placedOrders: Placed[]
  myRequests: Request[]
  interests: Interest[]
  notifications: Notif[]
  userId: string
  onDismissNotif: (id: string) => void
}

const GREETINGS = [
  'Back in business',
  'Redo att svippa igen',
  'Kul att du är tillbaka',
  'Dags att ta nya uppdrag',
  'Välkommen tillbaka, låt oss köra',
  'En ny dag, nya möjligheter',
  'Du är på gång',
]

function statusLabel(status: string, projectStatus: string) {
  if (projectStatus === 'completed') return { text: 'Avslutat', cls: styles['dash__badge--green'] }
  if (status === 'pending')  return { text: 'Väntar',   cls: styles['dash__badge--orange'] }
  if (status === 'accepted') return { text: 'Pågår',    cls: styles['dash__badge--blue'] }
  return { text: 'Nekad', cls: styles['dash__badge--red'] }
}

export default function DashboardOversikt({
  displayName, avatarUrl, dbAccountType, canCreateService,
  services, incomingOrders, placedOrders, myRequests, interests,
  notifications, userId, onDismissNotif,
}: Props) {
  const router = useRouter()
  const [tips, setTips] = useState<BlogPost[]>([])

  const isProvider  = dbAccountType !== 'bestellare' && dbAccountType !== null
  const isBestellare = dbAccountType === 'bestellare'

  const greeting  = GREETINGS[new Date().getDate() % GREETINGS.length]
  const firstName = displayName ? displayName.split(' ')[0] : 'Hej'

  const pendingOrders = incomingOrders.filter(o => o.status === 'pending')
  const activeOrders  = placedOrders.filter(o => o.project_status !== 'completed')

  useEffect(() => {
    sanityClient.fetch(blogPostsQuery).then((posts: BlogPost[]) => {
      const role = dbAccountType ?? 'alla'
      const filtered = posts.filter(p =>
        !p.targetRole || p.targetRole.length === 0 ||
        p.targetRole.includes('alla') || p.targetRole.includes(role)
      )
      setTips(filtered.slice(0, 3))
    }).catch(() => {})
  }, [dbAccountType])

  return (
    <div className={styles.dash}>

      {/* ── Top row: greeting + CTA ────────────────────────────────────────── */}
      <div className={styles.dash__top}>
        <h1 className={styles.dash__greeting}>{greeting}, {firstName}! 👋</h1>
        {isProvider && (
          <button className={styles.dash__create_btn} onClick={() => router.push('/create-service')}>
            Skapa inlägg
          </button>
        )}
      </div>

      {/* ── Notifications ──────────────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div className={styles.dash__notifs}>
          {notifications.map(n => (
            <div key={n.id} className={styles.dash__notif}>
              <span>
                {n.type === 'project_completed' ? '🎉'
                  : n.type === 'new_order' ? <Package size={16} />
                  : n.type === 'order_accepted' ? <CheckCircle size={16} />
                  : <Wallet size={16} />}
              </span>
              <p className={styles.dash__notif_msg}>{n.message}</p>
              <div className={styles.dash__notif_actions}>
                {n.type === 'new_order'          && <Link href={`/order/${n.order_id}`}    className="btn btn-primary" style={{ fontSize: 13, padding: '6px 12px' }}>Se beställning</Link>}
                {n.type === 'project_completed'  && <Link href={`/my-order/${n.order_id}`} className="btn btn-primary" style={{ fontSize: 13, padding: '6px 12px' }}>Lämna recension</Link>}
                <button className={styles.dash__notif_close} onClick={() => onDismissNotif(n.id)}>✕</button>
              </div>
            </div>
          ))}
          <Link href="/notifications" className={styles.dash__notifs_all}>Se alla notifikationer →</Link>
        </div>
      )}

      {/* ── Stats pills ────────────────────────────────────────────────────── */}
      <div className={styles.dash__stats}>
        {isProvider ? (
          <>
            <div className={styles.dash__stat}>
              <Briefcase size={16} className={styles.dash__stat_icon} />
              <strong>{services.length}</strong>
              <span>Aktiva tjänster</span>
            </div>
            <div className={styles.dash__stat_sep} />
            <div className={styles.dash__stat}>
              <ShoppingBag size={16} className={styles.dash__stat_icon} />
              <strong>{pendingOrders.length}</strong>
              <span>Nya beställningar</span>
            </div>
            <div className={styles.dash__stat_sep} />
            <div className={styles.dash__stat}>
              <Star size={16} className={styles.dash__stat_icon} />
              <strong>{interests.length}</strong>
              <span>Intresseanmälningar</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.dash__stat}>
              <FileText size={16} className={styles.dash__stat_icon} />
              <strong>{myRequests.length}</strong>
              <span>Aktiva förfrågningar</span>
            </div>
            <div className={styles.dash__stat_sep} />
            <div className={styles.dash__stat}>
              <ShoppingCart size={16} className={styles.dash__stat_icon} />
              <strong>{activeOrders.length}</strong>
              <span>Pågående beställningar</span>
            </div>
            <div className={styles.dash__stat_sep} />
            <div className={styles.dash__stat}>
              <MessageCircle size={16} className={styles.dash__stat_icon} />
              <strong>–</strong>
              <span>Meddelanden</span>
            </div>
          </>
        )}
      </div>

      {/* ── Active services (provider only) ────────────────────────────────── */}
      {isProvider && (
        <div className={styles.dash__section}>
          <div className={styles.dash__section_head}>
            <span className={styles.dash__section_title}>Aktiva tjänster</span>
            <Link href="/profile" className={styles.dash__see_all}>Se alla</Link>
          </div>
          {services.length === 0 ? (
            <div className={styles.dash__empty}>
              Du har inga aktiva tjänster ännu.{' '}
              <Link href="/create-service" className={styles.dash__empty_link}>Skapa en tjänst</Link>
            </div>
          ) : (
            <div className={styles.dash__service_list}>
              {services.slice(0, 3).map(s => (
                <Link href={`/service/${s.id}`} key={s.id} className={styles.dash__service_row}>
                  <div className={styles.dash__service_avatar}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt={displayName} className={styles.dash__service_avatar_img} />
                      : (displayName || '?').charAt(0).toUpperCase()
                    }
                  </div>
                  <div className={styles.dash__service_info}>
                    <span className={styles.dash__service_title}>{s.title}</span>
                    <span className={styles.dash__service_sub}>{s.subcategory}</span>
                  </div>
                  <span className={styles.dash__service_price}>
                    {s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Two columns ────────────────────────────────────────────────────── */}
      <div className={styles.dash__columns}>

        {/* Left column */}
        <div className={styles.dash__section}>
          <div className={styles.dash__section_head}>
            <span className={styles.dash__section_title}>
              {isProvider ? 'Inkommna beställningar' : 'Mina förfrågningar'}
            </span>
            <Link href={isProvider ? '/orders' : '/profile'} className={styles.dash__see_all}>Se alla</Link>
          </div>
          {isProvider ? (
            incomingOrders.length === 0 ? (
              <div className={styles.dash__empty}>Inga inkommna beställningar ännu.</div>
            ) : (
              <div className={styles.dash__item_list}>
                {incomingOrders.slice(0, 3).map(o => {
                  const { text, cls } = statusLabel(o.status, o.project_status)
                  return (
                    <Link href={`/order/${o.id}`} key={o.id} className={styles.dash__item_row}>
                      <div className={styles.dash__item_info}>
                        <span className={styles.dash__item_name}>{o.buyer_name}</span>
                        <span className={styles.dash__item_sub}>{o.service_title}</span>
                      </div>
                      <span className={`${styles.dash__badge} ${cls}`}>{text}</span>
                    </Link>
                  )
                })}
              </div>
            )
          ) : (
            myRequests.length === 0 ? (
              <div className={styles.dash__empty}>Inga förfrågningar ännu.</div>
            ) : (
              <div className={styles.dash__item_list}>
                {myRequests.slice(0, 3).map(r => (
                  <Link href={`/request/${r.id}`} key={r.id} className={styles.dash__item_row}>
                    <div className={styles.dash__item_info}>
                      <span className={styles.dash__item_name}>{r.title}</span>
                      <span className={styles.dash__item_sub}>{r.subcategory}</span>
                    </div>
                    <span className={`${styles.dash__badge} ${styles['dash__badge--blue']}`}>
                      {r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget} kr`}
                    </span>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>

        {/* Right column */}
        <div className={styles.dash__section}>
          <div className={styles.dash__section_head}>
            <span className={styles.dash__section_title}>
              {isProvider ? 'Intresseanmälningar' : 'Mina beställningar'}
            </span>
            <Link href={isProvider ? '/profile' : '/profile'} className={styles.dash__see_all}>Se alla</Link>
          </div>
          {isProvider ? (
            interests.length === 0 ? (
              <div className={styles.dash__empty}>Inga intresseanmälningar ännu.</div>
            ) : (
              <div className={styles.dash__item_list}>
                {interests.slice(0, 3).map(i => (
                  <div key={i.id} className={styles.dash__item_row}>
                    <div className={styles.dash__item_info}>
                      <span className={styles.dash__item_name}>{i.svippar_name}</span>
                      <span className={styles.dash__item_sub}>{i.request_title}</span>
                    </div>
                    {i.price > 0 && (
                      <span className={`${styles.dash__badge} ${styles['dash__badge--blue']}`}>{i.price} kr</span>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            placedOrders.length === 0 ? (
              <div className={styles.dash__empty}>Inga beställningar ännu.</div>
            ) : (
              <div className={styles.dash__item_list}>
                {placedOrders.slice(0, 3).map(o => {
                  const { text, cls } = statusLabel(o.status, o.project_status)
                  return (
                    <Link href={`/my-order/${o.id}`} key={o.id} className={styles.dash__item_row}>
                      <div className={styles.dash__item_info}>
                        <span className={styles.dash__item_name}>{o.service_title}</span>
                        <span className={styles.dash__item_sub}>{o.seller_name}</span>
                      </div>
                      <span className={`${styles.dash__badge} ${cls}`}>{text}</span>
                    </Link>
                  )
                })}
              </div>
            )
          )}
        </div>

      </div>

      {/* ── Tips from Sanity ───────────────────────────────────────────────── */}
      {tips.length > 0 && (
        <div className={styles.dash__tips}>
          <h2 className={styles.dash__tips_title}>Tips från oss på Svippo</h2>
          <div className={styles.dash__tips_grid}>
            {tips.map(post => (
              <Link href={`/blogg/${post.slug.current}`} key={post._id} className={styles.dash__tip_card}>
                <div className={styles.dash__tip_img_wrap}>
                  {post.mainImage?.asset?.url
                    ? <img src={post.mainImage.asset.url} alt={post.title} className={styles.dash__tip_img} />
                    : <div className={styles.dash__tip_img_fallback} />
                  }
                </div>
                <div className={styles.dash__tip_body}>
                  {post.category && <span className={styles.dash__tip_badge}>{post.category}</span>}
                  <h3 className={styles.dash__tip_heading}>{post.title}</h3>
                  {post.excerpt && <p className={styles.dash__tip_excerpt}>{post.excerpt}</p>}
                  <span className={styles.dash__tip_read_more}>Läs mer</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
