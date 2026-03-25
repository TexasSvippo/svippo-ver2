'use client'

import { useState, useEffect, useRef } from 'react'
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
type SocialLink = { id: string; url: string }

const NAV_ITEMS = [
  { id: 'oversikt', label: 'Översikt', icon: '🏠', group: null },
  { id: 'mina-tjanster', label: 'Mina tjänster', icon: '🛠️', group: 'Tjänster', svippareOnly: true },
  { id: 'mina-bevakningar', label: 'Mina bevakningar', icon: '🔔', group: 'Tjänster', svippareOnly: true },
  { id: 'inkomna-bestallningar', label: 'Inkomna beställningar', icon: '📥', group: 'Tjänster', svippareOnly: true },
  { id: 'mina-forfragningar', label: 'Mina förfrågningar', icon: '🙋', group: 'Förfrågningar' },
  { id: 'intresseanmalningar', label: 'Intresseanmälningar', icon: '👀', group: 'Förfrågningar' },
  { id: 'placerade-bestallningar', label: 'Placerade beställningar', icon: '📤', group: 'Förfrågningar' },
  { id: 'recensioner', label: 'Recensioner & betyg', icon: '⭐', group: 'Min profil' },
  { id: 'installningar', label: 'Profilinfo & inställningar', icon: '⚙️', group: 'Min profil' },
]

function Avatar({ url, name, size = 'md' }: { url?: string | null, name: string, size?: 'sm' | 'md' | 'lg' }) {
  const letter = (name || '?').charAt(0).toUpperCase()
  const sizeClass = size === 'sm' ? styles.avatar__sm : size === 'lg' ? styles.avatar__lg : styles.avatar__md
  if (url) {
    return <img src={url} alt={name} className={`${styles.avatar__img} ${sizeClass}`} />
  }
  return <div className={`${styles.avatar__fallback} ${sizeClass}`}><span>{letter}</span></div>
}

function RedirectToIntresseanmalningar({ router }: { router: ReturnType<typeof useRouter> }) {
  useEffect(() => {
    router.push('/intresseanmalningar')
  }, [router])
  return null
}

export default function ProfilePage() {
  const { user, loading, accountType, svippareStatus, canCreateService } = useAuth()
  const router = useRouter()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [activeSection, setActiveSection] = useState<Section>('oversikt')

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editing, setEditing] = useState(false)

  const [companyBio, setCompanyBio] = useState('')
  const [companyOrgNumber, setCompanyOrgNumber] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyCategories, setCompanyCategories] = useState<string[]>([])
  const [companySocialLinks, setCompanySocialLinks] = useState<SocialLink[]>([])
  const [companyProfileExists, setCompanyProfileExists] = useState(false)
  const [companySaving, setCompanySaving] = useState(false)
  const [companySuccess, setCompanySuccess] = useState(false)
  const [companyEditing, setCompanyEditing] = useState(false)

  const [services, setServices] = useState<Service[]>([])
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([])
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [interests, setInterests] = useState<Interest[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [watchedRequests, setWatchedRequests] = useState<Request[]>([])
  const [selectedWatchCategory, setSelectedWatchCategory] = useState('')

  const isCompanyType = accountType === 'foretag' || accountType === 'uf-foretag'
  const isBestellare = accountType === 'bestellare'

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
        setAvatarUrl(profileRes.data.avatar_url || null)
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
    if (!user || !isCompanyType) return
    const fetchCompanyProfile = async () => {
      const { data } = await supabase.from('company_profiles').select('*').eq('user_id', user.id).single()
      if (data) {
        setCompanyProfileExists(true)
        setCompanyBio(data.bio || '')
        setCompanyOrgNumber(data.org_number || '')
        setCompanyWebsite(data.website || '')
        setCompanyCity(data.city || '')
        setCompanyCategories(data.categories || [])
        setCompanySocialLinks((data.social_links || []).map((url: string, i: number) => ({ id: String(i), url })))
      }
    }
    fetchCompanyProfile()
  }, [user, isCompanyType])

  useEffect(() => {
    if (!loading && !user) router.push('/logga-in')
  }, [loading, user])

  useEffect(() => {
    if (!user || subscriptions.length === 0) return
    const fetchWatched = async () => {
      const categoryIds = subscriptions.map(s => s.category_id.split(':')[0])
      const unique = [...new Set(categoryIds)]
      const { data } = await supabase
        .from('requests').select('*').in('category_id', unique).neq('user_id', user.id).order('created_at', { ascending: false })
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 2 * 1024 * 1024) { alert('Bilden är för stor! Max 2MB.'); return }
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error('Avatar upload error:', err)
      alert('Något gick fel vid uppladdning. Försök igen.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleCompanySave = async () => {
    if (!user) return
    setCompanySaving(true)
    setCompanySuccess(false)
    const payload = {
      user_id: user.id, bio: companyBio, org_number: companyOrgNumber,
      website: companyWebsite, city: companyCity, categories: companyCategories,
      social_links: companySocialLinks.map(l => l.url).filter(Boolean),
      updated_at: new Date().toISOString(),
    }
    if (companyProfileExists) {
      await supabase.from('company_profiles').update(payload).eq('user_id', user.id)
    } else {
      await supabase.from('company_profiles').insert({ ...payload, created_at: new Date().toISOString() })
      setCompanyProfileExists(true)
    }
    setCompanySaving(false)
    setCompanySuccess(true)
    setCompanyEditing(false)
  }

  const toggleCompanyCategory = (catId: string) => {
    setCompanyCategories(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId])
  }

  const addSocialLink = () => setCompanySocialLinks(prev => [...prev, { id: Date.now().toString(), url: '' }])
  const updateSocialLink = (id: string, url: string) => setCompanySocialLinks(prev => prev.map(l => l.id === id ? { ...l, url } : l))
  const removeSocialLink = (id: string) => setCompanySocialLinks(prev => prev.filter(l => l.id !== id))

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
          <Avatar url={avatarUrl} name={displayName || user.email || '?'} size="sm" />
          <div>
            <strong className={styles.profile__sidebar_name}>{displayName || 'Inget namn'}</strong>
            <p className={styles.profile__sidebar_email}>{user.email}</p>
            {!isBestellare && (
              <Link href={`/svippare/${user.id}`} className={styles.profile__sidebar_publink}>
                👁️ Se publik profil →
              </Link>
            )}
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

          {['Tjänster', 'Förfrågningar', 'Min profil'].map(group => {
            const visibleItems = NAV_ITEMS.filter(item => item.group === group).filter(item => {
              if (!item.svippareOnly) return true
              return canCreateService
            })
            if (visibleItems.length === 0) return null
            return (
              <div key={group} className={styles.profile__nav_group}>
                <span className={styles.profile__nav_group_label}>{group}</span>
                {visibleItems.map(item => (
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
            )
          })}
        </nav>
      </aside>

      {/* Huvudinnehåll */}
      <main className={styles.profile__main}>

        {/* Pending-banner */}
        {activeSection === 'oversikt' && accountType === 'svippare' && svippareStatus === 'pending' && (
          <div className={styles.profile__pending_banner}>
            <span className={styles.profile__pending_banner_icon}>⏳</span>
            <div className={styles.profile__pending_banner_content}>
              <strong>Din Svippare-ansökan granskas</strong>
              <p>Vi håller på att granska din ansökan. Du får ett meddelande så snart den är godkänd. Tills dess kan du beställa tjänster som vanligt.</p>
            </div>
          </div>
        )}

        {/* ÖVERSIKT */}
        {activeSection === 'oversikt' && (
          <div className={styles.profile__section}>
            <div className={styles.welcome_banner}>
              <div className={styles.welcome_banner__content}>
                <div className={styles.welcome_banner__avatar}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={displayName} className={styles.welcome_banner__avatar_img} />
                    : (displayName || user.email || '?').charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <p className={styles.welcome_banner__greeting}>Välkommen tillbaka 👋</p>
                  <h1 className={styles.welcome_banner__name}>{displayName || 'Inget namn'}</h1>
                  {!isBestellare && (
                    <Link href={`/svippare/${user.id}`} className={styles.welcome_banner__publink}>
                      Se din publika profil →
                    </Link>
                  )}
                </div>
              </div>
              <div className={styles.welcome_banner__actions}>
                {canCreateService && (
                  <button className="btn btn-primary" onClick={() => router.push('/skapa-inlagg')}>
                    🛠️ Skapa tjänst
                  </button>
                )}
                <button className="btn btn-orange" onClick={() => router.push('/skapa-forfragning')}>
                  🙋 Skapa förfrågan
                </button>
              </div>
            </div>

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
                      {notif.type === 'project_completed' && <Link href={`/min-bestallning/${notif.order_id}`} className="btn btn-primary">Lämna recension</Link>}
                      {notif.type === 'request_review' && <Link href={`/bestallning/${notif.order_id}`} className="btn btn-orange">Ta betalt</Link>}
                      {notif.type === 'new_order' && <Link href={`/bestallning/${notif.order_id}`} className="btn btn-primary">Se beställning</Link>}
                      <button className={styles.notifications__dismiss} onClick={() => dismissNotif(notif.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <Link href="/notifikationer" className={styles.profile__notif_all}>Se alla notifikationer →</Link>
              </div>
            )}

            <div className={styles.profile__stats}>
              {canCreateService && (
                <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--blue']}`} onClick={() => setActiveSection('mina-tjanster')}>
                  <div className={styles.stat_icon_wrap}>🛠️</div>
                  <div className={styles.stat_info}><strong>{services.length}</strong><span>Aktiva tjänster</span></div>
                </div>
              )}
              {canCreateService && (
                <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--orange']}`} onClick={() => setActiveSection('inkomna-bestallningar')}>
                  <div className={styles.stat_icon_wrap}>📥</div>
                  <div className={styles.stat_info}><strong>{pendingOrders.length}</strong><span>Nya beställningar</span></div>
                </div>
              )}
              <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--green']}`} onClick={() => setActiveSection('mina-forfragningar')}>
                <div className={styles.stat_icon_wrap}>🙋</div>
                <div className={styles.stat_info}><strong>{myRequests.length}</strong><span>Förfrågningar</span></div>
              </div>
              <div className={`${styles.profile__stat_card} ${styles['profile__stat_card--purple']}`} onClick={() => setActiveSection('intresseanmalningar')}>
                <div className={styles.stat_icon_wrap}>👀</div>
                <div className={styles.stat_info}><strong>{interests.length}</strong><span>Intresseanmälningar</span></div>
              </div>
            </div>

            {/* Bli Svippare-banner för beställare */}
            {isBestellare && (
              <div className={`${styles.profile__block} card`} style={{ marginBottom: '24px', padding: '28px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '40px', flexShrink: 0 }}>⚡</span>
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Vill du sälja dina kunskaper?</h2>
                  <p style={{ color: 'var(--color-gray)', fontSize: '14px', margin: 0 }}>Bli en Svippare och börja tjäna pengar på dina färdigheter – helt gratis att komma igång.</p>
                </div>
                <Link href="/bli-svippare" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  ⚡ Ansök nu
                </Link>
              </div>
            )}

            <div className={styles.profile__dashboard}>
              <div className={styles.profile__dashboard_left}>

                {canCreateService && (
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
                )}

                {canCreateService && (
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
                )}

              </div>

              <div className={styles.profile__dashboard_right}>
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
              <div className={styles.profile__empty}><span>🛠️</span><p>Du har inga aktiva tjänster ännu.</p><button className="btn btn-primary" onClick={() => router.push('/skapa-inlagg')}>Skapa din första tjänst</button></div>
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
                        <button className={`btn btn-outline ${styles.profile__edit_btn}`} onClick={() => router.push(`/skapa-inlagg?edit=${s.id}`)}>✏️</button>
                        <button className={`btn btn-outline ${styles.profile__delete_btn}`} onClick={async () => {
                          if (!confirm('Är du säker på att du vill ta bort denna tjänst?')) return
                          await supabase.from('services').delete().eq('id', s.id)
                          setServices(prev => prev.filter(x => x.id !== s.id))
                        }}>🗑️</button>
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
              <div className={styles.profile__empty}><span>📤</span><p>Du har inte beställt några tjänster ännu.</p><button className="btn btn-primary" onClick={() => router.push('/tjanster')}>Utforska tjänster</button></div>
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
              <div className={styles.profile__empty}><span>🙋</span><p>Du har inga förfrågningar ännu.</p><button className="btn btn-orange" onClick={() => router.push('/skapa-forfragning')}>Skapa en förfrågan</button></div>
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
                      <strong className={styles.profile__item_budget}>{r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget} kr`}</strong>
                      <span className={`${styles.profile__item_tag} ${styles['item_tag--orange']}`}>Öppen</span>
                      <div className={styles.profile__item_actions}>
                        <button className={`btn btn-outline ${styles.profile__edit_btn}`} onClick={() => router.push(`/skapa-forfragning?edit=${r.id}`)}>✏️</button>
                        <button className={`btn btn-outline ${styles.profile__delete_btn}`} onClick={async () => {
                          if (!confirm('Är du säker på att du vill ta bort denna förfrågan?')) return
                          await supabase.from('requests').delete().eq('id', r.id)
                          setMyRequests(prev => prev.filter(x => x.id !== r.id))
                        }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INTRESSEANMÄLNINGAR – redirect */}
        {activeSection === 'intresseanmalningar' && (
          <RedirectToIntresseanmalningar router={router} />
        )}

        {/* MINA BEVAKNINGAR */}
        {activeSection === 'mina-bevakningar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Mina bevakningar</h1>
            <div className={`${styles.profile__block} card`}>
              <div className={styles.profile__block_header}>
                <div className={styles.profile__block_title}><span>🔔</span><h2>Bevakade kategorier</h2></div>
              </div>
              {subscriptions.length === 0 ? (
                <div className={styles.profile__block_empty}>
                  <p>Du bevakar inga kategorier ännu.</p>
                  <button className="btn btn-primary" onClick={() => router.push('/forfragningar')}>Gå till förfrågningar</button>
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
                        <button onClick={async () => {
                          await supabase.from('category_subscriptions').delete().eq('id', sub.id)
                          setSubscriptions(prev => prev.filter(s => s.id !== sub.id))
                        }}>✕</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className={styles.profile__section_header}>
              <h2 className={styles.profile__section_title} style={{ fontSize: '20px' }}>Förfrågningar inom dina kategorier</h2>
              {subscriptions.length > 0 && (
                <select className={styles.profile__watch_filter} value={selectedWatchCategory} onChange={e => setSelectedWatchCategory(e.target.value)}>
                  <option value="">Alla bevakade</option>
                  {subscriptions.map(sub => {
                    const [catId, subcat] = sub.category_id.split(':')
                    const cat = categories.find(c => c.id === catId)
                    return <option key={sub.id} value={sub.category_id}>{cat?.icon} {subcat || cat?.label}</option>
                  })}
                </select>
              )}
            </div>
            {watchedRequests.length === 0 ? (
              <div className={styles.profile__empty}><span>📭</span><p>Inga förfrågningar inom dina bevakade kategorier ännu.</p></div>
            ) : (
              <div className={styles.profile__list}>
                {watchedRequests.filter(r => {
                  if (!selectedWatchCategory) return true
                  const [catId, subcat] = selectedWatchCategory.split(':')
                  return r.category_id === catId && (!subcat || r.subcategory === subcat)
                }).map(r => (
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
                ))}
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
                <div className={styles.profile__avatar_wrap}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt={displayName} className={styles.profile__avatar_large_img} />
                    : <div className={styles.profile__avatar_large}>{(displayName || user.email || '?').charAt(0).toUpperCase()}</div>
                  }
                  <button className={styles.profile__avatar_upload_btn} onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                    {avatarUploading ? '⏳' : '📷'}
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </div>
                <span className={styles.profile__hint}>{avatarUploading ? 'Laddar upp...' : 'Klicka på kameran för att byta profilbild'}</span>
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

            {isCompanyType && (
              <div className={`${styles.profile__settings} card`}>
                <div className={styles.profile__settings_fields}>
                  <h2 className={styles.profile__section_title} style={{ fontSize: '20px' }}>
                    {accountType === 'uf-foretag' ? '🎓 UF-företagsprofil' : '🏢 Företagsprofil'}
                  </h2>
                  <p className={styles.profile__hint}>Denna information visas på din publika profilsida och hjälper kunder att hitta och kontakta dig.</p>
                  <div className={styles.profile__field}>
                    <label className={styles.profile__label}>Om företaget</label>
                    <textarea className={`${styles.profile__input} ${styles.profile__textarea} ${!companyEditing ? styles['profile__input--disabled'] : ''}`} value={companyBio} onChange={e => setCompanyBio(e.target.value)} disabled={!companyEditing} placeholder="Beskriv ert företag..." rows={5} />
                  </div>
                  {accountType === 'foretag' && (
                    <div className={styles.profile__field}>
                      <label className={styles.profile__label}>Organisationsnummer</label>
                      <input className={`${styles.profile__input} ${!companyEditing ? styles['profile__input--disabled'] : ''}`} value={companyOrgNumber} onChange={e => setCompanyOrgNumber(e.target.value)} disabled={!companyEditing} placeholder="556123-4567" />
                    </div>
                  )}
                  <div className={styles.profile__field}>
                    <label className={styles.profile__label}>Stad</label>
                    <input className={`${styles.profile__input} ${!companyEditing ? styles['profile__input--disabled'] : ''}`} value={companyCity} onChange={e => setCompanyCity(e.target.value)} disabled={!companyEditing} placeholder="Stockholm" />
                  </div>
                  <div className={styles.profile__field}>
                    <label className={styles.profile__label}>Webbplats</label>
                    <input className={`${styles.profile__input} ${!companyEditing ? styles['profile__input--disabled'] : ''}`} value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} disabled={!companyEditing} placeholder="https://ertforetag.se" />
                  </div>
                  <div className={styles.profile__field}>
                    <label className={styles.profile__label}>Kategorier ni erbjuder tjänster inom</label>
                    <div className={styles.profile__category_grid}>
                      {categories.map(cat => (
                        <button key={cat.id} type="button" disabled={!companyEditing} className={`${styles.profile__category_btn} ${companyCategories.includes(cat.id) ? styles['profile__category_btn--active'] : ''}`} onClick={() => companyEditing && toggleCompanyCategory(cat.id)}>
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.profile__field}>
                    <label className={styles.profile__label}>Sociala medier</label>
                    {companySocialLinks.map(link => (
                      <div key={link.id} className={styles.profile__social_row}>
                        <input className={`${styles.profile__input} ${!companyEditing ? styles['profile__input--disabled'] : ''}`} value={link.url} onChange={e => updateSocialLink(link.id, e.target.value)} disabled={!companyEditing} placeholder="https://instagram.com/ertforetag" />
                        {companyEditing && <button type="button" className={styles.profile__social_remove} onClick={() => removeSocialLink(link.id)}>✕</button>}
                      </div>
                    ))}
                    {companyEditing && <button type="button" className={styles.profile__social_add} onClick={addSocialLink}>+ Lägg till konto</button>}
                  </div>
                </div>
                {companySuccess && <div className={styles.profile__success}>✅ Företagsprofilen uppdaterades!</div>}
                <div className={styles.profile__settings_actions}>
                  {companyEditing ? (
                    <>
                      <button className="btn btn-primary" onClick={handleCompanySave} disabled={companySaving}>{companySaving ? 'Sparar...' : 'Spara företagsprofil'}</button>
                      <button className="btn btn-outline" onClick={() => setCompanyEditing(false)}>Avbryt</button>
                    </>
                  ) : (
                    <button className="btn btn-outline" onClick={() => setCompanyEditing(true)}>✏️ Redigera företagsprofil</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}