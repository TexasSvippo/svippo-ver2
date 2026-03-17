'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import styles from '@/styles/auth.module.scss'

type AccountType = 'privatperson' | 'foretag' | 'uf-foretag'

export default function RegisterPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>('privatperson')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken.')
      setLoading(false)
      return
    }

    // Skapa användare i Supabase Auth
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

    // Spara profil i users-tabellen
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        name,
        email,
        phone,
        account_type: accountType,
        created_at: new Date().toISOString(),
      })
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className={styles.auth}>
      <div className={styles.auth__card}>

        <div className={styles.auth__header}>
          <h1 className={styles.auth__title}>Skapa konto</h1>
          <p className={styles.auth__subtitle}>Välj vilken typ av konto du vill skapa</p>
        </div>

        {/* Kontotyp */}
        <div className={styles.auth__account_types}>
          {[
            { type: 'privatperson', icon: '👤', label: 'Privatperson' },
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

        {/* Formulär */}
        <form onSubmit={handleSubmit} className={styles.auth__form}>

          <div className={styles.auth__field}>
            <label className={styles.auth__label}>Namn</label>
            <input
              className={styles.auth__input}
              placeholder="Ditt namn"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

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
            <label className={styles.auth__label}>Telefonnummer</label>
            <input
              className={styles.auth__input}
              placeholder="070-000 00 00"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>

          <div className={styles.auth__field}>
            <label className={styles.auth__label}>Lösenord</label>
            <input
              className={styles.auth__input}
              placeholder="Minst 6 tecken"
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
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>

        </form>

        <p className={styles.auth__switch}>
          Har du redan ett konto?{' '}
          <Link href="/logga-in" className={styles.auth__switch_link}>Logga in här</Link>
        </p>

      </div>
    </div>
  )
}