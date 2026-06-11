'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import authStyles from '@/styles/auth.module.scss'
import styles from './login.module.scss'

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

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) router.replace('/profile')
  }, [user, authLoading])

  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?account_type=bestellare`,
      },
    })
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Ange din e-postadress.')
      return
    }

    setStep(2)
  }

  const handleBack = () => {
    setError('')
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Fel e-post eller lösenord.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Du måste verifiera din e-postadress innan du kan logga in. Kolla din inkorg (och skräpposten).')
      } else {
        setError('Något gick fel. Försök igen.')
      }
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className={styles.page}>

      {/* Left column */}
      <div className={styles.left}>

        {/* Card 1 – Login form */}
        <div className={styles.card}>
          <h1 className={styles.title}>Logga in</h1>
          <p className={styles.subtitle}>Välkommen tillbaka! Logga in för att fortsätta svippa.</p>

          {step === 1 ? (
            <form onSubmit={handleContinue} className={authStyles.auth__form}>

              <button type="button" className={styles.google_btn} onClick={handleGoogleSignIn}>
                <GoogleIcon /> Fortsätt med Google
              </button>

              <div className={styles.divider}>eller</div>

              <div className={authStyles.auth__field}>
                <label className={authStyles.auth__label}>E-post</label>
                <input
                  className={authStyles.auth__input}
                  placeholder="din@email.com"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <div className={authStyles.auth__error_box}>{error}</div>}

              <button type="submit" className={styles.login_btn}>
                Fortsätt
              </button>

              <p className={authStyles.auth__switch}>
                Har du inget konto?{' '}
                <Link href="/register" className={authStyles.auth__switch_link}>Skapa ett här</Link>
              </p>

            </form>
          ) : (
            <form onSubmit={handleSubmit} className={authStyles.auth__form}>

              <button type="button" className={styles.email_chip} onClick={handleBack}>
                <ArrowLeft size={16} />
                <span>{email}</span>
              </button>

              <div className={authStyles.auth__field}>
                <label className={authStyles.auth__label}>Lösenord</label>
                <input
                  className={authStyles.auth__input}
                  placeholder="lösenord"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <Link href="/forgot-password" className={styles.forgot_link}>
                Glömt ditt lösenord?
              </Link>

              {error && <div className={authStyles.auth__error_box}>{error}</div>}

              <button
                type="submit"
                className={styles.login_btn}
                disabled={loading}
              >
                {loading ? 'Loggar in...' : 'Logga in'}
              </button>

            </form>
          )}
        </div>

        {/* Card 2 – Register CTA */}
        <div className={`${styles.card} ${styles.register_card}`}>
          <div className={styles.register_card_text}>
            <span className={styles.register_card_heading}>Har du inte ett konto?</span>
            <p className={styles.register_card_sub}>Skapa ett konto och börja svippa idag</p>
          </div>
          <Link href="/register" className={styles.register_card_btn} aria-label="Skapa konto">
            <ArrowRight size={18} />
          </Link>
        </div>

      </div>

      {/* Right column – illustration */}
      <div className={styles.right}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/login-svg.svg"
          alt="Svippo illustration"
          className={styles.illustration}
        />
      </div>

    </div>
  )
}
