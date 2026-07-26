'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useAuth from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/hooks/useNotifications'
import styles from './notifications.module.scss'
import { Package, CheckCircle, XCircle, BarChart2, Wallet, Eye, Star, Bell } from 'lucide-react'
import type { ReactNode } from 'react'

const getIcon = (type: string): ReactNode => {
  const icons: Record<string, ReactNode> = {
    new_order: <Package size={18} />,
    order_accepted: <CheckCircle size={18} />,
    order_rejected: <XCircle size={18} />,
    project_completed: '🎉',
    project_update: <BarChart2 size={18} />,
    request_review: <Wallet size={18} />,
    new_interest: <Eye size={18} />,
    new_review: <Star size={18} />,
    new_request_in_category: <Bell size={18} />,
  }
  return icons[type] ?? <Bell size={18} />
}

// Färgkodning per notifikationstyp: blå = svippare/utförare-relaterat,
// orange = beställare-relaterat, grön = godkänt/avslutat (etablerad success-färg).
const NOTIF_COLORS: Record<string, { bg: string; color: string }> = {
  new_order:               { bg: '#e6f1fb', color: '#066696' },
  new_interest:            { bg: '#e6f1fb', color: '#066696' },
  project_completed:       { bg: '#e6f1fb', color: '#066696' },
  project_update:          { bg: '#e6f1fb', color: '#066696' },
  new_request_in_category: { bg: '#e6f1fb', color: '#066696' },
  order_accepted:          { bg: '#fff0eb', color: '#e8541a' },
  order_rejected:          { bg: '#fff0eb', color: '#e8541a' },
  price_proposal:          { bg: '#fff0eb', color: '#e8541a' },
  request_review:          { bg: '#fff0eb', color: '#e8541a' },
  price_approved:          { bg: '#e6f9f0', color: '#1a7a4a' },
  new_review:              { bg: '#e6f9f0', color: '#1a7a4a' },
}
const DEFAULT_NOTIF_COLOR = { bg: 'var(--color-gray-light)', color: 'var(--color-gray)' }
const getNotifColor = (type: string) => NOTIF_COLORS[type] ?? DEFAULT_NOTIF_COLOR

const getActionBtn = (notif: Notification, onRead: (id: string) => void) => {
  const actions: Record<string, { href: string; label: string; className: string }> = {
    project_completed: { href: `/my-order/${notif.order_id}`, label: 'Lämna recension', className: 'btn btn-primary' },
    request_review: { href: `/order/${notif.order_id}`, label: 'Ta betalt', className: 'btn btn-orange' },
    new_order: { href: `/order/${notif.order_id}`, label: 'Se beställning', className: 'btn btn-primary' },
    order_accepted: { href: `/my-order/${notif.order_id}`, label: 'Se beställning', className: 'btn btn-primary' },
    order_rejected: { href: `/my-order/${notif.order_id}`, label: 'Se beställning', className: 'btn btn-outline' },
    new_interest: { href: `/intresseanmalningar`, label: 'Se intresse', className: 'btn btn-orange' },
    new_review: { href: notif.action_url || '/profile', label: 'Se recension', className: 'btn btn-primary' },
    new_request_in_category: { href: notif.action_url || '/requests', label: 'Se förfrågan', className: 'btn btn-primary' },
  }

  const action = actions[notif.type]
  if (!action) return null

  return (
    <Link
      href={action.href}
      className={`${action.className} ${styles.action_btn}`}
      onClick={() => onRead(notif.id)}
    >
      {action.label}
    </Link>
  )
}

function NotificationMessage({ message }: { message: string }) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setClamped(el.scrollHeight > el.clientHeight + 1)
  }, [message])

  return (
    <>
      <p
        ref={ref}
        className={`${styles.notif_message} ${expanded ? styles['notif_message--expanded'] : ''}`}
      >
        {message}
      </p>
      {clamped && (
        <button type="button" className={styles.read_more_btn} onClick={() => setExpanded(e => !e)}>
          {expanded ? 'Läs mindre' : 'Läs mer'}
        </button>
      )}
    </>
  )
}

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismiss } = useNotifications()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user])

  if (loading) return <div className={styles.loading}>Laddar...</div>
  if (!user) return null

  const filtered = notifications.filter(n =>
    activeTab === 'unread' ? !n.read : n.read
  )

  return (
    <div className={styles.notifications}>
      <div className={`container ${styles.notifications__inner}`}>

        <div className={styles.notifications__header}>
          <div>
            <h1 className={styles.notifications__title}>Notifikationer</h1>
            <p className={styles.notifications__subtitle}>
              {unreadCount > 0 ? `${unreadCount} olästa notifikationer` : 'Inga olästa notifikationer'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline" onClick={markAllAsRead}>
              ✓ Markera alla som lästa
            </button>
          )}
        </div>

        {/* Tabbar */}
        <div className={styles.notifications__tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'unread' ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Olästa
            {unreadCount > 0 && <span className={styles.tab_badge}>{unreadCount}</span>}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'read' ? styles['tab--active'] : ''}`}
            onClick={() => setActiveTab('read')}
          >
            Lästa
          </button>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span>{activeTab === 'unread' ? '🎉' : '📭'}</span>
            <p>{activeTab === 'unread' ? 'Inga olästa notifikationer!' : 'Inga lästa notifikationer.'}</p>
          </div>
        ) : (
          <div className={styles.notifications__list}>
            {filtered.map(notif => (
              <div
                key={notif.id}
                className={`${styles.notif_item} card ${!notif.read ? styles['notif_item--unread'] : ''}`}
              >
                <span
                  className={styles.notif_icon}
                  style={{ background: getNotifColor(notif.type).bg, color: getNotifColor(notif.type).color }}
                >
                  {getIcon(notif.type)}
                </span>
                <div className={styles.notif_content}>
                  <NotificationMessage message={notif.message} />
                  <div className={styles.notif_bottom_row}>
                    <span className={styles.notif_date}>
                      {new Date(notif.created_at).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {getActionBtn(notif, markAsRead)}
                  </div>
                </div>
                <button
                  className={styles.dismiss_btn}
                  onClick={() => dismiss(notif.id)}
                  title="Stäng"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}