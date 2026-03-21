'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { categories } from '@/data/categories'
import { municipalities } from '@/data/municipalities'
import styles from './createrequest.module.scss'

type FormData = {
  title: string
  description: string
  category_id: string
  subcategory: string
  budget_type: 'fast' | 'prisforslag'
  budget: string
  deadline: string
  location: string
  location_type: 'plats' | 'online'
  image_url: string
}

const STEPS = ['Kategori', 'Detaljer', 'Budget & plats', 'Granska']

function CreateRequestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditing = !!editId
  const [step, setStep] = useState(isEditing ? 1 : 0)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(isEditing)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category_id: '',
    subcategory: '',
    budget_type: 'fast',
    budget: '',
    deadline: '',
    location: '',
    location_type: 'plats',
    image_url: '',
  })

  const [locationSearch, setLocationSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredMunicipalities = municipalities.filter(m =>
    m.toLowerCase().startsWith(locationSearch.toLowerCase())
  ).slice(0, 6)

  useEffect(() => {
    if (!editId || !user) return
    const fetchRequest = async () => {
      const { data } = await supabase.from('requests').select('*').eq('id', editId).eq('user_id', user.id).single()
      if (data) {
        setForm({
          title: data.title || '',
          description: data.description || '',
          category_id: data.category_id || '',
          subcategory: data.subcategory || '',
          budget_type: data.budget_type || 'fast',
          budget: data.budget ? String(data.budget) : '',
          deadline: data.deadline || '',
          location: data.location || '',
          location_type: data.location === 'Online' ? 'online' : 'plats',
          image_url: data.image_url || '',
        })
        setLocationSearch(data.location !== 'Online' ? data.location || '' : '')
        if (data.image_url) {
          setImagePreview(data.image_url)
          setExistingImageUrl(data.image_url)
        }
      } else {
        router.push('/profil')
      }
      setLoadingEdit(false)
    }
    fetchRequest()
  }, [editId, user])

  useEffect(() => {
    if (!loading && !user) router.push('/logga-in')
  }, [loading, user])

  if (loading || loadingEdit) return <div className={styles.create_loading}>Laddar...</div>
  if (!user) return null

  const selectedCategory = categories.find(c => c.id === form.category_id)
  const update = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Bilden är för stor! Max 2MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null
    setUploadingImage(true)
    try {
      const ext = imageFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('request-images')
        .upload(fileName, imageFile, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('request-images').getPublicUrl(fileName)
      return data.publicUrl
    } catch (err) {
      console.error(err)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const { data: userData } = await supabase.from('users').select('name').eq('id', user.id).single()

      let imageUrl = existingImageUrl || ''

      if (imageFile) {
        if (existingImageUrl) {
          const oldFileName = existingImageUrl.split('/').pop()
          if (oldFileName) await supabase.storage.from('request-images').remove([oldFileName])
        }
        const url = await uploadImage()
        if (url) imageUrl = url
      }

      if (!imagePreview && existingImageUrl) {
        const oldFileName = existingImageUrl.split('/').pop()
        if (oldFileName) await supabase.storage.from('request-images').remove([oldFileName])
        imageUrl = ''
      }

      if (isEditing) {
        await supabase.from('requests').update({
          title: form.title,
          description: form.description,
          budget_type: form.budget_type,
          budget: form.budget_type === 'fast' ? Number(form.budget) : null,
          deadline: form.deadline || null,
          location: form.location,
          image_url: imageUrl,
        }).eq('id', editId)
      } else {
        await supabase.from('requests').insert({
          title: form.title,
          description: form.description,
          category_id: form.category_id,
          subcategory: form.subcategory,
          budget_type: form.budget_type,
          budget: form.budget_type === 'fast' ? Number(form.budget) : null,
          deadline: form.deadline || null,
          location: form.location,
          user_id: user.id,
          user_name: userData?.name || user.email,
          user_email: user.email,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        })

        // Skicka notifikationer till prenumeranter
        const { data: subscribers } = await supabase
          .from('category_subscriptions')
          .select('user_id')
          .like('category_id', `${form.category_id}%`)
    

        if (subscribers && subscribers.length > 0) {
          const notifications = subscribers
            .filter(sub => sub.user_id !== user.id)
            .map(sub => ({
              user_id: sub.user_id,
              type: 'new_request_in_category',
              actor_name: userData?.name || user.email,
              message: `Ny förfrågan inom ${selectedCategory?.label}: "${form.title}"`,
              action_url: `/forfragningar`,
              read: false,
              dismissed: false,
              email_sent: false,
              created_at: new Date().toISOString(),
            }))
          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
          }
        }
      }

      setShowSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.create}>
      <div className={`container ${styles.create__inner}`}>

        {/* Steg-indikator */}
        <div className={styles.create__steps}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`${styles.create__step} ${i === step ? styles['create__step--active'] : ''} ${i < step ? styles['create__step--done'] : ''}`}
            >
              <div className={styles.create__step_dot}>{i < step ? '✓' : i + 1}</div>
              <span className={styles.create__step_label}>{s}</span>
            </div>
          ))}
        </div>

        <div className={`${styles.create__card} card`}>

          {/* Steg 1 – Kategori */}
          {step === 0 && (
            <div className={styles.create__content}>
              <h1 className={styles.create__title}>Vad behöver du hjälp med?</h1>
              <p className={styles.create__subtitle}>Välj den kategori som passar bäst</p>

              <div className={styles.create__categories}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`${styles.create__category_btn} ${form.category_id === cat.id ? styles['create__category_btn--active'] : ''}`}
                    onClick={() => update('category_id', cat.id)}
                    type="button"
                  >
                    <span className={styles.create__category_icon}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className={styles.create__subcategories}>
                  <label className={styles.create__label}>Underkategori</label>
                  <div className={styles.create__subcategory_grid}>
                    {selectedCategory.subcategories.map(sub => (
                      <button
                        key={sub}
                        className={`${styles.create__subcategory_btn} ${form.subcategory === sub ? styles['create__subcategory_btn--active'] : ''}`}
                        onClick={() => update('subcategory', sub)}
                        type="button"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Steg 2 – Detaljer */}
          {step === 1 && (
            <div className={styles.create__content}>
              <h1 className={styles.create__title}>Beskriv din förfrågan</h1>
              <p className={styles.create__subtitle}>Ju mer detaljer, desto bättre svar!</p>

              <div className={styles.create__fields}>
                <div className={styles.create__field}>
                  <label className={styles.create__label}>Rubrik</label>
                  <input className={styles.create__input} placeholder="T.ex. Söker snickare för att bygga staket" value={form.title} onChange={e => update('title', e.target.value)} />
                </div>

                <div className={styles.create__field}>
                  <label className={styles.create__label}>Beskrivning</label>
                  <textarea className={styles.create__textarea} placeholder="Beskriv vad du behöver hjälp med, när och eventuella krav..." value={form.description} onChange={e => update('description', e.target.value)} rows={6} />
                </div>

                <div className={styles.create__field}>
                  <label className={styles.create__label}>Bild (valfritt)</label>
                  <div className={styles.create__image_upload}>
                    {imagePreview ? (
                      <div className={styles.create__image_preview}>
                        <img src={imagePreview} alt="Förhandsgranskning" />
                        <button
                          className={styles.create__image_remove}
                          onClick={() => { setImagePreview(null); setImageFile(null) }}
                          type="button"
                        >
                          ✕ Ta bort bild
                        </button>
                      </div>
                    ) : (
                      <label className={styles.create__image_label}>
                        <span>📷 Klicka för att ladda upp bild</span>
                        <span className={styles.create__image_hint}>Max 2MB – JPG, PNG</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} style={{ display: 'none' }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steg 3 – Budget & plats */}
          {step === 2 && (
            <div className={styles.create__content}>
              <h1 className={styles.create__title}>Budget & plats</h1>
              <p className={styles.create__subtitle}>Vad är din budget och var ska jobbet utföras?</p>

              <div className={styles.create__fields}>
                <div className={styles.create__field}>
                  <label className={styles.create__label}>Hur vill du hantera priset?</label>
                  <div className={styles.create__price_types}>
                    <button type="button" className={`${styles.create__price_type_btn} ${form.budget_type === 'fast' ? styles['create__price_type_btn--active'] : ''}`} onClick={() => update('budget_type', 'fast')}>
                      💰 Sätt egen budget
                    </button>
                    <button type="button" className={`${styles.create__price_type_btn} ${form.budget_type === 'prisforslag' ? styles['create__price_type_btn--active'] : ''}`} onClick={() => update('budget_type', 'prisforslag')}>
                      📋 Be om prisförslag
                    </button>
                  </div>
                </div>

                {form.budget_type === 'fast' && (
                  <div className={styles.create__field}>
                    <label className={styles.create__label}>Din budget (kr)</label>
                    <input className={styles.create__input} placeholder="T.ex. 2000" type="number" value={form.budget} onChange={e => update('budget', e.target.value)} />
                  </div>
                )}

                <div className={styles.create__field}>
                  <label className={styles.create__label}>Deadline</label>
                  <div className={styles.create__price_types}>
                    <button type="button" className={`${styles.create__price_type_btn} ${form.deadline === 'ingen' ? styles['create__price_type_btn--active'] : ''}`} onClick={() => update('deadline', 'ingen')}>
                      🕐 Ingen deadline
                    </button>
                    <button type="button" className={`${styles.create__price_type_btn} ${form.deadline !== 'ingen' && form.deadline !== '' ? styles['create__price_type_btn--active'] : ''}`} onClick={() => update('deadline', new Date().toISOString().split('T')[0])}>
                      📅 Sätt deadline
                    </button>
                  </div>
                  {form.deadline !== 'ingen' && form.deadline !== '' && (
                    <input className={styles.create__input} type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} min={new Date().toISOString().split('T')[0]} style={{ marginTop: '10px' }} />
                  )}
                </div>

                <div className={styles.create__field}>
                  <label className={styles.create__label}>Plats</label>
                  <div className={styles.create__price_types}>
                    {(['plats', 'online'] as const).map(type => (
                      <button
                        key={type}
                        className={`${styles.create__price_type_btn} ${form.location_type === type ? styles['create__price_type_btn--active'] : ''}`}
                        onClick={() => {
                          update('location_type', type)
                          if (type === 'online') {
                            update('location', 'Online')
                            setLocationSearch('')
                          } else {
                            update('location', '')
                          }
                        }}
                        type="button"
                      >
                        {type === 'plats' ? '📍 Plats' : '💻 Online'}
                      </button>
                    ))}
                  </div>

                  {form.location_type === 'plats' && (
                    <div className={styles.create__location_wrap}>
                      <input
                        className={styles.create__input}
                        placeholder="Sök kommun..."
                        value={locationSearch || form.location}
                        onChange={e => {
                          setLocationSearch(e.target.value)
                          update('location', '')
                          setShowSuggestions(true)
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      />
                      {showSuggestions && locationSearch && filteredMunicipalities.length > 0 && (
                        <div className={styles.create__suggestions}>
                          {filteredMunicipalities.map(m => (
                            <button
                              key={m}
                              type="button"
                              className={styles.create__suggestion}
                              onClick={() => {
                                update('location', m)
                                setLocationSearch(m)
                                setShowSuggestions(false)
                              }}
                            >
                              📍 {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {form.location_type === 'online' && (
                    <p className={styles.create__online_hint}>💻 Uppdraget utförs digitalt och är tillgängligt för alla.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Steg 4 – Granska */}
          {step === 3 && (
            <div className={styles.create__content}>
              <h1 className={styles.create__title}>Granska & publicera</h1>
              <p className={styles.create__subtitle}>Kontrollera att allt stämmer innan du publicerar.</p>

              {imagePreview && <img src={imagePreview} alt="Förhandsgranskning" className={styles.create__review_image} />}

              <div className={styles.create__review}>
                {[
                  { label: 'Kategori', value: `${selectedCategory?.label} – ${form.subcategory}` },
                  { label: 'Rubrik', value: form.title },
                  { label: 'Beskrivning', value: form.description },
                  { label: 'Budget', value: form.budget_type === 'prisforslag' ? 'Be om prisförslag' : `${form.budget} kr` },
                  { label: 'Deadline', value: !form.deadline || form.deadline === 'ingen' ? 'Ingen deadline' : form.deadline },
                  { label: 'Plats', value: form.location },
                ].map(row => (
                  <div key={row.label} className={styles.create__review_row}>
                    <span className={styles.create__review_label}>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigering */}
          <div className={styles.create__nav}>
            {step > 0 && (
              <button className="btn btn-outline" onClick={() => setStep(step - 1)} type="button">← Tillbaka</button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                type="button"
                disabled={
                  (step === 0 && (!form.category_id || !form.subcategory)) ||
                  (step === 1 && (!form.title || !form.description)) ||
                  (step === 2 && (!form.location || (form.budget_type === 'fast' && !form.budget)))
                }
              >
                Nästa →
              </button>
            ) : (
              <button className="btn btn-orange" onClick={handleSubmit} disabled={saving || uploadingImage} type="button">
                {saving ? 'Publicerar...' : '🚀 Publicera förfrågan'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Success popup */}
      {showSuccess && (
        <div className={styles.create__overlay}>
          <div className={styles.create__success_modal}>
            <div className={styles.create__success_emoji}>🙌</div>
            <h2 className={styles.create__success_title}>Förfrågan publicerad!</h2>
            <p className={styles.create__success_text}>Din förfrågan är nu synlig för alla Svippare. Du får ett meddelande när någon visar intresse!</p>
            <div className={styles.create__success_actions}>
              <button className="btn btn-orange" onClick={() => router.push('/forfragningar')}>Till förfrågningar</button>
              <button className="btn btn-outline" onClick={() => router.push('/profil')}>Till din profil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <CreateRequestPage />
    </Suspense>
  )
}