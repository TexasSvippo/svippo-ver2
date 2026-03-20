'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { categories } from '@/data/categories'
import styles from '@/styles/auth.module.scss'
import modalStyles from './register.module.scss'

type AccountType = 'privatperson' | 'foretag' | 'uf-foretag'
type Step = 'register' | 'svippare-popup' | 'svippare-form'

export default function RegisterPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>('privatperson')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('register')
  const [userId, setUserId] = useState<string | null>(null)

  // Svippare-ansökan
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [svippareLocation, setSvippareLocation] = useState('')
  const [svippareBio, setSvippareBio] = useState('')
  const [svippareExperience, setSvippareExperience] = useState('')
  const [svippareSaving, setSvippareSaving] = useState(false)

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
        account_type: accountType,
        is_approved: isApproved,
        created_at: new Date().toISOString(),
      })

      setUserId(data.user.id)

      if (accountType === 'privatperson') {
        setStep('svippare-popup')
      } else {
        router.push('/profil')
        router.refresh()
      }
    }

    setLoading(false)
  }

  const handleSkipSvippare = () => {
    router.push('/profil')
    router.refresh()
  }

  const handleSvippareSubmit = async () => {
    if (!userId) return
    if (selectedCategories.length === 0 || !svippareLocation || !svippareBio) return

    setSvippareSaving(true)

    await supabase.from('svippare_profiles').insert({
      user_id: userId,
      status: 'pending',
      categories: selectedCategories,
      location: svippareLocation,
      bio: svippareBio,
      experience: svippareExperience,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    await supabase.from('users').update({
      account_type: 'svippare',
    }).eq('id', userId)

    setSvippareSaving(false)
    router.push('/profil?svippare=pending')
    router.refresh()
  }

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev =>
      prev.includes(catId)
        ? prev.filter(c => c !== catId)
        : [...prev, catId]
    )
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

          {accountType === 'privatperson' && (
            <div className={modalStyles.info_box}>
              👤 Som privatperson kan du beställa tjänster direkt. Vill du även utföra tjänster kan du ansöka om att bli Svippare efter registreringen.
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
            <div className={styles.auth__field}>
              <label className={styles.auth__label}>Namn</label>
              <input className={styles.auth__input} placeholder="Ditt namn" value={name} onChange={e => setName(e.target.value)} required />
            </div>
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
            <Link href="/logga-in" className={styles.auth__switch_link}>Logga in här</Link>
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
          <h2 className={modalStyles.popup__title}>Välkommen till Svippo, {name}!</h2>
          <p className={modalStyles.popup__text}>
            Ditt konto är skapat. Vill du även utföra tjänster och tjäna pengar på Svippo?
          </p>

          <div className={modalStyles.popup__info}>
            <strong>Som Svippare kan du:</strong>
            <ul>
              <li>✅ Ta emot beställningar från kunder</li>
              <li>✅ Synas i vår tjänstekatalog</li>
              <li>✅ Tjäna pengar på dina kunskaper</li>
            </ul>
            <p className={modalStyles.popup__disclaimer}>
              💡 Svippo är en marknadsplats – betalning sker direkt mellan dig och kunden utanför plattformen. Som privatperson rekommenderar vi att du använder en faktureringstjänst utan eget företag.
            </p>
          </div>

          <div className={modalStyles.popup__actions}>
            <button className="btn btn-primary" onClick={() => setStep('svippare-form')} style={{ flex: 1, justifyContent: 'center' }}>
              🚀 Ansök om att bli Svippare
            </button>
            <button className="btn btn-outline" onClick={handleSkipSvippare} style={{ flex: 1, justifyContent: 'center' }}>
              Jag vill bara beställa
            </button>
          </div>
        </div>
      </div>
    )
  }

  // STEG 3 – Svippare-ansökningsformulär
  if (step === 'svippare-form') {
    return (
      <div className={modalStyles.overlay}>
        <div className={`${modalStyles.popup} ${modalStyles.popup__large}`}>

          <div className={modalStyles.form__header}>
            <button className={modalStyles.form__back} onClick={() => setStep('svippare-popup')}>← Tillbaka</button>
            <h2 className={modalStyles.popup__title}>Ansök om att bli Svippare</h2>
            <p className={modalStyles.popup__text}>Fyll i din profil så granskar vi din ansökan.</p>
          </div>

          <div className={modalStyles.form__fields}>

            <div className={modalStyles.form__field}>
              <label className={modalStyles.form__label}>
                Vilka kategorier vill du fokusera på? <span className={modalStyles.required}>*</span>
              </label>
              <p className={modalStyles.form__hint}>Välj en eller flera kategorier du erbjuder tjänster inom.</p>
              <div className={modalStyles.category_grid}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${modalStyles.category_btn} ${selectedCategories.includes(cat.id) ? modalStyles['category_btn--active'] : ''}`}
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    {selectedCategories.includes(cat.id) && <span className={modalStyles.category_check}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className={modalStyles.form__field}>
              <label className={modalStyles.form__label}>
                Var befinner du dig? <span className={modalStyles.required}>*</span>
              </label>
              <input className={modalStyles.form__input} placeholder="T.ex. Stockholm, Göteborg, Umeå..." value={svippareLocation} onChange={e => setSvippareLocation(e.target.value)} />
            </div>

            <div className={modalStyles.form__field}>
              <label className={modalStyles.form__label}>
                Beskriv dig själv <span className={modalStyles.required}>*</span>
              </label>
              <textarea className={modalStyles.form__textarea} placeholder="Berätta kort om dig själv och vad du kan hjälpa till med..." value={svippareBio} onChange={e => setSvippareBio(e.target.value)} rows={4} />
            </div>

            <div className={modalStyles.form__field}>
              <label className={modalStyles.form__label}>Erfarenhet (valfritt)</label>
              <textarea className={modalStyles.form__textarea} placeholder="Beskriv din erfarenhet, utbildning eller tidigare uppdrag..." value={svippareExperience} onChange={e => setSvippareExperience(e.target.value)} rows={3} />
            </div>

            <div className={modalStyles.payment_info}>
              <span>💡</span>
              <p>
                Svippo är en marknadsplats – betalning sker direkt mellan dig och kunden utanför plattformen.
                Som privatperson rekommenderar vi att du använder en <strong>faktureringstjänst utan eget företag</strong> för att ta betalt och redovisa dina inkomster korrekt.
              </p>
            </div>

          </div>

          <div className={modalStyles.form__actions}>
            <button className="btn btn-outline" onClick={handleSkipSvippare}>Hoppa över</button>
            <button
              className="btn btn-primary"
              onClick={handleSvippareSubmit}
              disabled={svippareSaving || selectedCategories.length === 0 || !svippareLocation || !svippareBio}
            >
              {svippareSaving ? 'Skickar...' : '🚀 Skicka ansökan'}
            </button>
          </div>

        </div>
      </div>
    )
  }

  return null
}