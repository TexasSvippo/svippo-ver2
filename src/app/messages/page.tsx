'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './meddelanden.module.scss'

type Conversation = {
  id: string
  type: string
  anchor_type: string
  anchor_id: string
  assignment_id: string | null
  participant_1_id: string
  participant_2_id: string
  last_message_at: string | null
  last_message_preview: string | null
  created_at: string
  // Berikad data
  otherPartyName?: string
  otherPartyAvatar?: string | null
  orderTitle?: string
  unreadCount?: number
}

export default function MeddelandenPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

    const fetchConversations = async () => {
    if (!user) return

    const { data: convs } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!convs || convs.length === 0) {
      setLoading(false)
      return
    }

    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const otherPartyId =
          conv.participant_1_id === user.id
            ? conv.participant_2_id
            : conv.participant_1_id

        const { data: otherUser } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', otherPartyId)
          .single()

        let orderTitle = ''
        if (conv.assignment_id) {
          const { data: order } = await supabase
            .from('orders')
            .select('service_title')
            .eq('id', conv.assignment_id)
            .single()
          orderTitle = order?.service_title ?? ''
        }

        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .not('read_by', 'cs', `{${user.id}}`)

        return {
          ...conv,
          otherPartyName: otherUser?.name ?? 'Okänd',
          otherPartyAvatar: otherUser?.avatar_url ?? null,
          orderTitle,
          unreadCount: count ?? 0,
        }
      })
    )

    setConversations(enriched)
    setLoading(false)
  }

  useEffect(() => {
    if (!user) return

    const init = async () => {
      // Om vi kom hit via en beställningssida – hitta eller skapa konversation
        if (orderId) {
        const { data: existingList } = await supabase
          .from('conversations')
          .select('id')
          .eq('assignment_id', orderId)
          .order('created_at', { ascending: true })
          .limit(1)

        if (existingList && existingList.length > 0) {
          router.replace(`/messages/${existingList[0].id}`)
          return
        }

        // Hämta order-info för att skapa konversation
        const { data: order } = await supabase
          .from('orders')
          .select('id, buyer_id, seller_id, buyer_name, seller_name')
          .eq('id', orderId)
          .single()

        if (order) {
          const otherPartyId = user.id === order.buyer_id ? order.seller_id : order.buyer_id

          const { data: newConv } = await supabase
            .from('conversations')
            .insert({
              type: 'assignment',
              anchor_type: 'order',
              anchor_id: orderId,
              assignment_id: orderId,
              participant_1_id: user.id,
              participant_2_id: otherPartyId,
              created_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (newConv) {
            router.replace(`/messages/${newConv.id}`)
            return
          }
        }
      }

      await fetchConversations()
    }

    init()
  }, [user, orderId])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Igår'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('sv-SE', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
    }
  }

  if (loading) return <div className={styles.loading}>Laddar meddelanden...</div>

  return (
    <div className={styles.inbox}>
      <div className={`container ${styles.inbox__inner}`}>
        <div className={styles.inbox__header}>
          <h1 className={styles.inbox__title} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={22} /> Meddelanden</h1>
        </div>

        {conversations.length === 0 ? (
          <div className={styles.inbox__empty}>
            <span className={styles.empty__icon}><MessageCircle size={48} /></span>
            <h2>Inga meddelanden än</h2>
            <p>Dina konversationer med Svippare och beställare visas här.</p>
            <Link href="/services" className="btn btn-primary">
              Utforska tjänster
            </Link>
          </div>
        ) : (
          <div className={styles.inbox__list}>
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className={`${styles.conv_row} ${conv.unreadCount && conv.unreadCount > 0 ? styles['conv_row--unread'] : ''}`}
              >
                <div className={styles.conv_avatar}>
                  {conv.otherPartyAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conv.otherPartyAvatar} alt={conv.otherPartyName} className={styles.conv_avatar__img} />
                  ) : (
                    <span>{conv.otherPartyName?.charAt(0).toUpperCase()}</span>
                  )}
                  {conv.unreadCount && conv.unreadCount > 0 ? (
                    <span className={styles.unread_dot}>{conv.unreadCount}</span>
                  ) : null}
                </div>

                <div className={styles.conv_info}>
                  <div className={styles.conv_top}>
                    <strong className={styles.conv_name}>{conv.otherPartyName}</strong>
                    <span className={styles.conv_time}>{formatTime(conv.last_message_at)}</span>
                  </div>
                  {conv.orderTitle && (
                    <span className={styles.conv_context} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Package size={14} /> {conv.orderTitle}</span>
                  )}
                  <p className={styles.conv_preview}>
                    {conv.last_message_preview ?? 'Ingen aktivitet än'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}