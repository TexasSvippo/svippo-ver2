'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/auth.module.scss'
import modalStyles from './register.module.scss'
import useAuth from '@/hooks/useAuth'
import { User, CheckCircle, Lightbulb } from 'lucide-react'

type AccountType = 'privatperson' | 'foretag' | 'uf-foretag'
type Step = 'register' | 'svippare-popup'

export default function RegisterPage() {
  const router = useRouter()
const { user, loading: authLoading } = useAuth()
const [accountType, setAccountType] = useState<AccountType>('privatperson')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!authLoading && user) router.replace('/profile')
  }, [user, authLoading])

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('register')

  // Etiketter per kontotyp
  const nameLabel =
    accountType === 'foretag' ? 'Företagsnamn' :
    accountType === 'uf-foretag' ? 'UF-företagsnamn' :
    'Ditt namn'

  const namePlaceholder =
    accountType === 'foretag' ? 'Ert företagsnamn' :
    accountType === 'uf-foretag' ? 'Ert UF-företagsnamn' :
    'Ditt namn'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        setError('Den här e-postadressen används redan.')
      } else {
        setError('Något gick fel. Försök igen.')
      }
      setLoading(false)
      return
    }

    if (data.user) {
      const isApproved = accountType !== 'privatperson'

      await supabase.from('users').insert({
        id: data.user.id,
        name,
        email,
        phone,
        account_type: accountType === 'privatperson' ? 'bestellare' : accountType,
        is_approved: isApproved,
        created_at: new Date().toISOString(),
      })

      await supabase.auth.updateUser({
        data: {
          account_type: accountType === 'privatperson' ? 'bestellare' : accountType,
        }
      })

      // Skapa company_profiles-rad direkt vid registrering för företag och UF
      if (accountType === 'foretag' || accountType === 'uf-foretag') {
        await supabase.from('company_profiles').insert({
          user_id: data.user.id,
          // Org-nummer sparas endast för företag, inte UF
          org_number: accountType === 'foretag' ? orgNumber : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      if (accountType === 'privatperson') {
        setStep('svippare-popup')
      } else {
        router.push('/profile')
        router.refresh()
      }
    }

    setLoading(false)
  }

  const handleSkipSvippare = () => {
    router.push('/profile')
    router.refresh()
  }

  // STEG 1 – Registreringsformulär
  if (step === 'register') {
    return (
      <div className={styles.auth}>
        <div className={styles.auth__card}>

          <div className={styles.auth__header}>
            <h1 className={styles.auth__title}>Skapa konto</h1>
            <p className={styles.auth__subtitle}>Välj vilken typ av konto du vill skapa</p>
          </div>

          <div className={styles.auth__account_types}>
            {[
              { type: 'privatperson', icon: <User size={20} />, label: 'Privatperson' },
              { type: 'foretag', icon: '🏢', label: 'Företag' },
              { type: 'uf-foretag', icon: '🎓', label: 'UF-företag' },
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                className={`${styles.auth__type_btn} ${accountType === type ? styles['auth__type_btn--active'] : ''}`}
                onClick={() => setAccountType(type as AccountType)}
                type="button"
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {accountType === 'privatperson' && (
            <div className={modalStyles.info_box}>
              <User size={14} /> Som privatperson kan du beställa tjänster direkt. Vill du även utföra tjänster kan du ansöka om att bli Svippare efter registreringen.
            </div>
          )}
          {accountType === 'foretag' && (
            <div className={modalStyles.info_box}>
              🏢 Som företag kan du direkt både beställa och utföra tjänster på Svippo.
            </div>
          )}
          {accountType === 'uf-foretag' && (
            <div className={modalStyles.info_box}>
              🎓 Som UF-företag kan du direkt både beställa och utföra tjänster på Svippo.
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.auth__form}>

            {/* Namn – etikett ändras per kontotyp */}
            <div className={styles.auth__field}>
              <label className={styles.auth__label}>{nameLabel}</label>
              <input
                className={styles.auth__input}
                placeholder={namePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* Org-nummer – endast för företag */}
            {accountType === 'foretag' && (
              <div className={styles.auth__field}>
                <label className={styles.auth__label}>Organisationsnummer</label>
                <input
                  className={styles.auth__input}
                  placeholder="556123-4567"
                  value={orgNumber}
                  onChange={e => setOrgNumber(e.target.value)}
                  required
                />
              </div>
            )}

            <div className={styles.auth__field}>
              <label className={styles.auth__label}>E-post</label>
              <input className={styles.auth__input} placeholder="din@email.se" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className={styles.auth__field}>
              <label className={styles.auth__label}>Telefonnummer</label>
              <input className={styles.auth__input} placeholder="070-000 00 00" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className={styles.auth__field}>
              <label className={styles.auth__label}>Lösenord</label>
              <input className={styles.auth__input} placeholder="Minst 6 tecken" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && <div className={styles.auth__error_box}>{error}</div>}

            <button type="submit" className={`btn btn-primary ${styles.auth__submit}`} disabled={loading}>
              {loading ? 'Skapar konto...' : 'Skapa konto'}
            </button>
          </form>

          <p className={styles.auth__switch}>
            Har du redan ett konto?{' '}
            <Link href="/login" className={styles.auth__switch_link}>Logga in här</Link>
          </p>

        </div>
      </div>
    )
  }

  // STEG 2 – Popup: Vill du bli Svippare?
  if (step === 'svippare-popup') {
    return (
      <div className={modalStyles.overlay}>
        <div className={modalStyles.popup}>
          <div className={modalStyles.popup__emoji}>🎉</div>
          <h2 className={modalStyles.popup__title}>Välkommen till Svippo!</h2>
          <p className={modalStyles.popup__text}>
            Ditt konto är skapat. Vill du även utföra tjänster och tjäna pengar på Svippo?
          </p>

          <div className={modalStyles.popup__info}>
            <strong>Som Svippare kan du:</strong>
            <ul>
              <li><CheckCircle size={14} /> Ta emot beställningar från kunder</li>
              <li><CheckCircle size={14} /> Synas i vår tjänstekatalog</li>
              <li><CheckCircle size={14} /> Tjäna pengar på dina kunskaper</li>
            </ul>
            <p className={modalStyles.popup__disclaimer}>
              <Lightbulb size={14} /> Svippo är en marknadsplats – betalning sker direkt mellan dig och kunden utanför plattformen.
            </p>
          </div>

          <div className={modalStyles.popup__actions}>
            <button
              className="btn btn-primary"
              onClick={() => router.push('/become-svippare')}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              🚀 Ansök om att bli Svippare
            </button>
            <button
              className="btn btn-outline"
              onClick={handleSkipSvippare}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Jag vill bara beställa
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}