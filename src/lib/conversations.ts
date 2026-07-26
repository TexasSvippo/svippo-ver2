import { supabase } from '@/lib/supabase'

export type Conversation = {
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
  otherPartyName: string
  otherPartyAvatar: string | null
  orderTitle: string
  unreadCount: number
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: convs } = await supabase
    .from('conversations')
    .select('*')
    .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (!convs || convs.length === 0) return []

  const enriched = await Promise.all(
    convs.map(async (conv) => {
      const otherPartyId =
        conv.participant_1_id === userId
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
        .not('read_by', 'cs', `{${userId}}`)

      return {
        ...conv,
        otherPartyName: otherUser?.name ?? 'Okänd',
        otherPartyAvatar: otherUser?.avatar_url ?? null,
        orderTitle,
        unreadCount: count ?? 0,
      }
    })
  )

  return enriched
}

export function formatConversationTime(timestamp: string | null): string {
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
