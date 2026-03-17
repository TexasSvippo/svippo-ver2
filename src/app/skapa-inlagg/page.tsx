'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { categories } from '@/data/categories'
import styles from './createservice.module.scss'

type PriceType = 'timpris' | 'fastpris' | 'offert'

type CustomQuestion = {
  id: string
  label: string
  type: 'text' | 'select' | 'textarea'
  options?: string[]
  required: boolean
}

type FormData = {
  title: string
  description: string
  category_id: string
  subcategory: string
  price_type: PriceType
  price: string
  location: string
  custom_questions: CustomQuestion[]
}

const STEPS = ['Kategori', 'Detaljer', 'Pris & plats', 'Egna frågor', 'Granska']

export default function CreateServicePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    label: '',
    type: 'text' as 'text' | 'select' | 'textarea',
    options: '',
    required: false,
  })
  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    category_id: '',
    subcategory: '',
    price_type: 'timpris',
    price: '',
    location: '',
    custom_questions: [],
  })

  useEffect(() => {
    if (!loading && !user) router.push('/logga-in')
  }, [loading, user])

  if (loading) return <div className={styles.create_loading}>Laddar...</div>
  if (!user) return null

  const selectedCategory = categories.find(c => c.id === form.category_id)
  const update = (field: keyof FormData, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Hämta användarens namn från users-tabellen
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()

      await supabase.from('services').insert({
        title: form.title,
        description: form.description,
        category_id: form.category_id,
        subcategory: form.subcategory,
        price_type: form.price_type,
        price: form.price_type !== 'offert' ? Number(form.price) : null,
        location: form.location,
        user_id: user.id,
        user_name: userData?.name || user.email,
        user_email: user.email,
        custom_questions: form.custom_questions,
        rating: 0,
        reviews: 0,
        created_at: new Date().toISOString(),
      })
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
              <h1 className={styles.create__title}>Välj kategori</h1>
              <p className={styles.create__subtitle}>Inom vilket område erbjuder du din tjänst?</p>

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
              <h1 className={styles.create__title}>Beskriv din tjänst</h1>
              <p className={styles.create__subtitle}>Ju mer detaljer, desto fler beställningar!</p>

              <div className={styles.create__fields}>
                <div className={styles.create__field}>
                  <label className={styles.create__label}>Tjänstens namn</label>
                  <input className={styles.create__input} placeholder="T.ex. Professionell fönsterputsning" value={form.title} onChange={e => update('title', e.target.value)} />
                </div>
                <div className={styles.create__field}>
                  <label className={styles.create__label}>Beskrivning</label>
                  <textarea className={styles.create__textarea} placeholder="Beskriv vad du erbjuder, din erfarenhet och vad som ingår..." value={form.description} onChange={e => update('description', e.target.value)} rows={6} />
                </div>
              </div>
            </div>
          )}

          {/* Steg 3 – Pris & plats */}
          {step === 2 && (
            <div className={styles.create__content}>
              <h1 className={styles.create__title}>Pris & plats</h1>
              <p className={styles.create__subtitle}>Hur vill du ta betalt och var utför du tjänsten?</p>

              <div className={styles.create__fields}>
                <div className={styles.create__field}>
                  <label className={styles.create__label}>Pristyp</label>
                  <div className={styles.create__price_types}>
                    {(['timpris', 'fastpris', 'offert'] as PriceType[]).map(pt => (
                      <button
                        key={pt}
                        className={`${styles.create__price_type_btn} ${form.price_type === pt ? styles['create__price_type_btn--active'] : ''}`}
                        onClick={() => update('price_type', pt)}
                        type="button"
                      >
                        {pt === 'timpris' ? '⏱️ Timpris' : pt === 'fastpris' ? '💰 Fast pris' : '📋 Ge prisförslag'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.price_type !== 'offert' && (
                  <div className={styles.create__field}>
                    <label className={styles.create__label}>
                      {form.price_type === 'timpris' ? 'Pris per timme (kr)' : 'Fast pris (kr)'}
                    </label>
                    <input className={styles.create__input} placeholder="T.ex. 350" type="number" value={form.price} onChange={e => update('price', e.target.value)} />
                  </div>
                )}

                <div className={styles.create__field}>
                  <label className={styles.create__label}>Plats</label>
                  <input className={styles.create__input} placeholder="T.ex. Stockholm eller Digitalt" value={form.location} onChange={e => update('location', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Steg 4 – Egna frågor */}
          {step === 3 && (
            <div className={styles.create__content}>
              <h1 className={styles.create__title}>Egna frågor</h1>
              <p className={styles.create__subtitle}>Lägg till frågor du vill ställa till dina beställare. Max 5 frågor.</p>

              {form.custom_questions.length > 0 && (
                <div className={styles.create__custom_questions}>
                  {form.custom_questions.map((q, index) => (
                    <div key={q.id} className={styles.create__custom_question}>
                      <div className={styles.create__custom_question_info}>
                        <strong>{q.label}</strong>
                        <span>{q.type === 'text' ? 'Fritext' : q.type === 'textarea' ? 'Långt svar' : `Val: ${q.options?.join(', ')}`}</span>
                        {q.required && <span className={styles.create__custom_question_required}>Obligatorisk</span>}
                      </div>
                      <button
                        type="button"
                        className={styles.create__custom_question_remove}
                        onClick={() => setForm(prev => ({ ...prev, custom_questions: prev.custom_questions.filter((_, i) => i !== index) }))}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {form.custom_questions.length < 5 && (
                <div className={`${styles.create__add_question} card`}>
                  <h3 className={styles.create__add_question_title}>+ Lägg till fråga</h3>
                  <div className={styles.create__fields}>
                    <div className={styles.create__field}>
                      <label className={styles.create__label}>Fråga</label>
                      <input className={styles.create__input} placeholder="T.ex. Har du egna verktyg?" value={newQuestion.label} onChange={e => setNewQuestion(prev => ({ ...prev, label: e.target.value }))} />
                    </div>
                    <div className={styles.create__field}>
                      <label className={styles.create__label}>Svarstyp</label>
                      <div className={styles.create__price_types}>
                        {(['text', 'textarea', 'select'] as const).map(type => (
                          <button key={type} type="button" className={`${styles.create__price_type_btn} ${newQuestion.type === type ? styles['create__price_type_btn--active'] : ''}`} onClick={() => setNewQuestion(prev => ({ ...prev, type }))}>
                            {type === 'text' ? '✏️ Kort svar' : type === 'textarea' ? '📝 Långt svar' : '📋 Flerval'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {newQuestion.type === 'select' && (
                      <div className={styles.create__field}>
                        <label className={styles.create__label}>Svarsalternativ</label>
                        <input className={styles.create__input} placeholder="Separera med komma, t.ex. Ja,Nej,Vet ej" value={newQuestion.options} onChange={e => setNewQuestion(prev => ({ ...prev, options: e.target.value }))} />
                      </div>
                    )}
                    <div className={styles.create__field}>
                      <label className={styles.create__checkbox_label}>
                        <input type="checkbox" checked={newQuestion.required} onChange={e => setNewQuestion(prev => ({ ...prev, required: e.target.checked }))} />
                        Obligatorisk fråga
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!newQuestion.label || (newQuestion.type === 'select' && !newQuestion.options)}
                      onClick={() => {
                        const question: CustomQuestion = {
                          id: Date.now().toString(),
                          label: newQuestion.label,
                          type: newQuestion.type,
                          options: newQuestion.type === 'select' ? newQuestion.options.split(',').map(o => o.trim()).filter(Boolean) : undefined,
                          required: newQuestion.required,
                        }
                        setForm(prev => ({ ...prev, custom_questions: [...prev.custom_questions, question] }))
                        setNewQuestion({ label: '', type: 'text', options: '', required: false })
                      }}
                    >
                      Lägg till fråga
                    </button>
                  </div>
                </div>
              )}

              {form.custom_questions.length === 0 && (
                <p className={styles.create__skip_hint}>💡 Du kan hoppa över detta steg om du inte vill lägga till egna frågor.</p>
              )}
            </div>
          )}

          {/* Steg 5 – Granska */}
          {step === 4 && (
            <div className={styles.create__content}>
              <h1 className={styles.create__title}>Granska & publicera</h1>
              <p className={styles.create__subtitle}>Kontrollera att allt stämmer innan du publicerar.</p>
              <div className={styles.create__review}>
                {[
                  { label: 'Kategori', value: `${selectedCategory?.label} – ${form.subcategory}` },
                  { label: 'Titel', value: form.title },
                  { label: 'Beskrivning', value: form.description },
                  { label: 'Pris', value: form.price_type === 'offert' ? 'Offert' : `${form.price} kr (${form.price_type})` },
                  { label: 'Plats', value: form.location },
                  { label: 'Egna frågor', value: form.custom_questions.length > 0 ? `${form.custom_questions.length} frågor` : 'Inga' },
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
                  (step === 2 && (!form.location || (form.price_type !== 'offert' && !form.price)))
                }
              >
                Nästa →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} type="button">
                {saving ? 'Publicerar...' : '🚀 Publicera tjänst'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Success popup */}
      {showSuccess && (
        <div className={styles.create__overlay}>
          <div className={styles.create__success_modal}>
            <div className={styles.create__success_emoji}>🎉</div>
            <h2 className={styles.create__success_title}>Vad kul att du kommit igång!</h2>
            <p className={styles.create__success_text}>Ditt inlägg är nu publicerat och synligt för alla på Svippo. Lycka till!</p>
            <div className={styles.create__success_actions}>
              <button className="btn btn-primary" onClick={() => router.push('/profil')}>Till din profil</button>
              <button className="btn btn-outline" onClick={() => router.push('/tjanster')}>Se tjänster</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}