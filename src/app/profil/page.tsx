'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { categories } from '@/data/categories'
import styles from './profile.module.scss'

type Section =
  | 'oversikt'
  | 'mina-tjanster'
  | 'inkomna-bestallningar'
  | 'placerade-bestallningar'
  | 'mina-forfragningar'
  | 'intresseanmalningar'
  | 'mina-bevakningar' 
  | 'recensioner'
  | 'installningar'

type Service = { id: string; title: string; subcategory: string; price_type: string; price: number; location: string }
type Order = { id: string; service_title: string; buyer_name: string; buyer_email: string; message: string; status: string; project_status: string }
type PlacedOrder = { id: string; service_title: string; seller_name: string; message: string; status: string; project_status: string }
type Request = { id: string; title: string; category_id: string; subcategory: string; budget: number; budget_type: string; location: string }
type Interest = { id: string; request_title: string; svippar_name: string; svippar_email: string; message: string; price: number }
type Notification = { id: string; type: string; order_id: string; service_title: string; message: string; read: boolean }
type Subscription = { id: string; category_id: string }

const NAV_ITEMS = [
  { id: 'oversikt', label: 'Översikt', icon: '🏠', group: null },
  { id: 'mina-tjanster', label: 'Mina tjänster', icon: '🛠️', group: 'Tjänster' },
  { id: 'mina-bevakningar', label: 'Mina bevakningar', icon: '🔔', group: 'Tjänster' },
  { id: 'inkomna-bestallningar', label: 'Inkomna beställningar', icon: '📥', group: 'Tjänster' },
  { id: 'mina-forfragningar', label: 'Mina förfrågningar', icon: '🙋', group: 'Förfrågningar' },
  { id: 'intresseanmalningar', label: 'Intresseanmälningar', icon: '👀', group: 'Förfrågningar' },
  { id: 'placerade-bestallningar', label: 'Placerade beställningar', icon: '📤', group: 'Förfrågningar' },
  { id: 'recensioner', label: 'Recensioner & betyg', icon: '⭐', group: 'Min profil' },
  { id: 'installningar', label: 'Profilinfo & inställningar', icon: '⚙️', group: 'Min profil' },
]

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('oversikt')

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editing, setEditing] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([])
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [watchedRequests, setWatchedRequests] = useState<Request[]>([])
  const [selectedWatchCategory, setSelectedWatchCategory] = useState('')

  useEffect(() => {
    if (!user) return
    const fetchAll = async () => {
      const [profileRes, servicesRes, incomingRes, placedRes, requestsRes, interestsRes, notifsRes, subsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('services').select('*').eq('user_id', user.id),
        supabase.from('orders').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false }),
        supabase.from('requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('interests').select('*').eq('request_owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', user.id).eq('read', false),
        supabase.from('category_subscriptions').select('*').eq('user_id', user.id),
      ])
      if (profileRes.data) {
        setDisplayName(profileRes.data.name || '')
        setPhone(profileRes.data.phone || '')
        setBio(profileRes.data.bio || '')
      }
      setServices(servicesRes.data ?? [])
      setIncomingOrders(incomingRes.data ?? [])
      setPlacedOrders(placedRes.data ?? [])
      setMyRequests(requestsRes.data ?? [])
      setInterests(interestsRes.data ?? [])
      setNotifications(notifsRes.data ?? [])
      setSubscriptions(subsRes.data ?? [])
    }
    fetchAll()
  }, [user])

  useEffect(() => {
    if (!loading && !user) router.push('/logga-in')
  }, [loading, user])

  useEffect(() => {
    if (!user || subscriptions.length === 0) return
    const fetchWatched = async () => {
      const categoryIds = subscriptions.map(s => s.category_id.split(':')[0])
      const unique = [...new Set(categoryIds)]
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .in('category_id', unique)
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
      setWatchedRequests(data ?? [])
    }
    fetchWatched()
  }, [subscriptions, user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSuccess(false)
    await supabase.from('users').upsert({ id: user.id, name: displayName, email: user.email, phone, bio })
    setSaving(false)
    setSuccess(true)
    setEditing(false)
  }

const { dismiss } = useNotifications()

const dismissNotif = async (id: string) => {
  await dismiss(id)
  setNotifications(prev => prev.filter(n => n.id !== id))
}

  if (loading) return <div className={styles.profile_loading}>Laddar...</div>
  if (!user) return null

  const pendingOrders = incomingOrders.filter(o => o.status === 'pending')

  const statusLabel = (order: { status: string; project_status: string }) => {
    if (order.project_status === 'completed') return '✅ Avslutat'
    if (order.status === 'pending') return '⏳ Väntar'
    if (order.status === 'accepted') return '🔄 Pågår'
    return '❌ Nekad'
  }

  const statusTag = (order: { status: string; project_status: string }) => {
    if (order.project_status === 'completed') return styles['item_tag--completed']
    if (order.status === 'pending') return styles['item_tag--pending']
    if (order.status === 'accepted') return styles['item_tag--accepted']
    return styles['item_tag--rejected']
  }

  return (
    <div className={styles.profile}>

      {/* Sidopanel */}
      <aside className={styles.profile__sidebar}>
        <div className={styles.profile__sidebar_user}>
          <div className={styles.profile__sidebar_avatar}>
            <span>{(displayName || user.email || '?').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <strong className={styles.profile__sidebar_name}>{displayName || 'Inget namn'}</strong>
            <p className={styles.profile__sidebar_email}>{user.email}</p>
            <Link href={`/svippare/${user.id}`} className={styles.profile__sidebar_publink}>
              👁️ Se publik profil →
            </Link>
          </div>
        </div>

        <nav className={styles.profile__nav}>
          <button
            className={`${styles.profile__nav_item} ${activeSection === 'oversikt' ? styles['profile__nav_item--active'] : ''}`}
            onClick={() => setActiveSection('oversikt')}
          >
            <span className={styles.profile__nav_icon}>🏠</span>
            <span>Översikt</span>
          </button>

          {['Tjänster', 'Förfrågningar', 'Min profil'].map(group => (
            <div key={group} className={styles.profile__nav_group}>
              <span className={styles.profile__nav_group_label}>{group}</span>
              {NAV_ITEMS.filter(item => item.group === group).map(item => (
                <button
                  key={item.id}
                  className={`${styles.profile__nav_item} ${activeSection === item.id ? styles['profile__nav_item--active'] : ''}`}
                  onClick={() => setActiveSection(item.id as Section)}
                >
                  <span className={styles.profile__nav_icon}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'inkomna-bestallningar' && pendingOrders.length > 0 && (
                    <span className={styles.profile__nav_badge}>{pendingOrders.length}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Huvudinnehåll */}
      <main className={styles.profile__main}>

        {/* ÖVERSIKT */}
        {activeSection === 'oversikt' && (
          <div className={styles.profile__section}>

            {/* Välkomstbanner */}
            <div className={styles.welcome_banner}>
              <div className={styles.welcome_banner__content}>
                <div className={styles.welcome_banner__avatar}>
                  {(displayName || user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={styles.welcome_banner__greeting}>Välkommen tillbaka 👋</p>
                  <h1 className={styles.welcome_banner__name}>{displayName || 'Inget namn'}</h1>
                  <Link href={`/svippare/${user.id}`} className={styles.welcome_banner__publink}>
                    Se din publika profil →
                  </Link>
                </div>
              </div>
              <div className={styles.welcome_banner__actions}>
                <button className="btn btn-primary" onClick={() => router.push('/skapa-inlagg')}>
                  🛠️ Skapa tjänst
                </button>
                <button className="btn btn-orange" onClick={() => router.push('/skapa-forfragning')}>
                  🙋 Skapa förfrågan
                </button>
              </div>
            </div>

            {/* Notifikationer */}
            {notifications.length > 0 && (
              <div className={styles.profile__notifications}>
                {notifications.map(notif => (
                  <div key={notif.id} className={`${styles.profile__notification} ${styles[`profile__notification--${notif.type}`]}`}>
                    <span className={styles.profile__notification_icon}>
                      {notif.type === 'project_completed' ? '🎉' : notif.type === 'new_order' ? '📦' : notif.type === 'order_accepted' ? '✅' : '💰'}
                    </span>
                    <div className={styles.profile__notification_content}>
                      <p>{notif.message}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      {notif.type === 'project_completed' && (
                        <Link href={`/min-bestallning/${notif.order_id}`} className="btn btn-primary">Lämna recension</Link>
                      )}
                      {notif.type === 'request_review' && (
                        <Link href={`/bestallning/${notif.order_id}`} className="btn btn-orange">Ta betalt</Link>
                      )}
                      {notif.type === 'new_order' && (
                        <Link href={`/bestallning/${notif.order_id}`} className="btn btn-primary">Se beställning</Link>
                      )}
                      <button className={styles.notifications__dismiss} onClick={() => dismissNotif(notif.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <Link href="/notifikationer" className={styles.profile__notif_all}>Se alla notifikationer →</Link>
              </div>
            )}

            {/* Statistik-kort */}
            <div className={styles.profile__stats}>
              <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--blue']}`} onClick={() => setActiveSection('mina-tjanster')}>
                <div className={styles.stat_icon_wrap}>🛠️</div>
                <div className={styles.stat_info}>
                  <strong>{services.length}</strong>
                  <span>Aktiva tjänster</span>
                </div>
              </div>
              <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--orange']}`} onClick={() => setActiveSection('inkomna-bestallningar')}>
                <div className={styles.stat_icon_wrap}>📥</div>
                <div className={styles.stat_info}>
                  <strong>{pendingOrders.length}</strong>
                  <span>Nya beställningar</span>
                </div>
              </div>
              <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--green']}`} onClick={() => setActiveSection('mina-forfragningar')}>
                <div className={styles.stat_icon_wrap}>🙋</div>
                <div className={styles.stat_info}>
                  <strong>{myRequests.length}</strong>
                  <span>Förfrågningar</span>
                </div>
              </div>
              <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--purple']}`} onClick={() => setActiveSection('intresseanmalningar')}>
                <div className={styles.stat_icon_wrap}>👀</div>
                <div className={styles.stat_info}>
                  <strong>{interests.length}</strong>
                  <span>Intresseanmälningar</span>
                </div>
              </div>
            </div>

            {/* Dashboard-block */}
            <div className={styles.profile__dashboard}>
              <div className={styles.profile__dashboard_left}>

                {/* Mina tjänster */}
                <div className={`${styles.profile__block} card`}>
                  <div className={styles.profile__block_header}>
                    <div className={styles.profile__block_title}><span>🛠️</span><h2>Mina tjänster</h2></div>
                    <button className={styles.profile__block_link} onClick={() => setActiveSection('mina-tjanster')}>Se alla →</button>
                  </div>
                  {services.length === 0 ? (
                    <div className={styles.profile__block_empty}>
                      <p>Inga aktiva tjänster ännu</p>
                      <button className="btn btn-primary" onClick={() => router.push('/skapa-inlagg')}>+ Skapa tjänst</button>
                    </div>
                  ) : (
                    <div className={styles.profile__block_list}>
                      {services.slice(0, 3).map(s => (
                        <Link href={`/tjanst/${s.id}`} key={s.id} className={styles.profile__block_item}>
                          <div className={styles.profile__block_item_info}>
                            <strong>{s.title}</strong>
                            <span>{s.subcategory} · {s.location}</span>
                          </div>
                          <span className={`${styles.profile__item_tag} ${styles['item_tag--blue']}`}>
                            {s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}
                          </span>
                        </Link>
                      ))}
                      <button className="btn btn-primary" onClick={() => router.push('/skapa-inlagg')}>+ Ny tjänst</button>
                    </div>
                  )}
                </div>

                {/* Inkomna beställningar */}
                <div className={`${styles.profile__block} card`}>
                  <div className={styles.profile__block_header}>
                    <div className={styles.profile__block_title}>
                      <span>📥</span><h2>Inkomna beställningar</h2>
                      {pendingOrders.length > 0 && <span className={styles.profile__nav_badge}>{pendingOrders.length}</span>}
                    </div>
                    <button className={styles.profile__block_link} onClick={() => setActiveSection('inkomna-bestallningar')}>Se alla →</button>
                  </div>
                  {incomingOrders.length === 0 ? (
                    <div className={styles.profile__block_empty}><p>Inga beställningar ännu</p></div>
                  ) : (
                    <div className={styles.profile__block_list}>
                      {incomingOrders.slice(0, 3).map(order => (
                        <Link href={`/bestallning/${order.id}`} key={order.id} className={styles.profile__block_item}>
                          <div className={styles.profile__block_item_info}>
                            <strong>{order.buyer_name}</strong>
                            <span>{order.service_title}</span>
                          </div>
                          <span className={`${styles.profile__item_tag} ${statusTag(order)}`}>{statusLabel(order)}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className={styles.profile__dashboard_right}>

                {/* Mina förfrågningar */}
                <div className={`${styles.profile__block} card`}>
                  <div className={styles.profile__block_header}>
                    <div className={styles.profile__block_title}><span>🙋</span><h2>Mina förfrågningar</h2></div>
                    <button className={styles.profile__block_link} onClick={() => setActiveSection('mina-forfragningar')}>Se alla →</button>
                  </div>
                  {myRequests.length === 0 ? (
                    <div className={styles.profile__block_empty}>
                      <p>Inga förfrågningar ännu</p>
                      <button className="btn btn-orange" onClick={() => router.push('/skapa-forfragning')}>+ Skapa förfrågan</button>
                    </div>
                  ) : (
                    <div className={styles.profile__block_list}>
                      {myRequests.slice(0, 3).map(r => (
                        <Link href={`/forfragning/${r.id}`} key={r.id} className={styles.profile__block_item}>
                          <div className={styles.profile__block_item_info}>
                            <strong>{r.title}</strong>
                            <span>{r.subcategory} · {r.location}</span>
                          </div>
                          <span className={`${styles.profile__item_tag} ${styles['item_tag--orange']}`}>
                            {r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget} kr`}
                          </span>
                        </Link>
                      ))}
                      <button className="btn btn-orange" onClick={() => router.push('/skapa-forfragning')}>+ Ny förfrågan</button>
                    </div>
                  )}
                </div>

                {/* Intresseanmälningar */}
                <div className={`${styles.profile__block} card`}>
                  <div className={styles.profile__block_header}>
                    <div className={styles.profile__block_title}><span>👀</span><h2>Intresseanmälningar</h2></div>
                    <button className={styles.profile__block_link} onClick={() => setActiveSection('intresseanmalningar')}>Se alla →</button>
                  </div>
                  {interests.length === 0 ? (
                    <div className={styles.profile__block_empty}><p>Inga intresseanmälningar ännu</p></div>
                  ) : (
                    <div className={styles.profile__block_list}>
                      {interests.slice(0, 3).map(interest => (
                        <div key={interest.id} className={styles.profile__block_item}>
                          <div className={styles.profile__block_item_info}>
                            <strong>{interest.svippar_name}</strong>
                            <span>{interest.request_title}</span>
                          </div>
                          {interest.price && <span className={`${styles.profile__item_tag} ${styles['item_tag--blue']}`}>{interest.price} kr</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* MINA TJÄNSTER */}
        {activeSection === 'mina-tjanster' && (
          <div className={styles.profile__section}>
            <div className={styles.profile__section_header}>
              <h1 className={styles.profile__section_title}>Mina tjänster</h1>
              <button className="btn btn-primary" onClick={() => router.push('/skapa-inlagg')}>+ Ny tjänst</button>
            </div>
            {services.length === 0 ? (
              <div className={styles.profile__empty}>
                <span>🛠️</span>
                <p>Du har inga aktiva tjänster ännu.</p>
                <button className="btn btn-primary" onClick={() => router.push('/skapa-inlagg')}>Skapa din första tjänst</button>
              </div>
            ) : (
              <div className={styles.profile__list}>
              {services.map(s => (
                <div key={s.id} className={`${styles.profile__item} card`}>
                  <div className={styles.profile__item_icon}>🛠️</div>
                  <Link href={`/tjanst/${s.id}`} className={styles.profile__item_info}>
                    <strong>{s.title}</strong>
                    <span>{s.subcategory} · {s.location}</span>
                  </Link>
                  <div className={styles.profile__item_right}>
                    <strong>{s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}</strong>
                    <span className={`${styles.profile__item_tag} ${styles['item_tag--blue']}`}>{s.price_type}</span>
                    <div className={styles.profile__item_actions}>
                      <button
                        className={`btn btn-outline ${styles.profile__edit_btn}`}
                        onClick={() => router.push(`/skapa-inlagg?edit=${s.id}`)}
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn btn-outline ${styles.profile__delete_btn}`}
                        onClick={async () => {
                          if (!confirm('Är du säker på att du vill ta bort denna tjänst?')) return
                          await supabase.from('services').delete().eq('id', s.id)
                          setServices(prev => prev.filter(x => x.id !== s.id))
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {/* INKOMNA BESTÄLLNINGAR */}
        {activeSection === 'inkomna-bestallningar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Inkomna beställningar</h1>
            {incomingOrders.length === 0 ? (
              <div className={styles.profile__empty}><span>📥</span><p>Inga beställningar ännu.</p></div>
            ) : (
              <div className={styles.profile__list}>
                {incomingOrders.map(order => (
                  <Link href={`/bestallning/${order.id}`} key={order.id} className={`${styles.profile__item} card`}>
                    <div className={styles.profile__item_icon}>{order.project_status === 'completed' ? '✅' : order.status === 'pending' ? '⏳' : order.status === 'accepted' ? '🔄' : '❌'}</div>
                    <div className={styles.profile__item_info}>
                      <strong>{order.service_title}</strong>
                      <span>Från: {order.buyer_name} · {order.buyer_email}</span>
                      <p className={styles.profile__item_message}>{order.message}</p>
                    </div>
                    <span className={`${styles.profile__item_tag} ${statusTag(order)}`}>{statusLabel(order)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLACERADE BESTÄLLNINGAR */}
        {activeSection === 'placerade-bestallningar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Placerade beställningar</h1>
            {placedOrders.length === 0 ? (
              <div className={styles.profile__empty}>
                <span>📤</span>
                <p>Du har inte beställt några tjänster ännu.</p>
                <button className="btn btn-primary" onClick={() => router.push('/tjanster')}>Utforska tjänster</button>
              </div>
            ) : (
              <div className={styles.profile__list}>
                {placedOrders.map(order => (
                  <Link href={`/min-bestallning/${order.id}`} key={order.id} className={`${styles.profile__item} card`}>
                    <div className={styles.profile__item_icon}>{order.project_status === 'completed' ? '✅' : order.status === 'pending' ? '⏳' : order.status === 'accepted' ? '🔄' : '❌'}</div>
                    <div className={styles.profile__item_info}>
                      <strong>{order.service_title}</strong>
                      <span>Utförare: {order.seller_name}</span>
                      <p className={styles.profile__item_message}>{order.message}</p>
                    </div>
                    <span className={`${styles.profile__item_tag} ${statusTag(order)}`}>{statusLabel(order)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MINA FÖRFRÅGNINGAR */}
        {activeSection === 'mina-forfragningar' && (
          <div className={styles.profile__section}>
            <div className={styles.profile__section_header}>
              <h1 className={styles.profile__section_title}>Mina förfrågningar</h1>
              <button className="btn btn-orange" onClick={() => router.push('/skapa-forfragning')}>+ Ny förfrågan</button>
            </div>
            {myRequests.length === 0 ? (
              <div className={styles.profile__empty}>
                <span>🙋</span>
                <p>Du har inga förfrågningar ännu.</p>
                <button className="btn btn-orange" onClick={() => router.push('/skapa-forfragning')}>Skapa en förfrågan</button>
              </div>
            ) : (
              <div className={styles.profile__list}>
              {myRequests.map(r => (
                <div key={r.id} className={`${styles.profile__item} card`}>
                  <div className={styles.profile__item_icon}>🙋</div>
                  <Link href={`/forfragning/${r.id}`} className={styles.profile__item_info}>
                    <strong>{r.title}</strong>
                    <span>{r.subcategory} · {r.location}</span>
                  </Link>
                  <div className={styles.profile__item_right}>
                    <strong className={styles.profile__item_budget}>
                      {r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget} kr`}
                    </strong>
                    <span className={`${styles.profile__item_tag} ${styles['item_tag--orange']}`}>Öppen</span>
                    <div className={styles.profile__item_actions}>
                      <button
                        className={`btn btn-outline ${styles.profile__edit_btn}`}
                        onClick={() => router.push(`/skapa-forfragning?edit=${r.id}`)}
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn btn-outline ${styles.profile__delete_btn}`}
                        onClick={async () => {
                          if (!confirm('Är du säker på att du vill ta bort denna förfrågan?')) return
                          await supabase.from('requests').delete().eq('id', r.id)
                          setMyRequests(prev => prev.filter(x => x.id !== r.id))
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        )}

        {/* INTRESSEANMÄLNINGAR */}
        {activeSection === 'intresseanmalningar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Intresseanmälningar</h1>
            {interests.length === 0 ? (
              <div className={styles.profile__empty}><span>👀</span><p>Inga intresseanmälningar ännu.</p></div>
            ) : (
              <div className={styles.profile__list}>
                {interests.map(interest => (
                  <div key={interest.id} className={`${styles.profile__item} card`}>
                    <div className={styles.profile__item_icon}>👀</div>
                    <div className={styles.profile__item_info}>
                      <strong>{interest.svippar_name}</strong>
                      <span>För: {interest.request_title}</span>
                      <p className={styles.profile__item_message}>{interest.message}</p>
                    </div>
                    <div className={styles.profile__item_right}>
                      {interest.price && <strong>{interest.price} kr</strong>}
                      <a href={`mailto:${interest.svippar_email}`} className="btn btn-primary">Kontakta</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MINA BEVAKNINGAR */}
        {activeSection === 'mina-bevakningar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Mina bevakningar</h1>

            {/* Bevakade kategorier */}
            <div className={`${styles.profile__block} card`}>
              <div className={styles.profile__block_header}>
                <div className={styles.profile__block_title}><span>🔔</span><h2>Bevakade kategorier</h2></div>
              </div>
              {subscriptions.length === 0 ? (
                <div className={styles.profile__block_empty}>
                  <p>Du bevakar inga kategorier ännu.</p>
                  <button className="btn btn-primary" onClick={() => router.push('/forfragningar')}>
                    Gå till förfrågningar
                  </button>
                </div>
              ) : (
                <div className={styles.subscription_tags}>
                  {subscriptions.map(sub => {
                    const [catId, subcat] = sub.category_id.split(':')
                    const cat = categories.find(c => c.id === catId)
                    return (
                      <div key={sub.id} className={styles.subscription_tag}>
                        <span>{cat?.icon}</span>
                        <span>{subcat || cat?.label}</span>
                        <button
                          onClick={async () => {
                            await supabase.from('category_subscriptions').delete().eq('id', sub.id)
                            setSubscriptions(prev => prev.filter(s => s.id !== sub.id))
                          }}
                        >✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Förfrågningar inom bevakade kategorier */}
            <div className={styles.profile__section_header}>
              <h2 className={styles.profile__section_title} style={{ fontSize: '20px' }}>
                Förfrågningar inom dina kategorier
              </h2>
              {subscriptions.length > 0 && (
                <select
                  className={styles.profile__watch_filter}
                  value={selectedWatchCategory}
                  onChange={e => setSelectedWatchCategory(e.target.value)}
                >
                  <option value="">Alla bevakade</option>
                  {subscriptions.map(sub => {
                    const [catId, subcat] = sub.category_id.split(':')
                    const cat = categories.find(c => c.id === catId)
                    return (
                      <option key={sub.id} value={sub.category_id}>
                        {cat?.icon} {subcat || cat?.label}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            {watchedRequests.length === 0 ? (
              <div className={styles.profile__empty}>
                <span>📭</span>
                <p>Inga förfrågningar inom dina bevakade kategorier ännu.</p>
              </div>
            ) : (
              <div className={styles.profile__list}>
                {watchedRequests
                  .filter(r => {
                    if (!selectedWatchCategory) return true
                    const [catId, subcat] = selectedWatchCategory.split(':')
                    return r.category_id === catId && (!subcat || r.subcategory === subcat)
                  })
                  .map(r => (
                    <Link href={`/forfragning/${r.id}`} key={r.id} className={`${styles.profile__item} card`}>
                      <div className={styles.profile__item_icon}>🙋</div>
                      <div className={styles.profile__item_info}>
                        <strong>{r.title}</strong>
                        <span>{r.subcategory} · {r.location}</span>
                      </div>
                      <div className={styles.profile__item_right}>
                        <strong>{r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget} kr`}</strong>
                        <span className={`${styles.profile__item_tag} ${styles['item_tag--orange']}`}>Öppen</span>
                      </div>
                    </Link>
                  ))
                }
              </div>
            )}
          </div>
        )}

        {/* RECENSIONER */}
        {activeSection === 'recensioner' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Recensioner & betyg</h1>
            <p style={{ color: 'var(--color-gray)' }}>Recensioner visas här när du har fått dem.</p>
          </div>
        )}

        {/* INSTÄLLNINGAR */}
        {activeSection === 'installningar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Profilinfo & inställningar</h1>
            <div className={`${styles.profile__settings} card`}>
              <div className={styles.profile__settings_avatar}>
                <div className={styles.profile__avatar_large}>
                  {(displayName || user.email || '?').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className={styles.profile__settings_fields}>
                <div className={styles.profile__field}>
                  <label className={styles.profile__label}>Visningsnamn</label>
                  <input className={`${styles.profile__input} ${!editing ? styles['profile__input--disabled'] : ''}`} value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={!editing} placeholder="Ditt namn" />
                </div>
                <div className={styles.profile__field}>
                  <label className={styles.profile__label}>E-post</label>
                  <input className={`${styles.profile__input} ${styles['profile__input--disabled']}`} value={user.email || ''} disabled />
                  <span className={styles.profile__hint}>E-post kan inte ändras</span>
                </div>
                <div className={styles.profile__field}>
                  <label className={styles.profile__label}>Telefonnummer</label>
                  <input className={`${styles.profile__input} ${!editing ? styles['profile__input--disabled'] : ''}`} value={phone} onChange={e => setPhone(e.target.value)} disabled={!editing} placeholder="070-000 00 00" type="tel" />
                </div>
                <div className={styles.profile__field}>
                  <label className={styles.profile__label}>Om mig</label>
                  <textarea className={`${styles.profile__input} ${styles.profile__textarea} ${!editing ? styles['profile__input--disabled'] : ''}`} value={bio} onChange={e => setBio(e.target.value)} disabled={!editing} placeholder="Beskriv dig själv..." rows={4} />
                  <span className={styles.profile__hint}>Visas på din publika profilsida</span>
                </div>
              </div>
              {success && <div className={styles.profile__success}>✅ Profilen uppdaterades!</div>}
              <div className={styles.profile__settings_actions}>
                {editing ? (
                  <>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Sparar...' : 'Spara ändringar'}</button>
                    <button className="btn btn-outline" onClick={() => setEditing(false)}>Avbryt</button>
                  </>
                ) : (
                  <button className="btn btn-outline" onClick={() => setEditing(true)}>✏️ Redigera profil</button>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}