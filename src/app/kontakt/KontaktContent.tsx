'use client'

import { Clock, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import styles from './kontakt.module.scss'

const infoCards = [
  {
    icon: Clock,
    title: 'Svarstid',
    text: 'Vi svarar inom 5 arbetsdagar på alla ärenden.',
  },
  {
    icon: Mail,
    title: 'E-post',
    text: 'kontakt@svippo.se',
  },
  {
    icon: Phone,
    title: 'Telefon',
    text: '020-105 707, mån–fre 09–17',
  },
]

const subjectOptions = [
  'Support',
  'Samarbete',
  'Press & media',
  'Rapportera missbruk',
  'Övriga frågor',
]

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function KontaktContent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return

    setStatus('sending')

    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })

      if (!res.ok) throw new Error('Request failed')

      setStatus('success')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      console.error('Kontaktformulär error:', err)
      setStatus('error')
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.hero__inner}>
          <h1 className={styles.hero__title}>Kontakta oss</h1>
          <p className={styles.hero__subtext}>Vi svarar på alla ärenden inom 5 arbetsdagar.</p>
        </div>
      </section>

      {/* Content */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Left: contact info */}
            <div className={styles.info}>
              <div className={styles.info__block}>
                <p className={styles.info__row}><strong>Öppettider:</strong> Måndag–fredag 09–17</p>
                <p className={styles.info__row}><strong>Telefon:</strong> 020-105 707</p>
                <p className={styles.info__row}><strong>E-post:</strong> kontakt@svippo.se</p>
                <p className={styles.info__note}>För snabbast svar, välj rätt ämne i formuläret.</p>
              </div>

              <div className={styles.info_cards}>
                {infoCards.map(card => {
                  const Icon = card.icon
                  return (
                    <div key={card.title} className={styles.info_card}>
                      <Icon size={20} className={styles.info_card__icon} />
                      <div>
                        <h3 className={styles.info_card__title}>{card.title}</h3>
                        <p className={styles.info_card__text}>{card.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: form */}
            <div className={`${styles.form_card} staticcard`}>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="name">Namn</label>
                  <input
                    id="name"
                    type="text"
                    className={styles.input}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">E-postadress</label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="subject">Ämne</label>
                  <select
                    id="subject"
                    className={styles.input}
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  >
                    <option value="">Välj ämne...</option>
                    {subjectOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="message">Meddelande</label>
                  <textarea
                    id="message"
                    className={styles.textarea}
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className={styles.submit} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Skickar...' : 'Skicka meddelande'}
                </button>

                {status === 'success' && (
                  <p className={styles.status_success}>Tack! Vi återkommer inom 5 arbetsdagar.</p>
                )}
                {status === 'error' && (
                  <p className={styles.status_error}>Något gick fel. Försök igen eller maila oss direkt på kontakt@svippo.se.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
