'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { categories } from '@/data/categories'
import styles from './profile.module.scss'
import { Home, Wrench, Bell, Inbox, Users, Eye, Send, Star, Trophy, Settings, Zap, Pencil, Trash2, CheckCircle, Clock, XCircle, MessageCircle, ClipboardList, Wallet, Package, Tag, MapPin, Globe } from 'lucide-react'
import { renderStars } from '@/utils/renderStars'
import type { ReactNode } from 'react'
import DashboardOversikt from './DashboardOversikt'
import Intresseanmalningar from '@/components/profile/Intresseanmalningar'

type Section =
  | 'oversikt'
  | 'mina-tjanster'
  | 'inkomna-bestallningar'
  | 'placerade-bestallningar'
  | 'mina-forfragningar'
  | 'intresseanmalningar'
  | 'mina-bevakningar'
  | 'recensioner'
  | 'karriar'
  | 'installningar'

type Service = { id: string; title: string; subcategory: string; price_type: string; price: number; location: string }
type Order = { id: string; service_title: string; buyer_name: string; buyer_email: string; message: string; status: string; project_status: string }
type PlacedOrder = { id: string; service_title: string; seller_name: string; message: string; status: string; project_status: string }
type KarriarOrder = { id: string; service_title: string; buyer_name: string; project_status: string; created_at: string }
type Request = { id: string; title: string; category_id: string; subcategory: string; budget: number; budget_type: string; location: string; status?: string }
type Interest = { id: string; request_title: string; svippar_name: string; svippar_email: string; message: string; price: number }
type Notification = { id: string; type: string; order_id: string; service_title: string; message: string; read: boolean }
type Subscription = { id: string; category_id: string }
type SocialLink = { id: string; url: string }
type Certificate = { id: string; name: string; category_id: string; subcategory: string; file_url: string }

const NAV_ITEMS: { id: string; label: string; icon: ReactNode; group: string | null; svippareOnly?: boolean }[] = [
  { id: 'oversikt', label: 'Översikt', icon: <Home size={16} />, group: null },
  { id: 'mina-tjanster', label: 'Mina tjänster', icon: <Wrench size={16} />, group: 'Tjänster', svippareOnly: true },
  { id: 'mina-bevakningar', label: 'Mina bevakningar', icon: <Bell size={16} />, group: 'Tjänster', svippareOnly: true },
  { id: 'inkomna-bestallningar', label: 'Inkomna beställningar', icon: <Inbox size={16} />, group: 'Tjänster', svippareOnly: true },
  { id: 'mina-forfragningar', label: 'Mina förfrågningar', icon: <Users size={16} />, group: 'Förfrågningar' },
  { id: 'intresseanmalningar', label: 'Intresseanmälningar', icon: <Eye size={16} />, group: 'Förfrågningar' },
  { id: 'placerade-bestallningar', label: 'Placerade beställningar', icon: <Send size={16} />, group: 'Förfrågningar' },
  { id: 'recensioner', label: 'Recensioner & betyg', icon: <Star size={16} />, group: 'Min profil' },
  { id: 'karriar', label: 'Min karriär', icon: <Trophy size={16} />, group: 'Min profil', svippareOnly: true },
  { id: 'installningar', label: 'Profilinfo & inställningar', icon: <Settings size={16} />, group: 'Min profil' },
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

  const [dbAccountType, setDbAccountType] = useState<string | null>(null)

  // Placerade beställningar – filter state
  const [placedTypeFilter, setPlacedTypeFilter] = useState<'all' | 'services' | 'requests'>('all')
  const [placedStatusFilter, setPlacedStatusFilter] = useState<'all' | 'active' | 'action' | 'completed'>('all')
  const [showHistory, setShowHistory] = useState(false)
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set())
  const [showIncomingHistory, setShowIncomingHistory] = useState(false)
  // Inkomna beställningar – filter state
  const [incomingTypeFilter, setIncomingTypeFilter] = useState<'all' | 'services' | 'requests'>('all')
  const [incomingStatusFilter, setIncomingStatusFilter] = useState<'all' | 'action' | 'active' | 'done'>('all')

  const resolvedAccountType = dbAccountType ?? accountType
  const isCompanyType = resolvedAccountType === 'foretag' || resolvedAccountType === 'uf-foretag'
  const isBestellare = resolvedAccountType === 'bestellare'

  const [karriarOrders, setKarriarOrders] = useState<KarriarOrder[]>([])
  const [karriarReviews, setKarriarReviews] = useState<{ rating: number }[]>([])
  const [profileReviews, setProfileReviews] = useState<{ id: string; rating: number; comment: string; reviewer_name: string; service_title: string; created_at: string }[]>([])
  const [showAchievementPopup, setShowAchievementPopup] = useState(false)
  const [achievementTitle, setAchievementTitle] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certName, setCertName] = useState('')
  const [certCategoryId, setCertCategoryId] = useState('')
  const [certSubcategory, setCertSubcategory] = useState('')
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certUploading, setCertUploading] = useState(false)
  const certFileRef = useRef<HTMLInputElement>(null)

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
        setDbAccountType(profileRes.data.account_type || null)
      }
      setServices(servicesRes.data ?? [])
      setIncomingOrders(incomingRes.data ?? [])
      setPlacedOrders(placedRes.data ?? [])
      setMyRequests(requestsRes.data ?? [])
      setInterests(interestsRes.data ?? [])
      setNotifications(notifsRes.data ?? [])
      setSubscriptions(subsRes.data ?? [])

      // Hämta vilka orders användaren redan recenserat
      const { data: myReviews } = await supabase
        .from('reviews')
        .select('order_id')
        .eq('reviewer_id', user.id)
      setReviewedOrderIds(new Set(myReviews?.map(r => r.order_id) ?? []))

      // Hämta certifikat
      if (canCreateService) {
        const { data: certsData } = await supabase.from('certificates').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        setCertificates(certsData ?? [])
      }

      // Hämta karriärdata för utförare
      if (canCreateService) {
        const { data: completedOrders } = await supabase
          .from('orders')
          .select('id, service_title, buyer_name, project_status, created_at')
          .eq('seller_id', user.id)
          .eq('project_status', 'completed')
          .order('created_at', { ascending: false })
        setKarriarOrders(completedOrders ?? [])

        const { data: receivedReviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewee_id', user.id)
          .eq('role', 'buyer')
        setKarriarReviews(receivedReviews ?? [])
      }

      const { data: roleData } = await supabase.from('users').select('role').eq('id', user.id).single()
      setIsAdmin(roleData?.role === 'admin')

      // Hämta alla recensioner riktade till inloggad användare
      const { data: revData } = await supabase
        .from('reviews')
        .select('id, rating, comment, reviewer_name, service_title, created_at')
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false })
      console.log('[profileReviews]', revData)
      setProfileReviews(revData ?? [])
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
    if (!loading && !user) router.push('/login')
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

  const handleCertUpload = async () => {
    if (!user || !certFile || !certName || !certCategoryId || !certSubcategory) return
    if (certFile.size > 5 * 1024 * 1024) { alert('PDF:en är för stor! Max 5MB.'); return }
    setCertUploading(true)
    try {
      const fileName = `${user.id}/${Date.now()}.pdf`
      const { error: uploadError } = await supabase.storage.from('certificates').upload(fileName, certFile)
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(fileName)
      const { data: inserted } = await supabase.from('certificates').insert({
        user_id: user.id, name: certName, category_id: certCategoryId,
        subcategory: certSubcategory, file_url: urlData.publicUrl,
      }).select().single()
      if (inserted) setCertificates(prev => [inserted, ...prev])
      setCertName(''); setCertCategoryId(''); setCertSubcategory(''); setCertFile(null)
      if (certFileRef.current) certFileRef.current.value = ''
    } catch (err) {
      console.error('Certificate upload error:', err)
      alert('Något gick fel vid uppladdning. Försök igen.')
    } finally {
      setCertUploading(false)
    }
  }

  const handleCertDelete = async (id: string, fileUrl: string) => {
    if (!confirm('Ta bort detta certifikat?')) return
    const path = fileUrl.split('/certificates/')[1]
    if (path) await supabase.storage.from('certificates').remove([path])
    await supabase.from('certificates').delete().eq('id', id)
    setCertificates(prev => prev.filter(c => c.id !== id))
  }

  const { dismiss } = useNotifications()
  const dismissNotif = async (id: string) => {
    await dismiss(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (loading) return <div className={styles.profile_loading}>Laddar...</div>
  if (!user) return null

  const pendingOrders = incomingOrders.filter(o => o.status === 'pending')

  const statusLabel = (order: { status: string; project_status: string }): ReactNode => {
    if (order.project_status === 'completed') return <><CheckCircle size={14} /> Avslutat</>
    if (order.status === 'pending') return <><Clock size={14} /> Väntar</>
    if (order.status === 'accepted') return '🔄 Pågår'
    return <><XCircle size={14} /> Nekad</>
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
            {(dbAccountType === 'svippare' || dbAccountType === 'foretag' || dbAccountType === 'uf-foretag') && (
              <Link href={`/provider/${user.id}`} className={styles.profile__sidebar_publink} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} /> Se publik profil →
              </Link>
            )}
          </div>
        </div>

        <nav className={styles.profile__nav}>
          <button
            className={`${styles.profile__nav_item} ${activeSection === 'oversikt' ? styles['profile__nav_item--active'] : ''}`}
            onClick={() => setActiveSection('oversikt')}
          >
            <span className={styles.profile__nav_icon}><Home size={16} /></span>
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

          {isAdmin && (
            <div className={styles.profile__nav_group}>
              <span className={styles.profile__nav_group_label}>Admin</span>
              <Link
                href="/admin"
                className={styles.profile__nav_item}
              >
                <span className={styles.profile__nav_icon}><Settings size={16} /></span>
                <span>Adminpanel</span>
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* Huvudinnehåll */}
      <main className={styles.profile__main}>

        {/* Pending-banner */}
        {activeSection === 'oversikt' && accountType === 'svippare' && svippareStatus === 'pending' && (
          <div className={styles.profile__pending_banner}>
            <span className={styles.profile__pending_banner_icon}><Clock size={20} /></span>
            <div className={styles.profile__pending_banner_content}>
              <strong>Din Svippare-ansökan granskas</strong>
              <p>Vi håller på att granska din ansökan. Du får ett meddelande så snart den är godkänd. Tills dess kan du beställa tjänster som vanligt.</p>
            </div>
          </div>
        )}

        {/* ÖVERSIKT */}
        {activeSection === 'oversikt' && (
          <div className={styles.profile__section}>
            <DashboardOversikt
              displayName={displayName}
              avatarUrl={avatarUrl}
              dbAccountType={dbAccountType}
              svippareStatus={svippareStatus}
              canCreateService={canCreateService}
              services={services}
              incomingOrders={incomingOrders}
              placedOrders={placedOrders}
              myRequests={myRequests}
              interests={interests}
              notifications={notifications}
              userId={user.id}
              onDismissNotif={dismissNotif}
            />

          </div>
        )}

        {/* MINA TJÄNSTER */}
        {activeSection === 'mina-tjanster' && (
          <div className={styles.profile__section}>
            <div className={styles.profile__section_header}>
              <h1 className={styles.profile__section_title}>Mina tjänster</h1>
              <button className="btn btn-primary" onClick={() => router.push('/create-service')}>+ Ny tjänst</button>
            </div>
            {services.length === 0 ? (
              <div className={styles.profile__empty}><Wrench size={32} /><p>Du har inga aktiva tjänster ännu.</p><button className="btn btn-primary" onClick={() => router.push('/create-service')}>Skapa din första tjänst</button></div>
            ) : (
              <div className={styles.profile__list}>
                {services.map(s => (
                  <div key={s.id} className={styles.service_card_new}>
                    {/* Icon circle */}
                    <div className={styles.service_card_new__icon}>
                      <Wrench size={18} />
                    </div>

                    {/* Main info – clickable */}
                    <Link href={`/service/${s.id}`} className={styles.service_card_new__info}>
                      <strong className={styles.service_card_new__title}>{s.title}</strong>
                      <div className={styles.service_card_new__meta}>
                        <span className={styles.service_card_new__meta_item}>
                          <Tag size={12} /> {s.subcategory}
                        </span>
                        <span className={styles.service_card_new__meta_item}>
                          {s.location === 'Online'
                            ? <><Globe size={12} /> Online</>
                            : <><MapPin size={12} /> {s.location}</>}
                        </span>
                      </div>
                    </Link>

                    {/* Price + actions */}
                    <div className={styles.service_card_new__right}>
                      <div className={styles.service_card_new__price_block}>
                        <strong className={styles.service_card_new__price}>
                          {s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}
                        </strong>
                        <span className={styles.service_card_new__price_type}>
                          {s.price_type === 'timpris' ? 'per timme'
                            : s.price_type === 'fastpris' ? 'fast pris'
                            : 'på förfrågan'}
                        </span>
                      </div>

                      <div className={styles.service_card_new__divider} />

                      <div className={styles.service_card_new__actions}>
                        <button
                          className={styles.service_card_new__edit_btn}
                          onClick={() => router.push(`/create-service?edit=${s.id}`)}
                          title="Redigera"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className={styles.service_card_new__delete_btn}
                          title="Ta bort"
                          onClick={async () => {
                            if (!confirm('Är du säker på att du vill ta bort denna tjänst?')) return
                            await supabase.from('services').delete().eq('id', s.id)
                            setServices(prev => prev.filter(x => x.id !== s.id))
                          }}
                        >
                          <Trash2 size={15} />
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
        {activeSection === 'inkomna-bestallningar' && (() => {
          const filteredIncoming = incomingOrders.filter(order => {
            const raw = order as Order & { service_id?: string; request_id?: string }
            if (incomingTypeFilter !== 'all') {
              if (incomingTypeFilter === 'services' && !raw.service_id) return false
              if (incomingTypeFilter === 'requests' && !raw.request_id) return false
            }
            if (incomingStatusFilter === 'action') return order.status === 'pending'
            if (incomingStatusFilter === 'active') return order.status === 'accepted' && order.project_status !== 'completed'
            if (incomingStatusFilter === 'done') return order.project_status === 'completed' || order.status === 'rejected' || (order.status as string) === 'cancelled'
            return true
          })

          const typePills: { key: typeof incomingTypeFilter; label: string }[] = [
            { key: 'all', label: 'Alla' },
            { key: 'services', label: 'Tjänster' },
            { key: 'requests', label: 'Förfrågningar' },
          ]
          const statusPills: { key: typeof incomingStatusFilter; label: string }[] = [
            { key: 'all', label: 'Alla' },
            { key: 'action', label: 'Kräver handling' },
            { key: 'active', label: 'Aktiva' },
            { key: 'done', label: 'Avslutade' },
          ]

          return (
            <div className={styles.profile__section}>
              <h1 className={styles.profile__section_title}>Inkomna beställningar</h1>

              <div className={styles.filter_bar}>
                {typePills.map(p => (
                  <button key={p.key} type="button"
                    className={`${styles.filter_pill} ${incomingTypeFilter === p.key ? styles['filter_pill--active'] : ''}`}
                    onClick={() => setIncomingTypeFilter(p.key)}>{p.label}</button>
                ))}
              </div>
              <div className={styles.filter_bar}>
                {statusPills.map(p => (
                  <button key={p.key} type="button"
                    className={`${styles.filter_pill} ${incomingStatusFilter === p.key ? styles['filter_pill--active'] : ''}`}
                    onClick={() => setIncomingStatusFilter(p.key)}>{p.label}</button>
                ))}
              </div>

              {incomingOrders.length === 0 ? (
                <div className={styles.profile__empty}><Inbox size={32} /><p>Inga beställningar ännu.</p></div>
              ) : filteredIncoming.length === 0 ? (
                <div className={styles.profile__empty}><p>Inga beställningar matchar valt filter.</p></div>
              ) : (() => {
                const isDoneIncoming = (o: Order) => o.project_status === 'completed' || o.status === 'cancelled' || (o.project_status as string) === 'cancelled' || o.status === 'rejected'
                const activeIncoming = filteredIncoming.filter(o => !isDoneIncoming(o))
                const historyIncoming = filteredIncoming.filter(o => isDoneIncoming(o))

                const renderCard = (order: Order) => {
                    const raw = order as Order & { from_request?: boolean }
                    const ps = order.project_status
                    const isCancelled = (order.status as string) === 'cancelled' || (ps as string) === 'cancelled'
                    const isRequest = !!raw.from_request

                    // Left border color
                    const borderCls = isCancelled
                      ? styles['placed_card--cancelled']
                      : ps === 'completed' || order.status === 'rejected'
                      ? styles['placed_card--done']
                      : styles['placed_card--ongoing']

                    // Friendly status
                    const friendlyStatus =
                      isCancelled ? 'Avbokad' :
                      order.status === 'rejected' ? 'Nekad' :
                      ps === 'completed' ? 'Avslutat' :
                      ps === 'delivered' ? 'Levererat – inväntar godkännande' :
                      (ps === 'in_progress' || ps === 'almost_done') ? 'Pågår' :
                      'Ny beställning'

                    const statusCls =
                      isCancelled || order.status === 'rejected' ? styles['placed_card__status_text--done'] :
                      ps === 'completed' ? styles['placed_card__status_text--done'] :
                      ps === 'delivered' ? styles['placed_card__status_text--action'] :
                      styles['placed_card__status_text--ongoing']

                    return (
                      <div key={order.id} className={`${styles.placed_card} ${borderCls}`} onClick={() => router.push(`/order/${order.id}`)} style={{ cursor: 'pointer' }}>
                        {/* Header: badge + avatar + name / status */}
                        <div className={styles.placed_card__header}>
                          <div className={styles.placed_card__header_left}>
                            <span className={`${styles.placed_card__type_badge} ${isRequest ? styles['placed_card__type_badge--request'] : styles['placed_card__type_badge--service']}`}>
                              {isRequest ? 'Förfrågan' : 'Tjänst'}
                            </span>
                            <div className={styles.placed_card__avatar}>{order.buyer_name?.charAt(0).toUpperCase() || '?'}</div>
                            <span style={{ fontSize: 13, color: 'var(--color-gray)' }}>{order.buyer_name}</span>
                          </div>
                          <span className={`${styles.placed_card__status_text} ${statusCls}`}>{friendlyStatus}</span>
                        </div>
                        <div className={styles.placed_card__title}>{order.service_title}</div>

                        {/* CTAs */}
                        {(() => {
                          const rawOrder = order as Order & { conversation_id?: string }

                          const openChat = (e: React.MouseEvent) => {
                            e.stopPropagation()
                            router.push(rawOrder.conversation_id ? `/messages/${rawOrder.conversation_id}` : '/messages')
                          }

                          if (order.status === 'pending') return (
                            <div className={styles.placed_card__actions}>
                              <button type="button"
                                className={styles.placed_card__btn_primary}
                                style={{ background: '#22c55e' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#16a34a')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#22c55e')}
                                onClick={e => { e.stopPropagation(); router.push(`/order/${order.id}`) }}>
                                Acceptera uppdrag
                              </button>
                              <button type="button"
                                style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', border: '0.5px solid #F09595', background: '#FCEBEB', color: '#A32D2D', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'background 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F7C1C1')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#FCEBEB')}
                                onClick={async e => {
                                  e.stopPropagation()
                                  if (!confirm('Neka denna beställning?')) return
                                  await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
                                  setIncomingOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o))
                                }}>
                                Neka
                              </button>
                            </div>
                          )

                          if ((ps === 'in_progress' || ps === 'almost_done' || (!ps && order.status === 'accepted'))) return (
                            <div className={styles.placed_card__actions}>
                              <button type="button" className={styles.placed_card__btn_primary}
                                onClick={async e => {
                                  e.stopPropagation()
                                  if (!confirm('Markera uppdraget som levererat? Beställaren behöver godkänna.')) return
                                  await supabase.from('orders').update({ project_status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', order.id)
                                  setIncomingOrders(prev => prev.map(o => o.id === order.id ? { ...o, project_status: 'delivered' } : o))
                                }}>
                                Markera som levererat
                              </button>
                              <button type="button" className={styles.placed_card__btn_ghost} onClick={openChat}>
                                Öppna chatt
                              </button>
                            </div>
                          )

                          if (ps === 'delivered') return (
                            <div className={styles.placed_card__actions}>
                              <span style={{ fontSize: 13, color: 'var(--color-gray)', fontStyle: 'italic' }}>
                                Inväntar beställarens godkännande
                              </span>
                              <button type="button" className={styles.placed_card__btn_ghost} onClick={openChat}>
                                Öppna chatt
                              </button>
                            </div>
                          )

                          return null
                        })()}
                      </div>
                    )
                  }

                return (
                  <>
                    {activeIncoming.length === 0
                      ? <div className={styles.profile__empty}><p>Inga aktiva uppdrag.</p></div>
                      : <>
                          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray)', margin: '4px 0' }}>Aktiva uppdrag</h2>
                          <div className={styles.profile__list}>{activeIncoming.map(renderCard)}</div>
                        </>
                    }
                    {historyIncoming.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowIncomingHistory(h => !h)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-gray)', fontFamily: 'var(--font-body)', padding: '4px 0' }}
                        >
                          <span style={{ fontSize: 11 }}>{showIncomingHistory ? '▲' : '▼'}</span>
                          Historik ({historyIncoming.length} avslutade)
                        </button>
                        {showIncomingHistory && (
                          <div className={styles.profile__list} style={{ marginTop: 8 }}>
                            {historyIncoming.map(renderCard)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )
        })()}

        {/* PLACERADE BESTÄLLNINGAR */}
        {activeSection === 'placerade-bestallningar' && (() => {
          const filteredPlaced = placedOrders.filter(order => {
            // Type filter – uses service_id / request_id from raw select('*') data
            if (placedTypeFilter !== 'all') {
              const o = order as PlacedOrder & { service_id?: string; request_id?: string }
              if (placedTypeFilter === 'services' && !o.service_id) return false
              if (placedTypeFilter === 'requests' && !o.request_id) return false
            }
            // Status filter
            if (placedStatusFilter === 'active')
              return order.status === 'accepted' && order.project_status !== 'completed'
            if (placedStatusFilter === 'action')
              return order.project_status === 'delivered'
            if (placedStatusFilter === 'completed')
              return order.project_status === 'completed' || order.status === 'rejected'
            return true
          })

          const typePills: { key: typeof placedTypeFilter; label: string }[] = [
            { key: 'all', label: 'Alla' },
            { key: 'services', label: 'Tjänster' },
            { key: 'requests', label: 'Förfrågningar' },
          ]
          const statusPills: { key: typeof placedStatusFilter; label: string }[] = [
            { key: 'all', label: 'Alla' },
            { key: 'active', label: 'Aktiva' },
            { key: 'action', label: 'Kräver handling' },
            { key: 'completed', label: 'Avslutade' },
          ]

          return (
            <div className={styles.profile__section}>
              <h1 className={styles.profile__section_title}>Placerade beställningar</h1>

              {/* Type filter */}
              <div className={styles.filter_bar}>
                {typePills.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    className={`${styles.filter_pill} ${placedTypeFilter === p.key ? styles['filter_pill--active'] : ''}`}
                    onClick={() => setPlacedTypeFilter(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className={styles.filter_bar}>
                {statusPills.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    className={`${styles.filter_pill} ${placedStatusFilter === p.key ? styles['filter_pill--active'] : ''}`}
                    onClick={() => setPlacedStatusFilter(p.key)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {placedOrders.length === 0 ? (
                <div className={styles.profile__empty}><Send size={32} /><p>Du har inte beställt några tjänster ännu.</p><button className="btn btn-primary" onClick={() => router.push('/services')}>Utforska tjänster</button></div>
              ) : filteredPlaced.length === 0 ? (
                <div className={styles.profile__empty}><p>Inga beställningar matchar valt filter.</p></div>
              ) : (() => {
                const isDone = (o: PlacedOrder) => o.project_status === 'completed' || o.project_status === 'cancelled' || o.status === 'cancelled' || o.status === 'rejected'
                const activeList = filteredPlaced.filter(o => !isDone(o))
                const historyList = filteredPlaced.filter(o => isDone(o))

                // Shared card renderer used for both active and history lists
                const renderPlacedCard = (order: PlacedOrder) => {
                  const raw = order as PlacedOrder & { service_id?: string; request_id?: string; conversation_id?: string; review_id?: string }
                  const isService = !!raw.service_id    // service_id present → Tjänst
                  // request_id present (or no service_id) → Förfrågan
                  const ps = order.project_status
                  const borderCls = (ps === 'cancelled' || order.status === 'cancelled') ? styles['placed_card--cancelled'] : ps === 'delivered' ? styles['placed_card--action'] : ps === 'completed' || order.status === 'rejected' ? styles['placed_card--done'] : styles['placed_card--ongoing']
                  const friendlyStatus = (ps === 'cancelled' || order.status === 'cancelled') ? 'Avbokad' : order.status === 'rejected' ? 'Nekad' : ps === 'completed' ? 'Avslutat' : ps === 'delivered' ? 'Inväntar godkännande' : order.status === 'accepted' ? 'Pågår' : 'Väntar på utföraren'
                  const statusCls = (ps === 'cancelled' || order.status === 'cancelled') ? styles['placed_card__status_text--cancelled'] : ps === 'delivered' ? styles['placed_card__status_text--action'] : ps === 'completed' || order.status === 'rejected' ? styles['placed_card__status_text--done'] : styles['placed_card__status_text--ongoing']
                  const stepKeys = ['pending', 'in_progress', 'delivered', 'completed']
                  const stepLabels = ['Beställd', 'Pågår', 'Levererat', 'Avslutat']
                  const currentStep = ps === 'completed' ? 3 : ps === 'delivered' ? 2 : (ps === 'in_progress' || ps === 'almost_done') ? 1 : order.status === 'accepted' ? 1 : 0
                  const openChat = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); router.push(raw.conversation_id ? `/messages/${raw.conversation_id}` : '/messages') }
                  const cancelOrder = async (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (!confirm('Avboka beställningen?')) return; await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id); setPlacedOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o)) }

                  return (
                    <div key={order.id} className={`${styles.placed_card} ${borderCls}`} onClick={() => router.push(`/my-order/${order.id}`)} style={{ cursor: 'pointer' }}>
                      {/* Header: badge + avatar + name (left) / status (right) */}
                      <div className={styles.placed_card__header}>
                        <div className={styles.placed_card__header_left}>
                          <span className={`${styles.placed_card__type_badge} ${isService ? styles['placed_card__type_badge--service'] : styles['placed_card__type_badge--request']}`}>{isService ? 'Tjänst' : 'Förfrågan'}</span>
                          <div className={styles.placed_card__avatar}>{order.seller_name?.charAt(0).toUpperCase() || '?'}</div>
                          <span style={{ fontSize: 13, color: 'var(--color-gray)' }}>{order.seller_name}</span>
                        </div>
                        <span className={`${styles.placed_card__status_text} ${statusCls}`}>{friendlyStatus}</span>
                      </div>
                      <div className={styles.placed_card__title}>{order.service_title}</div>
                      {/* Minimal progress bar with step text */}
                      <div className={styles.placed_card__progress}>
                        <div className={styles.placed_card__steps}>
                          {stepKeys.map((_, i) => {
                            const done = i < currentStep
                            const current = i === currentStep
                            const cls = done ? styles['placed_card__step--done'] : current ? styles['placed_card__step--current'] : ''
                            return (
                              <div key={i} className={`${styles.placed_card__step} ${cls}`}>
                                <div className={styles.placed_card__dot} />
                              </div>
                            )
                          })}
                        </div>
                        <span className={styles.placed_card__progress_text}>
                          Steg {currentStep + 1} av 4 – {stepLabels[currentStep]}
                        </span>
                      </div>
                      {(() => {
                        if (order.status === 'pending') return <div className={styles.placed_card__actions}><button type="button" className={styles.placed_card__btn_ghost} onClick={openChat}>Öppna chatt</button><button type="button" className={styles.placed_card__btn_ghost} onClick={cancelOrder}>Avboka</button></div>
                        if (ps === 'delivered') return <div className={styles.placed_card__actions}><Link href={`/my-order/${order.id}`} className={styles.placed_card__btn_primary} onClick={e => e.stopPropagation()}>Granska & godkänn</Link><button type="button" className={styles.placed_card__btn_ghost} onClick={openChat}>Öppna chatt</button><Link href={`/my-order/${order.id}?problem=1`} className={styles.placed_card__btn_ghost} onClick={e => e.stopPropagation()}>Rapportera problem</Link></div>
                        if (order.status === 'accepted' && ps !== 'completed' && ps !== 'delivered') return <div className={styles.placed_card__actions}><button type="button" className={styles.placed_card__btn_ghost} onClick={openChat}>Öppna chatt</button><button type="button" className={styles.placed_card__btn_ghost} onClick={e => { e.stopPropagation(); router.push(`/my-order/${order.id}`) }}>Visa detaljer</button></div>
                        if (ps === 'completed') return reviewedOrderIds.has(order.id)
                          ? <div className={styles.placed_card__actions} style={{ color: '#1a7a4a', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> Du har lämnat en recension!</div>
                          : <div className={styles.placed_card__actions}><Link href={`/my-order/${order.id}?action=review`} className={styles.placed_card__btn_primary} onClick={e => e.stopPropagation()}>Lämna recension</Link></div>
                        return null
                      })()}
                    </div>
                  )
                }

                return (
                  <>
                    {/* Aktiva beställningar */}
                    {activeList.length === 0
                      ? <div className={styles.profile__empty}><p>Inga aktiva beställningar.</p></div>
                      : <>
                          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray)', margin: '4px 0' }}>Aktiva beställningar</h2>
                          <div className={styles.profile__list}>{activeList.map(renderPlacedCard)}</div>
                        </>
                    }

                    {/* Historik (hopfällbar) */}
                    {historyList.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => setShowHistory(h => !h)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-gray)', fontFamily: 'var(--font-body)', padding: '4px 0' }}
                        >
                          <span style={{ fontSize: 11 }}>{showHistory ? '▲' : '▼'}</span>
                          Historik ({historyList.length} avslutade)
                        </button>
                        {showHistory && (
                          <div className={styles.profile__list} style={{ marginTop: 8 }}>
                            {historyList.map(renderPlacedCard)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )
        })()}

        {/* MINA FÖRFRÅGNINGAR */}
        {activeSection === 'mina-forfragningar' && (
          <div className={styles.profile__section}>
            <div className={styles.profile__section_header}>
              <h1 className={styles.profile__section_title}>Mina förfrågningar</h1>
              <button className="btn btn-orange" onClick={() => router.push('/create-request')}>+ Ny förfrågan</button>
            </div>
            {myRequests.length === 0 ? (
              <div className={styles.profile__empty}><Users size={32} /><p>Du har inga förfrågningar ännu.</p><button className="btn btn-orange" onClick={() => router.push('/create-request')}>Skapa en förfrågan</button></div>
            ) : (
              <div className={styles.profile__list}>
                {myRequests.map(r => (
                  <div key={r.id} className={styles.request_card_new}>
                    {/* Icon circle */}
                    <div className={styles.request_card_new__icon}>
                      <ClipboardList size={18} />
                    </div>

                    {/* Main info – clickable */}
                    <Link href={`/request/${r.id}`} className={styles.request_card_new__info}>
                      <strong className={styles.request_card_new__title}>{r.title}</strong>
                      <div className={styles.request_card_new__meta}>
                        <span className={styles.request_card_new__meta_item}>
                          <Tag size={12} /> {r.subcategory}
                        </span>
                        <span className={styles.request_card_new__meta_item}>
                          {r.location === 'Online'
                            ? <><Globe size={12} /> Online</>
                            : <><MapPin size={12} /> {r.location}</>}
                        </span>
                      </div>
                    </Link>

                    {/* Budget + status + actions */}
                    <div className={styles.request_card_new__right}>
                      <div className={styles.request_card_new__price_block}>
                        <strong className={styles.request_card_new__price}>
                          {r.budget_type === 'prisforslag' ? 'Prisförslag' : `${r.budget} kr`}
                        </strong>
                        {r.status === 'assigned'
                          ? <span className={`${styles.profile__item_tag} ${styles['item_tag--accepted']}`}>Tillsatt</span>
                          : <span className={`${styles.profile__item_tag} ${styles['item_tag--completed']}`}>Öppen</span>
                        }
                      </div>

                      <div className={styles.request_card_new__divider} />

                      <div className={styles.request_card_new__actions}>
                        <button
                          className={styles.request_card_new__edit_btn}
                          onClick={() => router.push(`/create-request?edit=${r.id}`)}
                          title="Redigera"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className={styles.request_card_new__delete_btn}
                          title="Ta bort"
                          onClick={async () => {
                            if (!confirm('Är du säker på att du vill ta bort denna förfrågan?')) return
                            await supabase.from('requests').delete().eq('id', r.id)
                            setMyRequests(prev => prev.filter(x => x.id !== r.id))
                          }}
                        >
                          <Trash2 size={15} />
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
            <Intresseanmalningar userId={user.id} />
          </div>
        )}

        {/* MINA BEVAKNINGAR */}
        {activeSection === 'mina-bevakningar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Mina bevakningar</h1>
            <div className={`${styles.profile__block} card`}>
              <div className={styles.profile__block_header}>
                <div className={styles.profile__block_title}><Bell size={18} /><h2>Bevakade kategorier</h2></div>
              </div>
              {subscriptions.length === 0 ? (
                <div className={styles.profile__block_empty}>
                  <p>Du bevakar inga kategorier ännu.</p>
                  <button className="btn btn-primary" onClick={() => router.push('/requests')}>Gå till förfrågningar</button>
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
                  <Link href={`/request/${r.id}`} key={r.id} className={`${styles.profile__item} card`}>
                    <div className={styles.profile__item_icon}><Users size={18} /></div>
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

        {/* KARRIÄR */}
        {activeSection === 'karriar' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={22} /> Min karriär</h1>
            <p className={styles.karriar_subtitle}>Din utveckling som Svippare – statistik, milstolpar och utförda uppdrag</p>

            {/* Stats */}
            <div className={styles.profile__stats} style={{ marginBottom: '24px' }}>
              <div className={`${styles.karriar_stat_card} ${styles['karriar_stat_card--blue']}`}>
                <div className={`${styles.karriar_stat_icon} ${styles['karriar_stat_icon--blue']}`}><CheckCircle size={16} /></div>
                <div className={styles.karriar_stat_info}><strong>{karriarOrders.length}</strong><span>Utförda uppdrag</span></div>
              </div>
              <div className={`${styles.karriar_stat_card} ${styles['karriar_stat_card--coral']}`}>
                <div className={`${styles.karriar_stat_icon} ${styles['karriar_stat_icon--coral']}`}><Users size={16} /></div>
                <div className={styles.karriar_stat_info}><strong>{new Set(karriarOrders.map(o => o.buyer_name)).size}</strong><span>Nöjda kunder</span></div>
              </div>
              <div className={`${styles.karriar_stat_card} ${styles['karriar_stat_card--amber']}`}>
                <div className={`${styles.karriar_stat_icon} ${styles['karriar_stat_icon--amber']}`}><Star size={16} /></div>
                <div className={styles.karriar_stat_info}>
                  <strong>{karriarReviews.length > 0 ? (karriarReviews.reduce((sum, r) => sum + r.rating, 0) / karriarReviews.length).toFixed(1) : '–'}</strong>
                  <span>Snittbetyg</span>
                </div>
              </div>
              <div className={`${styles.karriar_stat_card} ${styles['karriar_stat_card--green']}`}>
                <div className={`${styles.karriar_stat_icon} ${styles['karriar_stat_icon--green']}`}><MessageCircle size={16} /></div>
                <div className={styles.karriar_stat_info}><strong>{karriarReviews.length}</strong><span>Recensioner</span></div>
              </div>
            </div>

            {/* Milstolpar */}
            <div className={`${styles.profile__block} card`} style={{ marginBottom: '24px' }}>
              <div className={styles.profile__block_header}>
                <div className={styles.profile__block_title}><span>🎯</span><h2>Milstolpar</h2></div>
              </div>
              {(() => {
                const avgRating = karriarReviews.length > 0
                  ? karriarReviews.reduce((sum, r) => sum + r.rating, 0) / karriarReviews.length : 0
                const milestones = [
                  { icon: '🥉', label: 'Första uppdraget', desc: 'Slutfört 1 uppdrag',    target: 1 },
                  { icon: '🥈', label: 'På gång!',         desc: 'Slutfört 5 uppdrag',    target: 5 },
                  { icon: '🥇', label: 'Proffs',           desc: 'Slutfört 10 uppdrag',   target: 10 },
                  { icon: '💎', label: 'Veteran',          desc: 'Slutfört 25 uppdrag',   target: 25 },
                  { icon: <Trophy size={32} />, label: 'Legend', desc: 'Slutfört 50 uppdrag', target: 50 },
                  { icon: <Star size={32} />, label: 'Första stjärnan', desc: 'Fått 1 recension', target: 1, type: 'reviews' as const },
                  { icon: '🌟', label: 'Högt betyg', desc: 'Snittbetyg över 4.5', target: 4.5, type: 'rating' as const },
                ]
                const isAchieved = (m: typeof milestones[0]) =>
                  m.type === 'reviews' ? karriarReviews.length >= m.target :
                  m.type === 'rating'  ? avgRating >= m.target :
                  karriarOrders.length >= m.target
                const getRemaining = (m: typeof milestones[0]) => {
                  if (m.type === 'reviews') return Math.max(0, m.target - karriarReviews.length)
                  if (m.type === 'rating')  return null
                  return Math.max(0, m.target - karriarOrders.length)
                }
                const firstUnachievedIdx = milestones.findIndex(m => !isAchieved(m))

                return (
                  <div className={styles.milestone_grid}>
                    {milestones.map((milestone, idx) => {
                      const achieved = isAchieved(milestone)
                      const isNext = idx === firstUnachievedIdx
                      const cardCls = achieved ? styles['milestone_card--achieved'] : isNext ? styles['milestone_card--next'] : styles['milestone_card--locked']
                      const remaining = getRemaining(milestone)

                      return (
                        <div key={milestone.label} className={`${styles.milestone_card} ${cardCls}`}>
                          <span style={{ fontSize: '32px', filter: achieved || isNext ? 'none' : 'grayscale(100%)' }}>
                            {milestone.icon}
                          </span>
                          <strong style={{ fontSize: '13px', color: 'var(--color-dark)' }}>{milestone.label}</strong>
                          <span style={{ fontSize: '12px', color: 'var(--color-gray)' }}>{milestone.desc}</span>
                          {achieved && (
                            <span className={`${styles.milestone_badge} ${styles['milestone_badge--achieved']}`}>
                              <CheckCircle size={11} /> Uppnådd
                            </span>
                          )}
                          {!achieved && isNext && remaining !== null && (
                            <span className={`${styles.milestone_badge} ${styles['milestone_badge--next']}`}>
                              {remaining} kvar
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Senaste uppdrag */}
            <div className={`${styles.profile__block} card`}>
              <div className={styles.profile__block_header}>
                <div className={styles.profile__block_title}><ClipboardList size={18} /><h2>Utförda uppdrag</h2></div>
              </div>
              {karriarOrders.length === 0 ? (
                <div className={styles.profile__block_empty}>
                  <p>Inga utförda uppdrag ännu. Ditt första väntar! 🚀</p>
                </div>
              ) : (
                <div className={styles.profile__block_list}>
                  {karriarOrders.map(order => (
                    <Link href={`/order/${order.id}`} key={order.id} className={`${styles.profile__block_item} ${styles.karriar_job_row}`}>
                      <div className={styles.profile__block_item_info}>
                        <strong>{order.service_title}</strong>
                        <span>{order.buyer_name} · {new Date(order.created_at).toLocaleDateString('sv-SE')}</span>
                      </div>
                      <span className={styles.karriar_job_badge}><CheckCircle size={12} /> Utfört</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}


        {/* RECENSIONER */}
        {activeSection === 'recensioner' && (
          <div className={styles.profile__section}>
            <h1 className={styles.profile__section_title}>Recensioner & betyg</h1>
            {profileReviews.length === 0 ? (
              <div className={styles.profile__empty}><Star size={32} /><p>Inga recensioner ännu. De visas här när du fått dem.</p></div>
            ) : (
              <div className={styles.profile__list}>
                {profileReviews.map(r => (
                  <div key={r.id} className={`${styles.profile__item} card`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {renderStars(r.rating, 14)}
                        <strong style={{ fontSize: 14, marginLeft: 4 }}>{r.rating}/5</strong>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--color-gray)' }}>
                        {new Date(r.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    {r.service_title && <span style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>{r.service_title}</span>}
                    <p style={{ fontSize: 14, color: 'var(--color-dark)', margin: 0, lineHeight: 1.6 }}>{r.comment || '(ingen kommentar)'}</p>
                    <span style={{ fontSize: 13, color: 'var(--color-gray)' }}>— {r.reviewer_name}</span>
                  </div>
                ))}
              </div>
            )}
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
                    {avatarUploading ? <Clock size={16} /> : '📷'}
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
              {success && <div className={styles.profile__success} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} /> Profilen uppdaterades!</div>}
              <div className={styles.profile__settings_actions}>
                {editing ? (
                  <>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Sparar...' : 'Spara ändringar'}</button>
                    <button className="btn btn-outline" onClick={() => setEditing(false)}>Avbryt</button>
                  </>
                ) : (
                  <button className="btn btn-outline" onClick={() => setEditing(true)}><Pencil size={16} /> Redigera profil</button>
                )}
              </div>
            </div>

            {canCreateService && (
              <div className={`${styles.profile__settings} card`}>
                <div className={styles.profile__settings_fields}>
                  <h2 className={styles.profile__section_title} style={{ fontSize: '20px' }}>Certifikat</h2>
                  <p className={styles.profile__hint}>Ladda upp certifikat (PDF) kopplade till dina tjänstekategorier. De visas på din publika profil och på dina tjänstesidor.</p>

                  {certificates.length > 0 && (
                    <div className={styles.cert__list}>
                      {certificates.map(cert => {
                        const cat = categories.find(c => c.id === cert.category_id)
                        return (
                          <div key={cert.id} className={styles.cert__item}>
                            <div className={styles.cert__info}>
                              <strong>{cert.name}</strong>
                              <span>{cat?.label} · {cert.subcategory}</span>
                            </div>
                            <div className={styles.cert__actions}>
                              <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>Visa PDF</a>
                              <button className={`btn btn-outline ${styles.profile__delete_btn}`} onClick={() => handleCertDelete(cert.id, cert.file_url)}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className={styles.cert__form}>
                    <div className={styles.profile__field}>
                      <label className={styles.profile__label}>Namn på certifikat</label>
                      <input className={styles.profile__input} value={certName} onChange={e => setCertName(e.target.value)} placeholder="T.ex. Google Analytics Certified" />
                    </div>
                    <div className={styles.profile__field}>
                      <label className={styles.profile__label}>Kategori</label>
                      <select className={styles.profile__input} value={certCategoryId} onChange={e => { setCertCategoryId(e.target.value); setCertSubcategory('') }}>
                        <option value="">Välj kategori</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                      </select>
                    </div>
                    {certCategoryId && (
                      <div className={styles.profile__field}>
                        <label className={styles.profile__label}>Underkategori</label>
                        <select className={styles.profile__input} value={certSubcategory} onChange={e => setCertSubcategory(e.target.value)}>
                          <option value="">Välj underkategori</option>
                          {categories.find(c => c.id === certCategoryId)?.subcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className={styles.profile__field}>
                      <label className={styles.profile__label}>PDF-fil (max 5MB)</label>
                      <input ref={certFileRef} type="file" accept="application/pdf" onChange={e => setCertFile(e.target.files?.[0] ?? null)} className={styles.profile__input} />
                    </div>
                    <button className="btn btn-primary" onClick={handleCertUpload} disabled={certUploading || !certName || !certCategoryId || !certSubcategory || !certFile}>
                      {certUploading ? 'Laddar upp...' : 'Ladda upp certifikat'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                {companySuccess && <div className={styles.profile__success} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} /> Företagsprofilen uppdaterades!</div>}
                <div className={styles.profile__settings_actions}>
                  {companyEditing ? (
                    <>
                      <button className="btn btn-primary" onClick={handleCompanySave} disabled={companySaving}>{companySaving ? 'Sparar...' : 'Spara företagsprofil'}</button>
                      <button className="btn btn-outline" onClick={() => setCompanyEditing(false)}>Avbryt</button>
                    </>
                  ) : (
                    <button className="btn btn-outline" onClick={() => setCompanyEditing(true)}><Pencil size={16} /> Redigera företagsprofil</button>
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