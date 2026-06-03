'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import CreateModal from './CreateModal'
import MegaMenu from './MegaMenu'
import MegaMenuRequests from './MegaMenuRequests'
import SearchBar from './SearchBar'
import { useNotifications } from '@/hooks/useNotifications'
import styles from './Navbar.module.scss'
import Image from 'next/image'
import { Bell, User, Wrench, Users, Package, MessageCircle, Pencil, LogOut, ChevronDown, Menu } from 'lucide-react'

export default function Navbar() {
  const { user, loading, avatarUrl } = useAuth()
  const { unreadCount } = useNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [megaRequestsOpen, setMegaRequestsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()

  // Stäng dropdowns vid klick utanför
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(`.${styles.navbar__profile}`)) {
        setMenuOpen(false)
      }
      if (!target.closest('[data-mega-trigger]') && !target.closest('[data-mega-menu]')) {
        setMegaOpen(false)
      }
      if (!target.closest('[data-mega-requests-trigger]') && !target.closest('[data-mega-menu-requests]')) {
        setMegaRequestsOpen(false)
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
          <div data-mega-trigger>
            <button
              className={`${styles.navbar__link} ${styles.navbar__mega_btn}`}
              onClick={() => { setMegaOpen(o => !o); setMegaRequestsOpen(false) }}
            >
              Tjänster
              <ChevronDown size={14} className={megaOpen ? styles['navbar__chevron--open'] : styles.navbar__chevron} />
            </button>
          </div>
          <div data-mega-requests-trigger>
            <button
              className={`${styles.navbar__link} ${styles.navbar__mega_btn}`}
              onClick={() => { setMegaRequestsOpen(o => !o); setMegaOpen(false) }}
            >
              Förfrågningar
              <ChevronDown size={14} className={megaRequestsOpen ? styles['navbar__chevron--open'] : styles.navbar__chevron} />
            </button>
          </div>
        </div>

        {/* Sökfält – wrappat för att kunna döljas på mobil */}
        <div className={styles.navbar__search}>
          <SearchBar />
        </div>

        {/* Desktop actions */}
        <div className={styles.navbar__actions}>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/notifications" className={styles.navbar__notif_btn}>
                    <Bell size={20} />
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
                          <User size={16} /> Min profil
                        </Link>
                        <Link href="/services" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          <Wrench size={16} /> Tjänster
                        </Link>
                        <Link href="/requests" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          <Users size={16} /> Förfrågningar
                        </Link>
                        <Link href="/bestallningar" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          <Package size={16} /> Beställningar
                        </Link>
                        <Link href="/messages" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                          <MessageCircle size={16} /> Meddelanden
                        </Link>
                        <Link
                          href="/notifications"
                          className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_mobile_only}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          <Bell size={16} /> Notifikationer
                          {unreadCount > 0 && (
                            <span className={styles.navbar__nav_badge}>{unreadCount}</span>
                          )}
                        </Link>
                        <button
                          className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_create}`}
                          onClick={() => { setMenuOpen(false); setShowCreate(true) }}
                        >
                          <Pencil size={16} /> Skapa inlägg
                        </button>
                        <button
                          className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_signout}`}
                          onClick={handleSignOut}
                        >
                          <LogOut size={16} /> Logga ut
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

        {/* Mobil högersektion – notifikationer + pill (hamburgare + profilbild) */}
        <div className={styles.navbar__mobile_right}>
          {!loading && user && (
            <Link href="/notifications" className={styles.navbar__notif_btn}>
              <Bell size={22} />
              {unreadCount > 0 && <span className={styles.navbar__notif_badge}>{unreadCount}</span>}
            </Link>
          )}

          {/* Pill: hamburgare + profilbild i gemensam kapsel */}
          <div className={styles.navbar__profile}>
            <button
              className={styles.navbar__menu_pill}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Öppna meny"
              aria-expanded={menuOpen}
            >
              <Menu size={18} />
              <span>Meny</span>
            </button>
            {menuOpen && (
              <div className={styles.navbar__dropdown}>
                {user && <div className={styles.navbar__dropdown_email}>{user.email}</div>}
                <Link href="/profile" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                  <User size={16} /> Min profil
                </Link>
                <Link href="/services" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                  <Wrench size={16} /> Tjänster
                </Link>
                <Link href="/requests" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                  <Users size={16} /> Förfrågningar
                </Link>
                <Link href="/bestallningar" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                  <Package size={16} /> Beställningar
                </Link>
                <Link href="/messages" className={styles.navbar__dropdown_item} onClick={() => setMenuOpen(false)}>
                  <MessageCircle size={16} /> Meddelanden
                </Link>
                {user && (
                  <>
                    <button
                      className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_create}`}
                      onClick={() => { setMenuOpen(false); setShowCreate(true) }}
                    >
                      <Pencil size={16} /> Skapa inlägg
                    </button>
                    <button
                      className={`${styles.navbar__dropdown_item} ${styles.navbar__dropdown_signout}`}
                      onClick={handleSignOut}
                    >
                      <LogOut size={16} /> Logga ut
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className={styles.navbar__mobile_search_bar}>
        <SearchBar />
      </div>

      {megaOpen && <MegaMenu onClose={() => setMegaOpen(false)} />}
      {megaRequestsOpen && <MegaMenuRequests onClose={() => setMegaRequestsOpen(false)} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </nav>
  )
}
