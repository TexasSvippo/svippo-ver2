'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import authStyles from '@/styles/auth.module.scss'
import styles from './reset-password.module.scss'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [validSession, setValidSession] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidSession(true)
      } else if (event === 'INITIAL_SESSION') {
        setValidSession(!!session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => router.push('/login'), 2000)
    return () => clearTimeout(timer)
  }, [success, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.')
      return
    }
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Något gick fel. Försök igen.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className={styles.page}>

      {/* Left column */}
      <div className={styles.left}>
        <div className={styles.card}>
          <h1 className={styles.title}>Återställ lösenord</h1>

          {validSession === null && (
            <p className={styles.subtitle}>Verifierar länk...</p>
          )}

          {validSession === false && (
            <>
              <p className={styles.subtitle}>Länken har gått ut eller är ogiltig.</p>
              <Link href="/forgot-password" className={styles.back_link}>
                Begär en ny återställningslänk
              </Link>
            </>
          )}

          {validSession === true && !success && (
            <>
              <p className={styles.subtitle}>Ange ditt nya lösenord nedan.</p>

              <form onSubmit={handleSubmit} className={authStyles.auth__form}>

                <div className={authStyles.auth__field}>
                  <label className={authStyles.auth__label}>Nytt lösenord</label>
                  <input
                    className={authStyles.auth__input}
                    placeholder="lösenord"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={authStyles.auth__field}>
                  <label className={authStyles.auth__label}>Bekräfta lösenord</label>
                  <input
                    className={authStyles.auth__input}
                    placeholder="lösenord"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {error && <div className={authStyles.auth__error_box}>{error}</div>}

                <button
                  type="submit"
                  className={styles.submit_btn}
                  disabled={loading}
                >
                  {loading ? 'Sparar...' : 'Spara nytt lösenord'}
                </button>

              </form>
            </>
          )}

          {success && (
            <div className={styles.success_box}>
              Ditt lösenord har uppdaterats! Du skickas till inloggningssidan...
            </div>
          )}
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
