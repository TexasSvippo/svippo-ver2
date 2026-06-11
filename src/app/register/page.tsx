'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { User, Building2, GraduationCap, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import styles from './register.module.scss'

type AccountType = 'privatperson' | 'foretag' | 'uf'
type Direction = 'forward' | 'backward'
type CSSVars = React.CSSProperties & { [key: `--${string}`]: string }

const ACCOUNT_COLORS: Record<AccountType, string> = {
  privatperson: '#E85D46',
  foretag: '#1C0E3D',
  uf: '#AF1143',
}

const ACCOUNT_LABELS: Record<AccountType, string> = {
  privatperson: 'Privatperson',
  foretag: 'Företag',
  uf: 'UF-företag',
}

const ACCOUNT_TYPE_DB: Record<AccountType, string> = {
  privatperson: 'bestellare',
  foretag: 'foretag',
  uf: 'uf-foretag',
}

const SUCCESS_TEXT: Record<AccountType, string> = {
  privatperson: 'Ditt konto är skapat. Du kan nu börja hitta och anlita utförare på Svippo.',
  foretag: 'Ditt företagskonto är skapat. Du kan nu börja hitta och anlita utförare på Svippo.',
  uf: 'Ditt UF-konto är skapat. Du kan nu börja hitta och anlita utförare på Svippo.',
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) router.replace('/profile')
  }, [user, authLoading])

  const [step, setStep] = useState(1)
  const [prevStep, setPrevStep] = useState<number | null>(null)
  const [direction, setDirection] = useState<Direction>('forward')
  const [animating, setAnimating] = useState(false)

  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [flashType, setFlashType] = useState<AccountType | null>(null)
  const [hintVisible, setHintVisible] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [orgNumber, setOrgNumber] = useState('')
  const [city, setCity] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (step !== 4) return
    const timeout = window.setTimeout(() => {
      router.push('/profile')
      router.refresh()
    }, 2000)
    return () => window.clearTimeout(timeout)
  }, [step])

  const goTo = (next: number, dir: Direction) => {
    setDirection(dir)
    setPrevStep(step)
    setStep(next)
    setAnimating(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimating(false))
    })
    window.setTimeout(() => setPrevStep(null), 460)
  }

  const handleSelectType = (type: AccountType) => {
    setFlashType(type)
    setAccountType(type)
    window.setTimeout(() => {
      setFlashType(null)
      goTo(2, 'forward')
    }, 150)
  }

  const handleGoogleSignIn = async () => {
    if (!accountType) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?account_type=${ACCOUNT_TYPE_DB[accountType]}`,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountType) return
    setError('')

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.')
      return
    }

    if (!acceptedTerms) {
      setError('Du måste godkänna villkoren för att skapa ett konto.')
      return
    }

    setLoading(true)

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
      const dbAccountType = ACCOUNT_TYPE_DB[accountType]
      const name = accountType === 'privatperson' ? `${firstName} ${lastName}`.trim() : companyName

      const res = await fetch('/api/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          email,
          accountType: dbAccountType,
          name,
          city,
          orgNumber: accountType === 'foretag' ? orgNumber : undefined,
        }),
      })

      if (!res.ok) {
        setError('Något gick fel. Försök igen.')
        setLoading(false)
        return
      }

      await supabase.auth.updateUser({ data: { account_type: dbAccountType } })

      goTo(4, 'forward')
    }

    setLoading(false)
  }

  const getTransform = (stepNum: number): string => {
    if (stepNum === step) {
      if (prevStep === null) return 'translateY(0)'
      return animating
        ? (direction === 'forward' ? 'translateY(110%)' : 'translateY(-110%)')
        : 'translateY(0)'
    }
    if (stepNum === prevStep) {
      return animating
        ? 'translateY(0)'
        : (direction === 'forward' ? 'translateY(-110%)' : 'translateY(110%)')
    }
    return 'translateY(0)'
  }

  const renderStep1 = () => {
    const cards: { type: AccountType; icon: React.ReactNode; label: string; desc: string }[] = [
      { type: 'privatperson', icon: <User size={20} />, label: 'Privatperson', desc: 'Jag vill hitta och anlita utförare' },
      { type: 'foretag', icon: <Building2 size={20} />, label: 'Företag', desc: 'Vi är ett registrerat aktiebolag eller enskild firma' },
      { type: 'uf', icon: <GraduationCap size={20} />, label: 'UF-företag', desc: 'Vi är ett ungdomsföretag (UF)' },
    ]

    return (
      <div>
        <h1 className={styles.wizard__title}>Vem är du?</h1>
        <div className={styles.wizard__cards}>
          {cards.map(c => (
            <button
              key={c.type}
              type="button"
              className={`${styles.wizard__card} ${flashType === c.type ? styles['wizard__card--active'] : ''}`}
              style={{ '--card-color': ACCOUNT_COLORS[c.type] } as CSSVars}
              onClick={() => handleSelectType(c.type)}
              onMouseEnter={() => c.type === 'privatperson' && setHintVisible(true)}
              onMouseLeave={() => c.type === 'privatperson' && setHintVisible(false)}
            >
              <span className={styles.wizard__card_icon}>{c.icon}</span>
              <span className={styles.wizard__card_text}>
                <strong>{c.label}</strong>
                <span>{c.desc}</span>
              </span>
              <ChevronRight size={18} className={styles.wizard__card_chevron} />
            </button>
          ))}
        </div>
        <p className={`${styles.wizard__hint} ${hintVisible ? styles['wizard__hint--visible'] : ''}`}>
          Vill du även utföra uppdrag som privatperson? Det ansöker du om efter att du skapat ditt konto.
        </p>
      </div>
    )
  }

  const renderStep2 = () => {
    if (!accountType) return null
    const color = ACCOUNT_COLORS[accountType]

    const title =
      accountType === 'privatperson' ? 'Om dig' :
      accountType === 'foretag' ? 'Om ditt företag' :
      'Om ditt UF-företag'

    const valid = accountType === 'privatperson'
      ? firstName.trim() !== '' && lastName.trim() !== '' && city.trim() !== ''
      : accountType === 'foretag'
        ? companyName.trim() !== '' && orgNumber.trim() !== '' && city.trim() !== ''
        : companyName.trim() !== '' && city.trim() !== ''

    return (
      <div style={{ '--account-color': color } as CSSVars}>
        <button type="button" className={styles.wizard__back} onClick={() => goTo(1, 'backward')}>
          <ChevronLeft size={18} /> Tillbaka
        </button>
        <span className={styles.wizard__badge} style={{ background: hexToRgba(color, 0.12), color }}>
          {ACCOUNT_LABELS[accountType]}
        </span>
        <h1 className={styles.wizard__title}>{title}</h1>

        <div className={styles.wizard__fields}>
          {accountType === 'privatperson' ? (
            <>
              <div className={styles.wizard__field}>
                <label htmlFor="firstName">Förnamn</label>
                <input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Anna" />
              </div>
              <div className={styles.wizard__field}>
                <label htmlFor="lastName">Efternamn</label>
                <input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Lindgren" />
              </div>
            </>
          ) : (
            <>
              <div className={styles.wizard__field}>
                <label htmlFor="companyName">Företagsnamn</label>
                <input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={accountType === 'foretag' ? 'Svippo AB' : 'Mitt UF AB'} />
              </div>
              {accountType === 'foretag' && (
                <div className={styles.wizard__field}>
                  <label htmlFor="orgNumber">Organisationsnummer</label>
                  <input id="orgNumber" value={orgNumber} onChange={e => setOrgNumber(e.target.value)} placeholder="556123-4567" />
                </div>
              )}
            </>
          )}
          <div className={styles.wizard__field}>
            <label htmlFor="city">Stad</label>
            <input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Stockholm" />
          </div>
        </div>

        <button
          type="button"
          className={styles.wizard__cta}
          disabled={!valid}
          onClick={() => goTo(3, 'forward')}
        >
          Fortsätt
        </button>
      </div>
    )
  }

  const renderStep3 = () => {
    if (!accountType) return null
    const color = ACCOUNT_COLORS[accountType]

    return (
      <div style={{ '--account-color': color } as CSSVars}>
        <button type="button" className={styles.wizard__back} onClick={() => goTo(2, 'backward')}>
          <ChevronLeft size={18} /> Tillbaka
        </button>
        <span className={styles.wizard__badge} style={{ background: hexToRgba(color, 0.12), color }}>
          {ACCOUNT_LABELS[accountType]}
        </span>
        <h1 className={styles.wizard__title}>Skapa ditt konto</h1>
        <p className={styles.wizard__subtitle}>Välj hur du vill registrera dig.</p>

        <button type="button" className={styles.wizard__google} onClick={handleGoogleSignIn}>
          <GoogleIcon /> Fortsätt med Google
        </button>

        <div className={styles.wizard__divider}>eller med e-post</div>

        <form onSubmit={handleSubmit}>
          <div className={styles.wizard__fields}>
            <div className={styles.wizard__field}>
              <label htmlFor="email">E-post</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className={styles.wizard__field}>
              <label htmlFor="password">Lösenord</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
          </div>

          <div className={styles.wizard__checkbox_field}>
            <input
              id="accept-terms"
              type="checkbox"
              className={styles.wizard__checkbox}
              checked={acceptedTerms}
              onChange={e => setAcceptedTerms(e.target.checked)}
            />
            <label htmlFor="accept-terms" className={styles.wizard__checkbox_label}>
              Jag har läst och godkänner Svippos{' '}
              <Link href="/villkor" target="_blank" rel="noopener noreferrer">allmänna villkor</Link>
            </label>
          </div>

          {error && <div className={styles.wizard__error}>{error}</div>}

          <button type="submit" className={styles.wizard__cta} disabled={loading}>
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>
        </form>
      </div>
    )
  }

  const renderStep4 = () => {
    if (!accountType) return null
    const color = ACCOUNT_COLORS[accountType]

    return (
      <div className={styles.wizard__success}>
        <div className={styles.wizard__success_icon} style={{ background: hexToRgba(color, 0.12) }}>
          <Check size={32} color={color} />
        </div>
        <h1 className={styles.wizard__success_title}>Välkommen till Svippo!</h1>
        <p className={styles.wizard__success_text}>{SUCCESS_TEXT[accountType]}</p>
      </div>
    )
  }

  const renderStep = (n: number) => {
    switch (n) {
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      default: return null
    }
  }

  return (
    <div className={styles.wizard}>
      {step <= 3 && (
        <div className={styles.wizard__progress}>
          {[1, 2, 3].map(n => (
            <span
              key={n}
              className={`${styles.wizard__dot} ${n === step ? styles['wizard__dot--active'] : ''}`}
              style={n === step && accountType ? { background: ACCOUNT_COLORS[accountType] } : undefined}
            />
          ))}
        </div>
      )}

      <div className={styles.wizard__container}>
        <div className={styles.wizard__viewport}>
          {prevStep !== null ? (
            <>
              <div className={styles.wizard__step_abs} style={{ transform: getTransform(prevStep) }}>
                {renderStep(prevStep)}
              </div>
              <div className={styles.wizard__step_abs} style={{ transform: getTransform(step) }}>
                {renderStep(step)}
              </div>
            </>
          ) : (
            <div className={styles.wizard__step}>{renderStep(step)}</div>
          )}
        </div>
      </div>
    </div>
  )
}
