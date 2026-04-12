'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { categories } from '@/data/categories'
import styles from './blisvippare.module.scss'

type SocialLink = {
  id: string
  url: string
}

type FormData = {
  // Steg 1
  categories: string[]
  // Steg 2
  personal_number: string
  address: string
  postal_code: string
  city: string
  // Steg 3
  bio: string
  experience: string
  website: string
  social_links: SocialLink[]
}

const STEPS = ['Kategorier', 'Personuppgifter', 'Din profil', 'Granska']

export default function BliSvipparePage() {
  const { user, loading, accountType, svippareStatus } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FormData>({
    categories: [],
    personal_number: '',
    address: '',
    postal_code: '',
    city: '',
    bio: '',
    experience: '',
    website: '',
    social_links: [],
  })

    useEffect(() => {
    if (loading) return
    if (!user) {
        router.push('/login')
        return
    }
    if (accountType === 'svippare' && svippareStatus === 'pending') {
        router.push('/profile?svippare=pending')
        return
    }
    if (accountType === 'svippare' && svippareStatus === 'approved') {
        router.push('/profile')
        return
    }
    if (accountType === 'foretag' || accountType === 'uf-foretag') {
        router.push('/profile')
        return
    }
    }, [loading, user, accountType, svippareStatus])

  if (loading || !user) return <div className={styles.loading}>Laddar...</div>

  const toggleCategory = (catId: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId]
    }))
  }

  const addSocialLink = () => {
    setForm(prev => ({
      ...prev,
      social_links: [...prev.social_links, { id: Date.now().toString(), url: '' }]
    }))
  }

  const updateSocialLink = (id: string, url: string) => {
    setForm(prev => ({
      ...prev,
      social_links: prev.social_links.map(link => link.id === id ? { ...link, url } : link)
    }))
  }

  const removeSocialLink = (id: string) => {
    setForm(prev => ({
      ...prev,
      social_links: prev.social_links.filter(link => link.id !== id)
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await supabase.from('svippare_profiles').insert({
        user_id: user.id,
        status: 'pending',
        categories: form.categories,
        location: form.city,
        bio: form.bio,
        experience: form.experience,
        website: form.website,
        personal_number: form.personal_number,
        address: form.address,
        postal_code: form.postal_code,
        city: form.city,
        social_links: form.social_links
          .map(l => l.url.trim())
          .filter(Boolean),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      await supabase.from('users').update({
        account_type: 'svippare',
      }).eq('id', user.id)

      await supabase.auth.updateUser({
        data: {
          account_type: 'svippare',
          svippare_status: 'pending',
        }
      })

      router.push('/profile?svippare=pending')
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return form.categories.length > 0
    if (step === 1) return !!(form.personal_number && form.address && form.postal_code && form.city)
    if (step === 2) return !!form.bio
    return true
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.page__inner}`}>

        {/* Steg-indikator */}
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`${styles.step} ${i === step ? styles['step--active'] : ''} ${i < step ? styles['step--done'] : ''}`}
            >
              <div className={styles.step__dot}>{i < step ? '✓' : i + 1}</div>
              <span className={styles.step__label}>{s}</span>
            </div>
          ))}
        </div>

        <div className={`${styles.card} card`}>

          {/* Steg 1 – Kategorier */}
          {step === 0 && (
            <div className={styles.content}>
              <h1 className={styles.title}>Vilka kategorier passar dig?</h1>
              <p className={styles.subtitle}>Välj en eller flera kategorier du erbjuder tjänster inom.</p>
              <div className={styles.category_grid}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.category_btn} ${form.categories.includes(cat.id) ? styles['category_btn--active'] : ''}`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span className={styles.category_icon}>{cat.icon}</span>
                    <span>{cat.label}</span>
                    {form.categories.includes(cat.id) && <span className={styles.category_check}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Steg 2 – Personuppgifter */}
          {step === 1 && (
            <div className={styles.content}>
              <h1 className={styles.title}>Dina personuppgifter</h1>
              <p className={styles.subtitle}>Används för identitetsverifiering och visas aldrig publikt.</p>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>Personnummer <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    placeholder="ÅÅMMDD-XXXX"
                    value={form.personal_number}
                    onChange={e => setForm(prev => ({ ...prev, personal_number: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Adress <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    placeholder="Gatuadress"
                    value={form.address}
                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className={styles.field_row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Postnummer <span className={styles.required}>*</span></label>
                    <input
                      className={styles.input}
                      placeholder="123 45"
                      value={form.postal_code}
                      onChange={e => setForm(prev => ({ ...prev, postal_code: e.target.value }))}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Stad <span className={styles.required}>*</span></label>
                    <input
                      className={styles.input}
                      placeholder="Stockholm"
                      value={form.city}
                      onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                </div>
                <div className={styles.privacy_note}>
                  🔒 Dina personuppgifter lagras säkert och används enbart för att verifiera din identitet.
                </div>
              </div>
            </div>
          )}

          {/* Steg 3 – Din profil */}
          {step === 2 && (
            <div className={styles.content}>
              <h1 className={styles.title}>Berätta om dig själv</h1>
              <p className={styles.subtitle}>Detta visas på din publika profil när du är godkänd.</p>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>Beskriv dig själv <span className={styles.required}>*</span></label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Berätta kort om dig själv och vad du kan hjälpa till med..."
                    value={form.bio}
                    onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Erfarenhet <span className={styles.optional}>(valfritt)</span></label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Beskriv din erfarenhet, utbildning eller tidigare uppdrag..."
                    value={form.experience}
                    onChange={e => setForm(prev => ({ ...prev, experience: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Webbplats / portfolio <span className={styles.optional}>(valfritt)</span></label>
                  <input
                    className={styles.input}
                    placeholder="https://dinwebbplats.se"
                    value={form.website}
                    onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
                  />
                </div>

                {/* Sociala medier */}
                <div className={styles.field}>
                  <label className={styles.label}>Sociala medier <span className={styles.optional}>(valfritt)</span></label>
                  <p className={styles.hint}>Lägg till länkar till dina sociala konton.</p>

                  {form.social_links.length > 0 && (
                    <div className={styles.social_links}>
                      {form.social_links.map(link => (
                        <div key={link.id} className={styles.social_link_row}>
                          <input
                            className={styles.input}
                            placeholder="https://instagram.com/dittnamn"
                            value={link.url}
                            onChange={e => updateSocialLink(link.id, e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.social_link_remove}
                            onClick={() => removeSocialLink(link.id)}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.social_add_btn}
                    onClick={addSocialLink}
                  >
                    + Lägg till konto
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Steg 4 – Granska */}
          {step === 3 && (
            <div className={styles.content}>
              <h1 className={styles.title}>Granska din ansökan</h1>
              <p className={styles.subtitle}>Kontrollera att allt stämmer innan du skickar in.</p>

              <div className={styles.review}>
                <div className={styles.review_section}>
                  <h3 className={styles.review_heading}>Kategorier</h3>
                  <div className={styles.review_tags}>
                    {form.categories.map(catId => {
                      const cat = categories.find(c => c.id === catId)
                      return (
                        <span key={catId} className={styles.review_tag}>
                          {cat?.icon} {cat?.label}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className={styles.review_section}>
                  <h3 className={styles.review_heading}>Personuppgifter</h3>
                  <div className={styles.review_rows}>
                    <div className={styles.review_row}><span>Personnummer</span><strong>{'•'.repeat(form.personal_number.length)}</strong></div>
                    <div className={styles.review_row}><span>Adress</span><strong>{form.address}</strong></div>
                    <div className={styles.review_row}><span>Postnummer</span><strong>{form.postal_code}</strong></div>
                    <div className={styles.review_row}><span>Stad</span><strong>{form.city}</strong></div>
                  </div>
                </div>

                <div className={styles.review_section}>
                  <h3 className={styles.review_heading}>Din profil</h3>
                  <div className={styles.review_rows}>
                    <div className={styles.review_row}><span>Om dig</span><strong>{form.bio}</strong></div>
                    {form.experience && <div className={styles.review_row}><span>Erfarenhet</span><strong>{form.experience}</strong></div>}
                    {form.website && <div className={styles.review_row}><span>Webbplats</span><strong>{form.website}</strong></div>}
                    {form.social_links.filter(l => l.url).length > 0 && (
                      <div className={styles.review_row}>
                        <span>Sociala medier</span>
                        <div className={styles.review_social}>
                          {form.social_links.filter(l => l.url).map(l => (
                            <strong key={l.id}>{l.url}</strong>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.payment_info}>
                <span>💡</span>
                <p>
                  Svippo är en marknadsplats – betalning sker direkt mellan dig och kunden utanför plattformen.
                  Som privatperson rekommenderar vi att du använder en <strong>faktureringstjänst utan eget företag</strong> för att ta betalt och redovisa dina inkomster korrekt.
                </p>
              </div>
            </div>
          )}

          {/* Navigering */}
          <div className={styles.nav}>
            {step > 0 ? (
              <button className="btn btn-outline" type="button" onClick={() => setStep(step - 1)}>
                ← Tillbaka
              </button>
            ) : (
              <button className="btn btn-outline" type="button" onClick={() => router.push('/profile')}>
                ← Avbryt
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Nästa →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Skickar...' : '🚀 Skicka ansökan'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}