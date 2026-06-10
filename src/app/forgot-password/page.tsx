'use client'

import Link from 'next/link'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import authStyles from '@/styles/auth.module.scss'
import styles from './forgot-password.module.scss'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError('Något gick fel. Försök igen.')
      setLoading(false)
      return
    }

    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className={styles.page}>

      {/* Left column */}
      <div className={styles.left}>
        <div className={styles.card}>
          <h1 className={styles.title}>Glömt lösenord?</h1>
          <p className={styles.subtitle}>Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.</p>

          {submitted ? (
            <div className={styles.success_box}>
              Om e-postadressen finns registrerad skickar vi en återställningslänk inom några minuter.
            </div>
          ) : (
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

              {error && <div className={authStyles.auth__error_box}>{error}</div>}

              <button
                type="submit"
                className={styles.submit_btn}
                disabled={loading}
              >
                {loading ? 'Skickar...' : 'Skicka återställningslänk'}
              </button>

            </form>
          )}

          <Link href="/login" className={styles.back_link}>
            Tillbaka till inloggning
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
