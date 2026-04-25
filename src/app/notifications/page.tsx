'use client'

import { useEffect, useState } from 'react'
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
                <span className={styles.notif_icon}>{getIcon(notif.type)}</span>
                <div className={styles.notif_content}>
                  <p className={styles.notif_message}>{notif.message}</p>
                  <span className={styles.notif_date}>
                    {new Date(notif.created_at).toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className={styles.notif_actions}>
                  {getActionBtn(notif, markAsRead)}
                  <button
                    className={styles.dismiss_btn}
                    onClick={() => dismiss(notif.id)}
                    title="Stäng"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}