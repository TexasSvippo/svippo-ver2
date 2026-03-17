'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from './useAuth'

export type NotificationType =
  | 'new_order'
  | 'order_accepted'
  | 'order_rejected'
  | 'project_completed'
  | 'project_update'
  | 'request_review'
  | 'new_interest'
  | 'new_review'
  | 'new_request_in_category'

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  order_id?: string
  service_title?: string
  message: string
  read: boolean
  dismissed: boolean
  email_sent: boolean
  action_url?: string
  actor_name?: string
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
    setNotifications(data ?? [])
    setUnreadCount(data?.filter(n => !n.read).length ?? 0)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Realtid via Supabase Realtime
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const dismiss = async (id: string) => {
    await supabase.from('notifications').update({ dismissed: true, read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnreadCount(prev => {
      const notif = notifications.find(n => n.id === id)
      return notif && !notif.read ? Math.max(0, prev - 1) : prev
    })
  }

  const dismissAll = async () => {
    if (!user) return
    await supabase.from('notifications').update({ dismissed: true, read: true }).eq('user_id', user.id)
    setNotifications([])
    setUnreadCount(0)
  }

  // Skapa en notifikation
  const createNotification = async (params: {
    userId: string
    type: NotificationType
    message: string
    actionUrl?: string
    actorName?: string
    orderId?: string
    serviceTitle?: string
  }) => {
    await supabase.from('notifications').insert({
      user_id: params.userId,
      type: params.type,
      message: params.message,
      action_url: params.actionUrl,
      actor_name: params.actorName,
      order_id: params.orderId,
      service_title: params.serviceTitle,
      read: false,
      dismissed: false,
      email_sent: false,
      created_at: new Date().toISOString(),
    })
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    createNotification,
    refetch: fetchNotifications,
  }
}