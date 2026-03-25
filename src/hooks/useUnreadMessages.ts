'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from './useAuth'

export function useUnreadMessages() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = useCallback(async () => {
    if (!user) return

    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)

    if (!convs || convs.length === 0) {
      setUnreadCount(0)
      return
    }

    const convIds = convs.map(c => c.id)

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .not('read_by', 'cs', `{${user.id}}`)
      .neq('sender_id', user.id)

    setUnreadCount(count ?? 0)
  }, [user])

  useEffect(() => {
    if (!user) return
    const run = async () => { await fetchUnread() }
    run()
  }, [fetchUnread])

  // Realtid – lyssna på nya meddelanden
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new
        if (msg.sender_id !== user.id && !msg.read_by?.includes(user.id)) {
          setUnreadCount(prev => prev + 1)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, async () => {
        await fetchUnread()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchUnread])

  return { unreadCount }
}