'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import CreateModal from './CreateModal'
import SearchBar from './SearchBar'
import { useNotifications } from '@/hooks/useNotifications'
import styles from './Navbar.module.scss'
import Image from 'next/image'

export default function Navbar() {
  const { user, loading, avatarUrl } = useAuth()
  const { unreadCount } = useNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()


  // Stäng dropdown vid klick utanför
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.${styles.navbar__profile}`)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/')
  }

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navbar__inner}`}>

        <Link href="/" className={styles.navbar__logo}>
          <Image src="/logo.svg" alt="Svippo" width={100} height={36} priority />
        </Link>

        <div className={styles.navbar__links}>
          <Link href="/services" className={styles.navbar__link}>Tjänster</Link>
          <Link href="/requests" className={styles.navbar__link}>Förfrågningar</Link>
        </div>

        <SearchBar />

        <div className={styles.navbar__actions}>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/notifications" className={styles.navbar__notif_btn}>
                    🔔
                    {unreadCount > 0 && (
                      <span className={styles.navbar__notif_badge}>{unreadCount}</span>
                    )}
                  </Link>

                  <button
                    className={`btn btn-orange ${styles.navbar__create_btn}`}
                    onClick={() => setShowCreate(true)}
                  >
                    Skapa inlägg
                  </button>

                  <div className={styles.navbar__profile}>
                    <button
                      className={styles.navbar__avatar}
                      onClick={() => setMenuOpen(!menuOpen)}
                    >
                      {avatarUrl
                        ? <Image src={avatarUrl} alt="Profil" width={40} height={40} className={styles.navbar__avatar_img} />
                        : <span>{user.email?.charAt(0).toUpperCase()}</span>
                      }
                    </button>

                    {menuOpen && (
                      <div className={styles.navbar__dropdown}>
                        <div className={styles.navbar__dropdown_email}>{user.email}</div>
                        <Link href="/profile" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          👤 Min profil
                        </Link>
                        <Link href="/services" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          🛠️ Tjänster
                        </Link>
                        <Link href="/requests" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          🙋 Förfrågningar
                        </Link>
                        <Link href="/bestallningar" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          📦 Beställningar
                        </Link>
                        <Link href="/messages" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          💬 Meddelanden
                        </Link>
                        <Link
                          href="/notifications"
                          className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_mobile_only}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          🔔 Notifikationer
                          {unreadCount > 0 && (
                            <span className={styles.navbar__nav_badge}>{unreadCount}</span>
                          )}
                        </Link>
                        <button
                          className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_create}`}
                          onClick={() => { setMenuOpen(false); setShowCreate(true) }}
                        >
                          ✏️ Skapa inlägg
                        </button>
                        <button
                          className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_signout}`}
                          onClick={handleSignOut}
                        >
                          🚪 Logga ut
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.navbar__link}>Logga in</Link>
                  <Link href="/register" className="btn btn-orange">Skapa konto</Link>
                </>
              )}
            </>
          )}
        </div>

      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </nav>
  )
}
