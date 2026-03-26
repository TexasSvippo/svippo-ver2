'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from '@/styles/auth.module.scss'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) router.replace('/profil')
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
    <div className={styles.auth}>
      <div className={styles.auth__card}>

        <div className={styles.auth__header}>
          <h1 className={styles.auth__title}>Logga in</h1>
          <p className={styles.auth__subtitle}>Välkommen tillbaka!</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.auth__form}>

          <div className={styles.auth__field}>
            <label className={styles.auth__label}>E-post</label>
            <input
              className={styles.auth__input}
              placeholder="din@email.se"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.auth__field}>
            <label className={styles.auth__label}>Lösenord</label>
            <input
              className={styles.auth__input}
              placeholder="Ditt lösenord"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.auth__error_box}>{error}</div>}

          <button
            type="submit"
            className={`btn btn-primary ${styles.auth__submit}`}
            disabled={loading}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>

        </form>

        <p className={styles.auth__switch}>
          Inget konto?{' '}
          <Link href="/registrera" className={styles.auth__switch_link}>Skapa ett här</Link>
        </p>

      </div>
    </div>
  )
}