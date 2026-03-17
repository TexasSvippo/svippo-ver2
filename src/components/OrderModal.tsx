'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { orderQuestions } from '@/data/orderQuestions'
import styles from './OrderModal.module.scss'

type CustomQuestion = {
  id: string
  label: string
  type: 'text' | 'select' | 'textarea'
  options?: string[]
  required: boolean
}

type Props = {
  serviceId: string
  serviceTitle: string
  sellerId: string
  sellerName: string
  subcategory: string
  priceType: string
  price: number
  location: string
  customQuestions: CustomQuestion[]
  onClose: () => void
}

export default function OrderModal({
  serviceId,
  serviceTitle,
  sellerId,
  sellerName,
  subcategory,
  priceType,
  price,
  location,
  customQuestions,
  onClose,
}: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    const fetchProfile = async () => {
      const { data } = await supabase.from('users').select('name, email, phone').eq('id', user.id).single()
      if (data) {
        setName(data.name || '')
        setEmail(data.email || user.email || '')
        setPhone(data.phone || '')
      }
    }
    fetchProfile()
  }, [user])

  const subcategoryQuestions = orderQuestions[subcategory] || []
  const hasSubcategoryQuestions = subcategoryQuestions.length > 0
  const hasCustomQuestions = customQuestions.length > 0

  const STEPS = [
    'Kontaktinfo',
    ...(hasSubcategoryQuestions ? ['Frågor'] : []),
    ...(hasCustomQuestions ? ['Utförarens frågor'] : []),
    'Bekräfta',
  ]
  const totalSteps = STEPS.length

  const canProceed = () => {
    if (step === 0) return name && email
    if (STEPS[step] === 'Frågor') {
      return subcategoryQuestions.filter(q => q.required).every(q => answers[q.id])
    }
    if (STEPS[step] === 'Utförarens frågor') {
      return customQuestions.filter(q => q.required).every(q => customAnswers[q.id])
    }
    return true
  }

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    try {
      // Bygg svar med labels som nycklar
      const answersWithLabels: Record<string, string> = {}
      subcategoryQuestions.forEach(q => {
        if (answers[q.id]) answersWithLabels[q.label] = answers[q.id]
      })

      const customAnswersWithLabels: Record<string, string> = {}
      customQuestions.forEach(q => {
        if (customAnswers[q.id]) customAnswersWithLabels[q.label] = customAnswers[q.id]
      })

      const { data: order } = await supabase.from('orders').insert({
        service_id: serviceId,
        service_title: serviceTitle,
        seller_id: sellerId,
        seller_name: sellerName,
        buyer_id: user.id,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
        subcategory,
        message,
        answers: answersWithLabels,
        custom_answers: customAnswersWithLabels,
        status: 'pending',
        project_status: 'not_started',
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
      }).select().single()

      // Skicka notifikation till utföraren
      if (order) {
        await supabase.from('notifications').insert({
          user_id: sellerId,
          type: 'new_order',
          order_id: order.id,
          service_title: serviceTitle,
          actor_name: name,
          message: `${name} har beställt din tjänst "${serviceTitle}"!`,
          action_url: `/bestallning/${order.id}`,
          read: false,
          dismissed: false,
          email_sent: false,
          created_at: new Date().toISOString(),
        })
      }

      setSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const renderField = (
    q: { id: string; label: string; type: string; placeholder?: string; options?: string[]; required?: boolean },
    value: string,
    onChange: (val: string) => void
  ) => {
    if (q.type === 'select') {
      return (
        <select
          className={styles.input}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Välj...</option>
          {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }
    if (q.type === 'textarea') {
      return (
        <textarea
          className={styles.textarea}
          placeholder={q.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
        />
      )
    }
    return (
      <input
        className={styles.input}
        type={q.type === 'number' ? 'number' : 'text'}
        placeholder={q.placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        {!success ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div>
                <h2 className={styles.title}>Beställ tjänst</h2>
                <p className={styles.subtitle}>{serviceTitle}</p>
              </div>
              <button className={styles.close} onClick={onClose}>✕</button>
            </div>

            {/* Steg-indikator */}
            <div className={styles.steps}>
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`${styles.step} ${i === step ? styles['step--active'] : ''} ${i < step ? styles['step--done'] : ''}`}
                >
                  <div className={styles.step_dot}>{i < step ? '✓' : i + 1}</div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Steg 1 – Kontaktinfo */}
            {step === 0 && (
              <div className={styles.fields}>
                <p className={styles.hint}>Dina uppgifter är hämtade från din profil.</p>
                {[
                  { label: 'Namn', value: name },
                  { label: 'E-post', value: email },
                  { label: 'Telefon', value: phone || 'Inget telefonnummer angivet' },
                ].map(f => (
                  <div key={f.label} className={styles.field}>
                    <label className={styles.label}>{f.label}</label>
                    <input className={`${styles.input} ${styles.locked}`} value={f.value} disabled />
                  </div>
                ))}
              </div>
            )}

            {/* Steg 2 – Underkategori-frågor */}
            {STEPS[step] === 'Frågor' && (
              <div className={styles.fields}>
                <p className={styles.hint}>Besvara frågorna så utföraren kan förbereda sig.</p>
                {subcategoryQuestions.map(q => (
                  <div key={q.id} className={styles.field}>
                    <label className={styles.label}>
                      {q.label} {q.required && <span className={styles.required}>*</span>}
                    </label>
                    {renderField(q, answers[q.id] || '', val => setAnswers(prev => ({ ...prev, [q.id]: val })))}
                  </div>
                ))}
              </div>
            )}

            {/* Steg 3 – Utförarens egna frågor */}
            {STEPS[step] === 'Utförarens frågor' && (
              <div className={styles.fields}>
                <p className={styles.hint}>Utföraren vill veta lite mer om ditt uppdrag.</p>
                {customQuestions.map(q => (
                  <div key={q.id} className={styles.field}>
                    <label className={styles.label}>
                      {q.label} {q.required && <span className={styles.required}>*</span>}
                    </label>
                    {renderField(q, customAnswers[q.id] || '', val => setCustomAnswers(prev => ({ ...prev, [q.id]: val })))}
                  </div>
                ))}
              </div>
            )}

            {/* Sista steg – Bekräfta */}
            {step === totalSteps - 1 && (
              <div className={styles.fields}>
                <div className={styles.summary}>
                  {[
                    { label: 'Tjänst', value: serviceTitle },
                    { label: 'Utförare', value: sellerName },
                    { label: 'Pris', value: priceType === 'offert' ? 'Offert' : `${price} kr (${priceType})` },
                    { label: 'Plats', value: location },
                  ].map(row => (
                    <div key={row.label} className={styles.summary_row}>
                      <span>{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Meddelande till {sellerName}</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Beskriv vad du behöver hjälp med, när och eventuella önskemål..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Navigering */}
            <div className={styles.nav}>
              {step > 0 && (
                <button className="btn btn-outline" onClick={() => setStep(step - 1)}>← Tillbaka</button>
              )}
              {step < totalSteps - 1 ? (
                <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  Nästa →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !message}>
                  {saving ? 'Skickar...' : '🚀 Skicka beställning'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className={styles.success}>
            <div className={styles.success_emoji}>🎉</div>
            <h2 className={styles.success_title}>Beställning skickad!</h2>
            <p className={styles.success_text}>
              {sellerName} har fått din beställning och återkommer till dig så snart som möjligt.
            </p>
            <button className="btn btn-primary" onClick={onClose}>Stäng</button>
          </div>
        )}

      </div>
    </div>
  )
}