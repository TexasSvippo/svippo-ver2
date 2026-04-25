'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { orderQuestions } from '@/data/orderQuestions'
import type { ServiceType } from '@/data/categories'
import styles from './OrderModal.module.scss'
import { Wallet, Lightbulb } from 'lucide-react'

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
  serviceType?: ServiceType
  customQuestions: CustomQuestion[]
  offersRut?: boolean
  offersRot?: boolean
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
  serviceType = 'typ1',
  customQuestions,
  offersRut = false,
  offersRot = false,
  onClose,
}: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Kontaktinfo
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Typ 1 – platsbunden
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [address, setAddress] = useState('')

  // Typ 2 – digital löpande
  const [desiredDeadline, setDesiredDeadline] = useState('')
  const [milestones, setMilestones] = useState('')

  // Typ 3 – engångstjänst
  const [pickupAddress, setPickupAddress] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')

  // Svar på frågor
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

  // Typ-specifikt steg
  const typeStepLabel =
    serviceType === 'typ1' ? 'Datum & plats' :
    serviceType === 'typ2' ? 'Tidslinje' :
    'Upphämtning & leverans'

  const STEPS = [
    'Kontaktinfo',
    typeStepLabel,
    ...(hasSubcategoryQuestions ? ['Frågor'] : []),
    ...(hasCustomQuestions ? ['Utförarens frågor'] : []),
    'Bekräfta',
  ]
  const totalSteps = STEPS.length

  const canProceed = () => {
    if (step === 0) return name && email
    if (STEPS[step] === 'Datum & plats') return preferredDate && address
    if (STEPS[step] === 'Upphämtning & leverans') return pickupAddress && deliveryAddress && pickupDate
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
      const answersWithLabels: Record<string, string> = {}
      subcategoryQuestions.forEach(q => {
        if (answers[q.id]) answersWithLabels[q.label] = answers[q.id]
      })

      const customAnswersWithLabels: Record<string, string> = {}
      customQuestions.forEach(q => {
        if (customAnswers[q.id]) customAnswersWithLabels[q.label] = customAnswers[q.id]
      })

      // Bygg typ-specifik extra data som sparas i answers
      if (serviceType === 'typ1') {
        if (preferredDate) answersWithLabels['Önskat datum'] = preferredDate
        if (preferredTime) answersWithLabels['Önskad tid'] = preferredTime
        if (address) answersWithLabels['Adress'] = address
      }
      if (serviceType === 'typ2') {
        if (desiredDeadline) answersWithLabels['Önskat slutdatum'] = desiredDeadline
        if (milestones) answersWithLabels['Föreslagna milstolpar'] = milestones
      }
      if (serviceType === 'typ3') {
        if (pickupAddress) answersWithLabels['Upphämtningsadress'] = pickupAddress
        if (deliveryAddress) answersWithLabels['Leveransadress'] = deliveryAddress
        if (pickupDate) answersWithLabels['Datum'] = pickupDate
        if (pickupTime) answersWithLabels['Tid'] = pickupTime
      }

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
        service_type: serviceType,
        status: 'pending',
        project_status: 'not_started',
        payment_status: 'unpaid',
        created_at: new Date().toISOString(),
      }).select().single()

      if (order) {
        await supabase.from('notifications').insert({
          user_id: sellerId,
          type: 'new_order',
          order_id: order.id,
          service_title: serviceTitle,
          actor_name: name,
          message: `${name} har beställt din tjänst "${serviceTitle}"!`,
          action_url: `/order/${order.id}`,
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
        <select className={styles.input} value={value} onChange={e => onChange(e.target.value)}>
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
                {offersRut && (
                  <div className={styles.payment_info}>
                    <Wallet size={16} />
                    <p>Denna tjänst erbjuder <strong>RUT-avdrag</strong> – du betalar ca 50% av priset ({Math.round(price * 0.5)} kr) efter skattereduktion. Max 75 000 kr/år.</p>
                  </div>
                )}
                {offersRot && (
                  <div className={styles.payment_info}>
                    <Wallet size={16} />
                    <p>Denna tjänst erbjuder <strong>ROT-avdrag</strong> – du betalar ca 70% av priset ({Math.round(price * 0.7)} kr) efter skattereduktion. Max 50 000 kr/år.</p>
                  </div>
                )}
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

            {/* Typ 1 – Datum & plats */}
            {STEPS[step] === 'Datum & plats' && (
              <div className={styles.fields}>
                <p className={styles.hint}>När och var ska tjänsten utföras?</p>
                <div className={styles.field}>
                  <label className={styles.label}>Önskat datum <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setPreferredDate(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Önskad tid</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Adress <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    placeholder="Gatuadress, stad"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Typ 2 – Tidslinje */}
            {STEPS[step] === 'Tidslinje' && (
              <div className={styles.fields}>
                <p className={styles.hint}>Berätta om din tidsram och hur du vill dela upp projektet.</p>
                <div className={styles.field}>
                  <label className={styles.label}>Önskat slutdatum</label>
                  <input
                    className={styles.input}
                    type="date"
                    value={desiredDeadline}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setDesiredDeadline(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Föreslagna milstolpar <span className={styles.optional}>(valfritt)</span></label>
                  <textarea
                    className={styles.textarea}
                    placeholder={`T.ex:\n1. Utkast och koncept – vecka 1\n2. Första version – vecka 2\n3. Slutleverans – vecka 3`}
                    value={milestones}
                    onChange={e => setMilestones(e.target.value)}
                    rows={4}
                  />
                  <span className={styles.hint}>Utföraren kan justera och godkänna milstolparna när beställningen accepteras.</span>
                </div>
              </div>
            )}

            {/* Typ 3 – Upphämtning & leverans */}
            {STEPS[step] === 'Upphämtning & leverans' && (
              <div className={styles.fields}>
                <p className={styles.hint}>Var ska upphämtning ske och vart ska det levereras?</p>
                <div className={styles.field}>
                  <label className={styles.label}>Upphämtningsadress <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    placeholder="Gatuadress, stad"
                    value={pickupAddress}
                    onChange={e => setPickupAddress(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Leveransadress <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    placeholder="Gatuadress, stad"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Datum <span className={styles.required}>*</span></label>
                  <input
                    className={styles.input}
                    type="date"
                    value={pickupDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setPickupDate(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Tid</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={pickupTime}
                    onChange={e => setPickupTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Underkategori-frågor */}
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

            {/* Utförarens egna frågor */}
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
                    ...(serviceType === 'typ1' && preferredDate ? [{ label: 'Datum', value: preferredDate }] : []),
                    ...(serviceType === 'typ1' && address ? [{ label: 'Adress', value: address }] : []),
                    ...(serviceType === 'typ2' && desiredDeadline ? [{ label: 'Slutdatum', value: desiredDeadline }] : []),
                    ...(serviceType === 'typ3' && pickupAddress ? [{ label: 'Upphämtning', value: pickupAddress }] : []),
                    ...(serviceType === 'typ3' && deliveryAddress ? [{ label: 'Leverans', value: deliveryAddress }] : []),
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

                <div className={styles.payment_info}>
                  <Lightbulb size={16} />
                  <p>Betalning sker direkt mellan dig och utföraren. Ni bestämmer upplägget själva – Svippo är inte part i transaktionen.</p>
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