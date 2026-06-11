'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth, { type AccountType } from '@/hooks/useAuth'
import CreateModal from './CreateModal'
import MegaMenu from './MegaMenu'
import MegaMenuRequests from './MegaMenuRequests'
import SearchBar from './SearchBar'
import { useNotifications } from '@/hooks/useNotifications'
import { categories } from '@/data/categories'
import styles from './Navbar.module.scss'
import Image from 'next/image'
import {
  Bell, User, Wrench, Users, Package, MessageCircle, LogOut, ChevronDown, Menu, X,
  Laptop, Camera, Book, Home, Car, Heart, Hammer, Truck, Info, Mail,
  Eye, Send, Inbox, Star, Trophy, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'digitala-tjanster': Laptop,
  'medie-design': Camera,
  'utbildning': Book,
  'hushall': Home,
  'bil': Car,
  'skonhet-halsa': Heart,
  'bygg-hantverk': Hammer,
  'frakt-flytt': Truck,
}

type OverlayNavItem = { label: string; href: string; icon: LucideIcon }
type OverlayNavGroup = { label: string; items: OverlayNavItem[] }

function getOverlayNavGroups(accountType: AccountType | null): OverlayNavGroup[] {
  if (accountType === 'svippare') {
    return [
      {
        label: 'Tjänster', items: [
          { label: 'Mina tjänster', href: '/profile?tab=tjanster', icon: Wrench },
          { label: 'Mina bevakningar', href: '/profile?tab=bevakningar', icon: Bell },
          { label: 'Inkomna beställningar', href: '/profile?tab=inkomna', icon: Inbox },
        ]
      },
      {
        label: 'Meddelanden', items: [
          { label: 'Meddelanden', href: '/messages', icon: MessageCircle },
        ]
      },
      {
        label: 'Min profil', items: [
          { label: 'Recensioner & betyg', href: '/profile?tab=recensioner', icon: Star },
          { label: 'Min karriär', href: '/profile?tab=karriar', icon: Trophy },
          { label: 'Profilinställningar', href: '/profile?tab=installningar', icon: Settings },
        ]
      },
    ]
  }

  if (accountType === 'foretag' || accountType === 'uf-foretag') {
    return [
      {
        label: 'Tjänster', items: [
          { label: 'Mina tjänster', href: '/profile?tab=tjanster', icon: Wrench },
          { label: 'Mina bevakningar', href: '/profile?tab=bevakningar', icon: Bell },
          { label: 'Inkomna beställningar', href: '/profile?tab=inkomna', icon: Inbox },
        ]
      },
      {
        label: 'Förfrågningar', items: [
          { label: 'Placerade beställningar', href: '/profile?tab=placerade', icon: Send },
        ]
      },
      {
        label: 'Meddelanden', items: [
          { label: 'Meddelanden', href: '/messages', icon: MessageCircle },
        ]
      },
      {
        label: 'Min profil', items: [
          { label: 'Recensioner & betyg', href: '/profile?tab=recensioner', icon: Star },
          { label: 'Profilinställningar', href: '/profile?tab=installningar', icon: Settings },
        ]
      },
    ]
  }

  // bestellare (default)
  return [
    {
      label: 'Förfrågningar', items: [
        { label: 'Mina förfrågningar', href: '/profile?tab=forfragningar', icon: Users },
        { label: 'Intresseanmälningar', href: '/profile?tab=intresse', icon: Eye },
        { label: 'Placerade beställningar', href: '/profile?tab=placerade', icon: Send },
      ]
    },
    {
      label: 'Meddelanden', items: [
        { label: 'Meddelanden', href: '/messages', icon: MessageCircle },
      ]
    },
    {
      label: 'Min profil', items: [
        { label: 'Recensioner & betyg', href: '/profile?tab=recensioner', icon: Star },
        { label: 'Profilinställningar', href: '/profile?tab=installningar', icon: Settings },
      ]
    },
  ]
}

export default function Navbar() {
  const { user, loading, accountType, avatarUrl, name } = useAuth()
  const { unreadCount } = useNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [megaRequestsOpen, setMegaRequestsOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tjansterOpen, setTjansterOpen] = useState(false)
  const [forfragningarOpen, setForfragningarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

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

  // Stäng mobilmenyn vid byte av sida
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Lås body-scroll när mobilmenyn är öppen
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  // Stäng mobilmenyn med Escape
  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileMenuOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMenuOpen(false)
    setMobileMenuOpen(false)
    router.push('/')
  }

  const overlayNavGroups = getOverlayNavGroups(accountType)
  const showPublicProfileLink = accountType === 'svippare' || accountType === 'foretag' || accountType === 'uf-foretag'

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
                        : <span>{(name || user.email || '?').charAt(0).toUpperCase()}</span>
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

        {/* Mobil högersektion – notifikationer + pill (hamburgare + profilbild/Meny) */}
        <div className={styles.navbar__mobile_right}>
          {!loading && user && (
            <Link href="/notifications" className={styles.navbar__notif_btn}>
              <Bell size={22} />
              {unreadCount > 0 && <span className={styles.navbar__notif_badge}>{unreadCount}</span>}
            </Link>
          )}

          {!loading && user ? (
            <button
              type="button"
              className={styles.navbar__menu_pill}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label={mobileMenuOpen ? 'Stäng meny' : 'Öppna meny'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span className={styles.navbar__pill_avatar}>
                {avatarUrl
                  ? <Image src={avatarUrl} alt="Profil" width={32} height={32} className={styles.navbar__avatar_img} />
                  : <span className={styles.navbar__pill_initial}>{(name || user.email || '?').charAt(0).toUpperCase()}</span>
                }
              </span>
            </button>
          ) : (
            <button
              type="button"
              className={styles.navbar__menu_pill}
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label={mobileMenuOpen ? 'Stäng meny' : 'Öppna meny'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span>{mobileMenuOpen ? 'Stäng' : 'Meny'}</span>
            </button>
          )}
        </div>

      </div>

      <div className={styles.navbar__mobile_search_bar}>
        <SearchBar />
      </div>

      {megaOpen && <MegaMenu onClose={() => setMegaOpen(false)} />}
      {megaRequestsOpen && <MegaMenuRequests onClose={() => setMegaRequestsOpen(false)} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}

      {/* Mobil overlay-meny */}
      <div
        className={`${styles.navbar__overlay_backdrop} ${mobileMenuOpen ? styles['navbar__overlay_backdrop--open'] : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className={`${styles.navbar__overlay_panel} ${mobileMenuOpen ? styles['navbar__overlay_panel--open'] : ''}`}>
        <button
          type="button"
          className={styles.navbar__overlay_close}
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Stäng meny"
        >
          <X size={20} />
        </button>

        <div className={styles.navbar__overlay_body}>
          {!loading && user ? (
            <>
              <div className={styles.navbar__overlay_user}>
                <div className={`${styles.navbar__overlay_user_avatar} ${accountType === 'bestellare' ? styles['navbar__overlay_user_avatar--bestellare'] : ''}`}>
                  {avatarUrl
                    ? <Image src={avatarUrl} alt="Profil" width={40} height={40} className={styles.navbar__avatar_img} />
                    : <span>{(name || user.email || '?').charAt(0).toUpperCase()}</span>
                  }
                </div>
                <div className={styles.navbar__overlay_user_info}>
                  <span className={styles.navbar__overlay_user_name}>{name || user.email}</span>
                  <span className={styles.navbar__overlay_user_email}>{user.email}</span>
                  {showPublicProfileLink && (
                    <Link href={`/provider/${user.id}`} className={styles.navbar__overlay_user_link}>
                      Se publik profil →
                    </Link>
                  )}
                </div>
              </div>

              <div className={styles.navbar__overlay_divider} />

              {overlayNavGroups.map(group => (
                <div key={group.label}>
                  <div className={styles.navbar__overlay_group_label}>{group.label}</div>
                  {group.items.map(item => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={styles.navbar__overlay_item}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              ))}

              <div className={styles.navbar__overlay_divider} />

              <Link href="/om-oss" className={styles.navbar__overlay_item}>
                <Info size={18} />
                <span>Om oss</span>
              </Link>
              <Link href="/kontakt" className={styles.navbar__overlay_item}>
                <Mail size={18} />
                <span>Kontakt</span>
              </Link>
            </>
          ) : (
            <>
              <button type="button" className={styles.navbar__overlay_item} onClick={() => setTjansterOpen(o => !o)}>
                <Wrench size={18} />
                <span>Tjänster</span>
                <ChevronDown size={18} className={`${styles.navbar__overlay_chevron} ${tjansterOpen ? styles['navbar__overlay_chevron--open'] : ''}`} />
              </button>
              {tjansterOpen && (
                <div className={styles.navbar__overlay_subitems}>
                  {categories.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.id]
                    return (
                      <Link key={cat.id} href={`/services?category=${cat.id}`} className={styles.navbar__overlay_subitem}>
                        <Icon size={16} />
                        <span>{cat.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}

              <button type="button" className={styles.navbar__overlay_item} onClick={() => setForfragningarOpen(o => !o)}>
                <Users size={18} />
                <span>Förfrågningar</span>
                <ChevronDown size={18} className={`${styles.navbar__overlay_chevron} ${forfragningarOpen ? styles['navbar__overlay_chevron--open'] : ''}`} />
              </button>
              {forfragningarOpen && (
                <div className={styles.navbar__overlay_subitems}>
                  {categories.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.id]
                    return (
                      <Link key={cat.id} href={`/requests?category=${cat.id}`} className={styles.navbar__overlay_subitem}>
                        <Icon size={16} />
                        <span>{cat.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}

              <div className={styles.navbar__overlay_divider} />

              <Link href="/om-oss" className={styles.navbar__overlay_item}>
                <Info size={18} />
                <span>Om oss</span>
              </Link>
              <Link href="/kontakt" className={styles.navbar__overlay_item}>
                <Mail size={18} />
                <span>Kontakt</span>
              </Link>
            </>
          )}
        </div>

        <div className={styles.navbar__overlay_footer}>
          {!loading && user ? (
            <button type="button" className="btn btn-outline" onClick={handleSignOut}>
              <LogOut size={18} /> Logga ut
            </button>
          ) : (
            <>
              <Link href="/register" className="btn btn-orange">Skapa konto</Link>
              <Link href="/login" className="btn btn-outline">Logga in</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
