'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { ArrowRight } from 'lucide-react'
import authStyles from '@/styles/auth.module.scss'
import styles from './login.module.scss'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) router.replace('/profile')
  }, [user, authLoading])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

          <form onSubmit={handleSubmit} className={authStyles.auth__form}>

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

            <div className={authStyles.auth__field}>
              <label className={authStyles.auth__label}>Lösenord</label>
              <input
                className={authStyles.auth__input}
                placeholder="lösenord"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <Link href="/forgot-password" className={styles.forgot_link}>
              Har du glömt ditt lösenord?
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
