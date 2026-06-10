'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './admin.module.scss'
import { Users, Wrench, ClipboardList, Package, Clock, CheckCircle, XCircle, BarChart2, LogOut, Trash2, Megaphone } from 'lucide-react'

type Section = 'overview' | 'applications' | 'services' | 'users' | 'orders' | 'ads'

type AdRow = {
  id: string
  company_name: string
  logo_url: string
  headline: string
  description: string
  cta_label: string
  cta_url: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  click_count: number
  impression_count: number
  created_at: string
}

const EMPTY_AD_FORM = {
  company_name: '', logo_url: '', headline: '', description: '',
  cta_label: 'Läs mer', cta_url: '', is_active: false,
  starts_at: '', ends_at: '',
}

type Stats = {
  users: number
  services: number
  requests: number
  orders: number
  pending: number
}

type Application = {
  id: string
  user_id: string
  status: string
  description: string
  created_at: string
  user_name: string
  user_email: string
}

type UserRow = {
  id: string
  name: string
  email: string
  account_type: string
  role: string
  created_at: string
}

type OrderRow = {
  id: string
  service_title: string
  buyer_name: string
  seller_name: string
  status: string
  project_status: string
  created_at: string
}

type ServiceRow = {
  id: string
  title: string
  user_name: string
  subcategory: string
  created_at: string
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [section, setSection] = useState<Section>('overview')
  const [stats, setStats] = useState<Stats>({ users: 0, services: 0, requests: 0, orders: 0, pending: 0 })
  const [applications, setApplications] = useState<Application[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [services, setServices] = useState<ServiceRow[]>([])
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [dataLoading, setDataLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void } | null>(null)
  const [ads, setAds] = useState<AdRow[]>([])
  const [showAdForm, setShowAdForm] = useState(false)
  const [editingAdId, setEditingAdId] = useState<string | null>(null)
  const [adForm, setAdForm] = useState(EMPTY_AD_FORM)
  const [adLogoUploading, setAdLogoUploading] = useState(false)

  // Auth + role check
  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }
    const checkRole = async () => {
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (data?.role !== 'admin') { router.replace('/profile'); return }
      setAuthorized(true)
      loadAll()
    }
    checkRole()
  }, [user, authLoading])

  const loadAll = async () => {
    setDataLoading(true)
    const [usersRes, servicesRes, requestsRes, ordersRes, pendingRes, appsRes, recentUsersRes, recentOrdersRes, allServicesRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('services').select('id', { count: 'exact', head: true }),
      supabase.from('requests').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('svippare_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('svippare_profiles').select('id, user_id, status, description, created_at, users(name, email)').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('users').select('id, name, email, account_type, role, created_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('orders').select('id, service_title, buyer_name, seller_name, status, project_status, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('services').select('id, title, user_name, subcategory, created_at').order('created_at', { ascending: false }).limit(50),
    ])

    setStats({
      users: usersRes.count ?? 0,
      services: servicesRes.count ?? 0,
      requests: requestsRes.count ?? 0,
      orders: ordersRes.count ?? 0,
      pending: pendingRes.count ?? 0,
    })

    const apps = (appsRes.data ?? []).map((a: any) => ({
      id: a.id,
      user_id: a.user_id,
      status: a.status,
      description: a.description ?? '',
      created_at: a.created_at,
      user_name: a.users?.name ?? '–',
      user_email: a.users?.email ?? '–',
    }))
    setApplications(apps)
    setUsers(recentUsersRes.data ?? [])
    setOrders(recentOrdersRes.data ?? [])
    setServices(allServicesRes.data ?? [])
    setDataLoading(false)

    // Load ads separately (all rows, not filtered by RLS)
    const { data: adsData } = await supabase.from('ads').select('*').order('created_at', { ascending: false })
    setAds(adsData ?? [])
  }

  const handleApprove = async (app: Application) => {
    const { error } = await supabase.from('svippare_profiles').update({ status: 'approved' }).eq('id', app.id)
    if (error) { setFeedback(f => ({ ...f, [app.id]: 'Fel vid godkännande.' })); return }
    await supabase.from('users').update({ account_type: 'svippare' }).eq('id', app.user_id)
    setApplications(prev => prev.filter(a => a.id !== app.id))
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }))
    setFeedback(f => ({ ...f, [app.id]: '✓ Godkänd' }))

    fetch('/api/admin/notify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'approved', userId: app.user_id }),
    }).catch(err => console.error('Email notification error:', err))
  }

  const handleReject = async (app: Application) => {
    const { error } = await supabase.from('svippare_profiles').update({ status: 'rejected' }).eq('id', app.id)
    if (error) { setFeedback(f => ({ ...f, [app.id]: 'Fel vid nekande.' })); return }
    setApplications(prev => prev.filter(a => a.id !== app.id))
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }))
    setFeedback(f => ({ ...f, [app.id]: '✓ Nekad' }))

    fetch('/api/admin/notify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'rejected', userId: app.user_id }),
    }).catch(err => console.error('Email notification error:', err))
  }

  // TODO: For delete operations to work, add RLS policies in Supabase:
  // CREATE POLICY "Admin can delete services" ON services FOR DELETE USING (auth.jwt() ->> 'role' = 'admin' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
  // CREATE POLICY "Admin can delete users" ON users FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) { setConfirmModal(null); alert('Fel vid borttagning: ' + error.message); return }
    setServices(prev => prev.filter(s => s.id !== id))
    setStats(s => ({ ...s, services: Math.max(0, s.services - 1) }))
  }

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase.from('users').delete().eq('id', id)
    if (error) { setConfirmModal(null); alert('Fel vid borttagning: ' + error.message); return }
    setUsers(prev => prev.filter(u => u.id !== id))
    setStats(s => ({ ...s, users: Math.max(0, s.users - 1) }))
  }

  const confirmDeleteService = (id: string) => setConfirmModal({
    open: true,
    title: 'Ta bort tjänst?',
    message: 'Detta går inte att ångra. Tjänsten tas bort permanent.',
    onConfirm: () => handleDeleteService(id),
  })

  const confirmDeleteUser = (id: string) => setConfirmModal({
    open: true,
    title: 'Ta bort användare?',
    message: 'Detta raderar profilen ur databasen. Auth-kontot måste tas bort manuellt i Supabase Dashboard. Går inte att ångra.',
    onConfirm: () => handleDeleteUser(id),
  })

  const handleLogoUpload = async (file: File) => {
    setAdLogoUploading(true)
    const ext = file.name.split('.').pop() ?? 'png'
    const path = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('ad-logos').upload(path, file, { upsert: true })
    if (error) { alert('Logo-uppladdning misslyckades: ' + error.message); setAdLogoUploading(false); return }
    const { data: urlData } = supabase.storage.from('ad-logos').getPublicUrl(path)
    setAdForm(f => ({ ...f, logo_url: urlData.publicUrl }))
    setAdLogoUploading(false)
  }

  const handleSaveAd = async () => {
    if (!adForm.company_name || !adForm.logo_url || !adForm.headline || !adForm.description || !adForm.cta_url) {
      alert('Fyll i alla obligatoriska fält (logo måste laddas upp)')
      return
    }
    const payload = {
      company_name: adForm.company_name,
      logo_url: adForm.logo_url,
      headline: adForm.headline.slice(0, 60),
      description: adForm.description.slice(0, 120),
      cta_label: (adForm.cta_label || 'Läs mer').slice(0, 20),
      cta_url: adForm.cta_url,
      is_active: adForm.is_active,
      starts_at: adForm.starts_at || null,
      ends_at: adForm.ends_at || null,
    }
    if (editingAdId) {
      const { error } = await supabase.from('ads').update(payload).eq('id', editingAdId)
      if (error) { alert('Fel: ' + error.message); return }
      setAds(prev => prev.map(a => a.id === editingAdId ? { ...a, ...payload } : a))
    } else {
      const { data, error } = await supabase.from('ads').insert(payload).select().single()
      if (error) { alert('Fel: ' + error.message); return }
      if (data) setAds(prev => [data as AdRow, ...prev])
    }
    setShowAdForm(false)
    setEditingAdId(null)
    setAdForm(EMPTY_AD_FORM)
  }

  const handleToggleAd = async (ad: AdRow) => {
    const { error } = await supabase.from('ads').update({ is_active: !ad.is_active }).eq('id', ad.id)
    if (error) { alert('Fel: ' + error.message); return }
    setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: !ad.is_active } : a))
  }

  const handleEditAd = (ad: AdRow) => {
    setAdForm({
      company_name: ad.company_name,
      logo_url: ad.logo_url,
      headline: ad.headline,
      description: ad.description,
      cta_label: ad.cta_label,
      cta_url: ad.cta_url,
      is_active: ad.is_active,
      starts_at: ad.starts_at ? ad.starts_at.slice(0, 10) : '',
      ends_at: ad.ends_at ? ad.ends_at.slice(0, 10) : '',
    })
    setEditingAdId(ad.id)
    setShowAdForm(true)
  }

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })

  if (authLoading || !authorized) {
    return <div className={styles.loading}>Laddar...</div>
  }

  return (
    <div className={styles.admin}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebar__brand}>Admin</div>
        <nav className={styles.sidebar__nav}>
          {([
            { id: 'overview', label: 'Översikt', icon: <BarChart2 size={16} /> },
            { id: 'applications', label: 'Ansökningar', icon: <Clock size={16} />, badge: stats.pending || undefined },
            { id: 'services', label: 'Tjänster', icon: <Wrench size={16} /> },
            { id: 'users', label: 'Användare', icon: <Users size={16} /> },
            { id: 'orders', label: 'Beställningar', icon: <Package size={16} /> },
            { id: 'ads', label: 'Annonser', icon: <Megaphone size={16} /> },
          ] as { id: Section; label: string; icon: React.ReactNode; badge?: number }[]).map(item => (
            <button
              key={item.id}
              className={`${styles.sidebar__item} ${section === item.id ? styles['sidebar__item--active'] : ''}`}
              onClick={() => setSection(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? <span className={styles.sidebar__badge}>{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <button className={styles.sidebar__signout} onClick={() => { supabase.auth.signOut(); router.push('/') }}>
          <LogOut size={16} /> Logga ut
        </button>
      </aside>

      {/* Main */}
      <main className={styles.main}>

        {/* OVERVIEW */}
        {section === 'overview' && (
          <div className={styles.section}>
            <h1 className={styles.section__title}>Översikt</h1>
            <div className={styles.stats}>
              {[
                { label: 'Användare', value: stats.users, icon: <Users size={20} />, color: 'blue' },
                { label: 'Tjänster', value: stats.services, icon: <Wrench size={20} />, color: 'green' },
                { label: 'Förfrågningar', value: stats.requests, icon: <ClipboardList size={20} />, color: 'orange' },
                { label: 'Beställningar', value: stats.orders, icon: <Package size={20} />, color: 'purple' },
                { label: 'Väntande ansökningar', value: stats.pending, icon: <Clock size={20} />, color: 'red' },
              ].map(stat => (
                <div key={stat.label} className={`${styles.stat_card} ${styles[`stat_card--${stat.color}`]}`}>
                  <div className={styles.stat_card__icon}>{stat.icon}</div>
                  <div className={styles.stat_card__info}>
                    <strong>{dataLoading ? '–' : stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* APPLICATIONS */}
        {section === 'applications' && (
          <div className={styles.section}>
            <h1 className={styles.section__title}>Svippare-ansökningar</h1>
            {dataLoading ? <p className={styles.empty}>Laddar...</p> : applications.length === 0 ? (
              <div className={styles.empty}>
                <CheckCircle size={32} />
                <p>Inga väntande ansökningar.</p>
              </div>
            ) : (
              <div className={styles.table_wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>E-post</th>
                      <th>Beskrivning</th>
                      <th>Datum</th>
                      <th>Åtgärd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id}>
                        <td><strong>{app.user_name}</strong></td>
                        <td>{app.user_email}</td>
                        <td className={styles.table__desc}>{app.description || '–'}</td>
                        <td>{fmt(app.created_at)}</td>
                        <td>
                          {feedback[app.id] ? (
                            <span className={styles.feedback}>{feedback[app.id]}</span>
                          ) : (
                            <div className={styles.action_btns}>
                              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => handleApprove(app)}>
                                <CheckCircle size={14} /> Godkänn
                              </button>
                              <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '13px', color: 'var(--color-orange)', borderColor: 'var(--color-orange)' }} onClick={() => handleReject(app)}>
                                <XCircle size={14} /> Neka
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SERVICES */}
        {section === 'services' && (
          <div className={styles.section}>
            <h1 className={styles.section__title}>Alla tjänster</h1>
            {dataLoading ? <p className={styles.empty}>Laddar...</p> : services.length === 0 ? (
              <div className={styles.empty}><p>Inga tjänster hittades.</p></div>
            ) : (
              <div className={styles.table_wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Titel</th>
                      <th>Utförare</th>
                      <th>Underkategori</th>
                      <th>Skapad</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.title}</strong></td>
                        <td>{s.user_name}</td>
                        <td><span className={styles.badge}>{s.subcategory}</span></td>
                        <td>{fmt(s.created_at)}</td>
                        <td>
                          <button className={styles.btn_danger} onClick={() => confirmDeleteService(s.id)} title="Ta bort tjänst">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {section === 'users' && (
          <div className={styles.section}>
            <h1 className={styles.section__title}>Användare</h1>
            <p className={styles.section__note}>OBS: Att ta bort en användare raderar endast profilen ur databasen. Ta bort auth-kontot manuellt i Supabase Dashboard under Authentication → Users.</p>
            {dataLoading ? <p className={styles.empty}>Laddar...</p> : (
              <div className={styles.table_wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>E-post</th>
                      <th>Kontotyp</th>
                      <th>Roll</th>
                      <th>Registrerad</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.name || '–'}</strong></td>
                        <td>{u.email}</td>
                        <td><span className={styles.badge}>{u.account_type}</span></td>
                        <td><span className={`${styles.badge} ${u.role === 'admin' ? styles['badge--admin'] : ''}`}>{u.role || 'user'}</span></td>
                        <td>{fmt(u.created_at)}</td>
                        <td>
                          <button className={styles.btn_danger} onClick={() => confirmDeleteUser(u.id)} title="Ta bort användare">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {section === 'orders' && (
          <div className={styles.section}>
            <h1 className={styles.section__title}>Senaste beställningar</h1>
            {dataLoading ? <p className={styles.empty}>Laddar...</p> : (
              <div className={styles.table_wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tjänst</th>
                      <th>Köpare</th>
                      <th>Säljare</th>
                      <th>Status</th>
                      <th>Projektstatus</th>
                      <th>Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.service_title}</strong></td>
                        <td>{o.buyer_name}</td>
                        <td>{o.seller_name}</td>
                        <td><span className={`${styles.badge} ${styles[`badge--${o.status}`]}`}>{o.status}</span></td>
                        <td><span className={styles.badge}>{o.project_status || '–'}</span></td>
                        <td>{fmt(o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ANNONSER */}
        {section === 'ads' && (
          <div className={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h1 className={styles.section__title}>Annonser</h1>
              <button className="btn btn-primary" onClick={() => { setAdForm(EMPTY_AD_FORM); setEditingAdId(null); setShowAdForm(true) }}>
                + Ny annons
              </button>
            </div>

            {/* Form */}
            {showAdForm && (
              <div className={styles.section__note} style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editingAdId ? 'Redigera annons' : 'Ny annons'}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Företagsnamn *</label>
                    <input className="form-input" value={adForm.company_name} onChange={e => setAdForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Acme AB" />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Logo * {adLogoUploading && '(laddar upp...)'}</label>
                    {adForm.logo_url && <img src={adForm.logo_url} alt="" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, marginBottom: 4, display: 'block' }} />}
                    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Rubrik * (max 60)</label>
                    <input className="form-input" value={adForm.headline} onChange={e => setAdForm(f => ({ ...f, headline: e.target.value.slice(0, 60) }))} placeholder="Rubrik" maxLength={60} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Beskrivning * (max 120)</label>
                    <input className="form-input" value={adForm.description} onChange={e => setAdForm(f => ({ ...f, description: e.target.value.slice(0, 120) }))} placeholder="Kort beskrivning" maxLength={120} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>CTA-text (max 20)</label>
                    <input className="form-input" value={adForm.cta_label} onChange={e => setAdForm(f => ({ ...f, cta_label: e.target.value.slice(0, 20) }))} placeholder="Läs mer" maxLength={20} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>CTA-URL *</label>
                    <input className="form-input" value={adForm.cta_url} onChange={e => setAdForm(f => ({ ...f, cta_url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Startdatum</label>
                    <input type="date" className="form-input" value={adForm.starts_at} onChange={e => setAdForm(f => ({ ...f, starts_at: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Slutdatum</label>
                    <input type="date" className="form-input" value={adForm.ends_at} onChange={e => setAdForm(f => ({ ...f, ends_at: e.target.value }))} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 14, cursor: 'pointer' }}>
                  <input type="checkbox" checked={adForm.is_active} onChange={e => setAdForm(f => ({ ...f, is_active: e.target.checked }))} />
                  Aktiv (visas för besökare)
                </label>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-primary" onClick={handleSaveAd} disabled={adLogoUploading}>
                    {adLogoUploading ? 'Laddar upp logo...' : 'Spara annons'}
                  </button>
                  <button className="btn btn-outline" onClick={() => { setShowAdForm(false); setEditingAdId(null); setAdForm(EMPTY_AD_FORM) }}>
                    Avbryt
                  </button>
                </div>
              </div>
            )}

            {/* Table */}
            {ads.length === 0 ? (
              <div className={styles.empty}><Megaphone size={32} /><p>Inga annonser ännu.</p></div>
            ) : (
              <div className={styles.table_wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Företag</th>
                      <th>Rubrik</th>
                      <th>Status</th>
                      <th>Start</th>
                      <th>Slut</th>
                      <th>Klick</th>
                      <th>Visningar</th>
                      <th>Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ads.map(ad => (
                      <tr key={ad.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {ad.logo_url && <img src={ad.logo_url} alt="" style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 4 }} />}
                          {ad.company_name}
                        </td>
                        <td className={styles.table__desc}>{ad.headline}</td>
                        <td>
                          <span className={`${styles.badge} ${ad.is_active ? styles['badge--accepted'] : styles['badge--pending']}`}>
                            {ad.is_active ? 'Aktiv' : 'Pausad'}
                          </span>
                        </td>
                        <td>{ad.starts_at ? fmt(ad.starts_at) : '–'}</td>
                        <td>{ad.ends_at ? fmt(ad.ends_at) : '–'}</td>
                        <td>{ad.click_count}</td>
                        <td>{ad.impression_count}</td>
                        <td>
                          <div className={styles.action_btns}>
                            <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleEditAd(ad)}>
                              Redigera
                            </button>
                            <button className="btn btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleToggleAd(ad)}>
                              {ad.is_active ? 'Pausa' : 'Aktivera'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {confirmModal?.open && (
        <div className="modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{confirmModal.title}</h2>
            <p style={{ color: 'var(--color-gray)', marginBottom: '24px' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setConfirmModal(null)}>Avbryt</button>
              <button
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null) }}
              >
                Ta bort
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
