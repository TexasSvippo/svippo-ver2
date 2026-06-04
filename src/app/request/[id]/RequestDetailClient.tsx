'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useAuth from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import styles from './requestdetail.module.scss'
import { MapPin, CheckCircle, Users, MessageCircle, Shield, ClipboardList, Pencil, Trash2, Lock } from 'lucide-react'

type Request = {
  id: string
  title: string
  description: string
  category_id: string
  subcategory: string
  budget: number
  budget_type: string
  location: string
  user_name: string
  user_email: string
  user_id: string
  image_url: string
  deadline?: string
  created_at: string
  avatar_url?: string | null
}

type Props = {
  request: Request
}

export default function RequestDetailClient({ request }: Props) {
  const { user, accountType } = useAuth()
  const router = useRouter()
  const [showInterestForm, setShowInterestForm] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [message, setMessage] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string, email: string, phone: string } | null>(null)
  const [interestsCount, setInterestsCount] = useState(0)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', user.id)
        .single()
      if (data) setUserProfile(data)
    }
    fetchProfile()
  }, [user])

  // Kolla om inloggad användare redan anmält intresse för denna förfrågan
  useEffect(() => {
    if (!user || user.id === request.user_id) return
    supabase
      .from('interests')
      .select('id', { count: 'exact', head: true })
      .eq('request_id', request.id)
      .eq('svippar_id', user.id)
      .then(({ count }) => {
        if ((count ?? 0) > 0) setAlreadySubmitted(true)
      })
  }, [user, request.id, request.user_id])

  // Hämta antal intresseanmälningar (för ägarens varning vid borttagning)
  useEffect(() => {
    if (user?.id !== request.user_id) return
    const fetchInterests = async () => {
      const { count } = await supabase
        .from('interests')
        .select('id', { count: 'exact', head: true })
        .eq('request_id', request.id)
      setInterestsCount(count ?? 0)
    }
    fetchInterests()
  }, [user, request.id, request.user_id])

  const handleInterest = async () => {
    if (!user || !message) return
    setSaving(true)
    try {
      await supabase.from('interests').insert({
        request_id: request.id,
        request_title: request.title,
        request_owner_id: request.user_id,
        svippar_id: user.id,
        svippar_name: userProfile?.name || user.email,
        svippar_email: userProfile?.email || user.email,
        svippar_phone: userProfile?.phone || '',
        message,
        price: price ? Number(price) : null,
        created_at: new Date().toISOString(),
      })

      await supabase.from('notifications').insert({
        user_id: request.user_id,
        type: 'new_interest',
        actor_name: userProfile?.name || user.email,
        message: `${userProfile?.name || user.email} har visat intresse för din förfrågan "${request.title}"!`,
        action_url: `/intresseanmalningar`,
        read: false,
        dismissed: false,
        email_sent: false,
        created_at: new Date().toISOString(),
      })

      setSuccess(true)
      setShowInterestForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    const warningMsg = interestsCount > 0
      ? `Du har ${interestsCount} intresseanmälan(ar) på denna förfrågan. Är du säker på att du vill ta bort den?`
      : 'Är du säker på att du vill ta bort denna förfrågan?'

    if (!confirm(warningMsg)) return

    setDeleting(true)

    // Ta bort bild från Storage om det finns en
    // Ta bort bild från Storage om det finns en
    if (request.image_url) {
      const fileName = request.image_url.split('/').pop()
      if (fileName) {
        const { error } = await supabase.storage.from('request-images').remove([fileName])
      }
    }

    await supabase.from('requests').delete().eq('id', request.id)
    router.push('/profile')
  }

  const handleContact = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    if (user.id === request.user_id) return

    // Kolla om konversation redan finns
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('anchor_id', request.id)
      .eq('participant_1_id', user.id)
      .eq('participant_2_id', request.user_id)
      .limit(1)

    if (existing && existing.length > 0) {
      router.push(`/messages/${existing[0].id}`)
      return
    }

    // Kolla omvänt
    const { data: existingReverse } = await supabase
      .from('conversations')
      .select('id')
      .eq('anchor_id', request.id)
      .eq('participant_1_id', request.user_id)
      .eq('participant_2_id', user.id)
      .limit(1)

    if (existingReverse && existingReverse.length > 0) {
      router.push(`/messages/${existingReverse[0].id}`)
      return
    }

    // Skapa ny Typ A-konversation kopplad till förfrågan
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        type: 'inquiry',
        anchor_type: 'request',
        anchor_id: request.id,
        assignment_id: null,
        participant_1_id: user.id,
        participant_2_id: request.user_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (newConv) {
      router.push(`/messages/${newConv.id}`)
    }
  }

  const isOwner = user?.id === request.user_id

  return (
    <div className={styles.page}>

        {/* Brödsmulor */}
        <div className={styles.breadcrumb}>
          <Link href="/">Hem</Link>
          <span>·</span>
          <Link href="/requests">Förfrågningar</Link>
          <span>·</span>
          <span>{request.title}</span>
        </div>

        <div className={styles.layout}>

          {/* Vänster */}
          <div className={styles.main}>
            <div className={styles.badges}>
              <span className={`${styles.badge} ${styles.badge__orange}`}>{request.subcategory}</span>
              <span className={`${styles.badge} ${styles.badge__location}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {request.location}</span>
            </div>

            <h1 className={styles.title}>{request.title}</h1>

            {request.image_url && (
              <img
                src={request.image_url}
                alt={request.title}
                className={styles.request_image}
              />
            )}

            <div className={styles.section}>
              <h2 className={styles.section_title}>Om förfrågan</h2>
              <p className={styles.description}>{request.description}</p>
            </div>
          </div>

          {/* Höger – sidebar (order: after main on mobile via sidebar_after) */}
          <div className={`${styles.sidebar} ${styles.sidebar_after}`}>

            <div className={`${styles.seller} sidebarCard`}>
              <div className={styles.seller_header}>
                <div className={`${styles.seller_avatar} ${request.avatar_url ? '' : styles.avatar__orange}`}>
                  {request.avatar_url
                    ? <img src={request.avatar_url} alt={request.user_name} className={styles.seller_avatar_img} />
                    : request.user_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className={styles.seller_info}>
                  <strong className={styles.seller_name}>{request.user_name}</strong>
                  <span className={styles.seller_rating}>
                    {new Date(request.created_at).toLocaleDateString('sv-SE', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Budget */}
              <div className={styles.price_box}>
                <div className={styles.price_row}>
                  <span>Budget</span>
                  <strong className={styles.budget_price}>
                    {request.budget_type === 'prisforslag' ? 'Prisförslag' : `${request.budget} kr`}
                  </strong>
                </div>
                <div className={styles.price_row}>
                  <span>Plats</span>
                  <span>{request.location}</span>
                </div>
                <div className={styles.price_row}>
                  <span>Deadline</span>
                  <span>
                    {!request.deadline || request.deadline === 'ingen'
                      ? 'Ingen deadline'
                      : new Date(request.deadline).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {!isOwner && (
                <>
                  {(success || alreadySubmitted) ? (
                    <div className={styles.success_box} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> {alreadySubmitted && !success ? 'Du har redan anmält ditt intresse för detta uppdrag.' : 'Din intresseanmälan är skickad!'}
                    </div>
                  ) : (
                    <button
                      className={`btn btn-orange ${styles.order_btn}`}
                      onClick={() => {
                        if (!user) { setShowLoginPrompt(true); return }
                        if (accountType === 'bestellare') { setShowUpgradePrompt(true); return }
                        setShowInterestForm(true)
                      }}
                    >
                      <Users size={16} /> Jag kan hjälpa!
                    </button>
                  )}
                  {user && accountType !== 'bestellare' && (
                    <button
                      className={`btn btn-outline ${styles.question_btn}`}
                      onClick={handleContact}
                    >
                      <MessageCircle size={16} /> Kontakta beställaren
                    </button>
                  )}
                </>
              )}
            </div>

            {/* SvippoSafe */}
            <div className={`${styles.safe} sidebarCard`}>
              <Shield size={20} />
              <div>
                <strong>Känn dig trygg med SvippoSafe</strong>
                <p>Vi hjälper till att hantera trassel som kan dyka upp.</p>
              </div>
            </div>

            {/* Ägar-box */}
            {isOwner && (
              <div className={styles.owner_box}>
                <ClipboardList size={18} />
                <div>
                  <strong>Detta är din förfrågan</strong>
                  <p>Se vilka Svippare som visat intresse.</p>
                </div>
                <Link href="/intresseanmalningar" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                  Se intresseanmälningar
                </Link>
                <div className={styles.owner_actions}>
                  <button
                    className={`btn btn-outline ${styles.edit_btn}`}
                    onClick={() => router.push(`/create-request?edit=${request.id}`)}
                  >
                    <Pencil size={15} /> Redigera
                  </button>
                  <button
                    className={`btn btn-outline ${styles.delete_btn}`}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Tar bort...' : <><Trash2 size={15} /> Ta bort</>}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      {/* Intresse-drawer */}
      {showInterestForm && (
        <div className={styles.drawer_overlay} onClick={() => setShowInterestForm(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawer_header}>
              <div>
                <h2>Visa intresse</h2>
                <p>{request.title}</p>
              </div>
              <button onClick={() => setShowInterestForm(false)}>✕</button>
            </div>

            <div className={styles.drawer_fields}>
              <div className="form-group">
                <label className="form-label">Namn</label>
                <input className="form-input" value={userProfile?.name || user?.email || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">E-post</label>
                <input className="form-input" value={userProfile?.email || user?.email || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Telefonnummer</label>
                <input className="form-input" value={userProfile?.phone || 'Inget telefonnummer angivet'} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Ditt prisförslag (kr)</label>
                <input
                  className="form-input"
                  placeholder="T.ex. 1500"
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meddelande *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Beskriv varför du passar för detta uppdrag..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.drawer_footer}>
              <button className="btn btn-outline" onClick={() => setShowInterestForm(false)}>Avbryt</button>
              <button
                className="btn btn-orange"
                onClick={handleInterest}
                disabled={saving || !message}
              >
                {saving ? 'Skickar...' : 'Skicka intresseanmälan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uppgradera till Svippare-popup */}
      {showUpgradePrompt && (
        <div className="modal-backdrop" onClick={() => setShowUpgradePrompt(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}><Lock size={40} /></div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
              Du kan inte anmäla intresse
            </h2>
            <p style={{ color: 'var(--color-gray)', textAlign: 'center', marginBottom: '20px' }}>
              För att anmäla intresse på förfrågningar behöver du vara godkänd Svippare, företag eller UF-företag.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/become-svippare" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Ansök om att bli Svippare
              </Link>
              <button
                className="btn btn-outline"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setShowUpgradePrompt(false)}
              >
                Stäng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login prompt */}
      {showLoginPrompt && (
        <div className="modal-backdrop" onClick={() => setShowLoginPrompt(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p>Du måste logga in för att visa intresse för en förfrågan.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Link href="/login" className="btn btn-orange">Logga in</Link>
              <Link href="/register" className="btn btn-outline">Skapa konto</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}