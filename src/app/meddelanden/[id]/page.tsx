'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './konversation.module.scss'

type Message = {
  id: string
  conversation_id: string
  sender_id: string | null
  type: 'text' | 'file' | 'system'
  content: string | null
  file_url: string | null
  read_by: string[]
  created_at: string
}

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
}

type Order = {
  id: string
  service_title: string
  status: string
  project_status: string
  service_type: string
  seller_id: string
  buyer_id: string
  seller_name: string
  buyer_name: string
  answers?: Record<string, string>
}

type Service = {
  id: string
  title: string
  price: number
  price_type: string
  location: string
  user_id: string
  user_name: string
  subcategory: string
}

export default function KonversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [order, setOrder] = useState<Order | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [otherPartyName, setOtherPartyName] = useState('')
  const [otherPartyAvatar, setOtherPartyAvatar] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const init = async () => {
      const { id } = await params

      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single()

      if (!conv) {
        router.push('/meddelanden')
        return
      }

      // Kolla att användaren är deltagare
      if (conv.participant_1_id !== user.id && conv.participant_2_id !== user.id) {
        router.push('/meddelanden')
        return
      }

      setConversation(conv)

      // Hämta motpartens info
      const otherPartyId = conv.participant_1_id === user.id ? conv.participant_2_id : conv.participant_1_id
      const { data: otherUser } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('id', otherPartyId)
        .single()
      setOtherPartyName(otherUser?.name ?? 'Okänd')
      setOtherPartyAvatar(otherUser?.avatar_url ?? null)

      // Hämta order-info om kopplad (Typ B)
      if (conv.assignment_id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id, service_title, status, project_status, service_type, seller_id, buyer_id, seller_name, buyer_name, answers')
          .eq('id', conv.assignment_id)
          .single()
        if (orderData) setOrder(orderData)
      }

      // Hämta tjänsteinfo om Typ A (ingen order ännu)
      if (!conv.assignment_id && conv.anchor_type === 'listing') {
        const { data: serviceData } = await supabase
          .from('services')
          .select('id, title, price, price_type, location, user_id, user_name, subcategory')
          .eq('id', conv.anchor_id)
          .single()
        if (serviceData) setService(serviceData)
      }

      // Hämta meddelanden
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
      setMessages(msgs ?? [])

      // Markera meddelanden som lästa
      if (msgs && msgs.length > 0) {
        const unread = msgs.filter(m => !m.read_by.includes(user.id))
        for (const msg of unread) {
          await supabase
            .from('messages')
            .update({ read_by: [...msg.read_by, user.id] })
            .eq('id', msg.id)
        }
      }

      setLoading(false)
    }
    init()
  }, [user])

  // Realtid
  useEffect(() => {
    if (!conversation) return

    const channel = supabase
      .channel(`conv:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Markera som läst direkt om det är från motparten
          if (newMsg.sender_id !== user?.id) {
            await supabase
              .from('messages')
              .update({ read_by: [...newMsg.read_by, user?.id] })
              .eq('id', newMsg.id)
          }
          scrollToBottom(true)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversation, user])

  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (isFirstLoad.current) {
      scrollToBottom(false)
      isFirstLoad.current = false
    } else {
      scrollToBottom(true)
    }
  }, [messages])

  const scrollToBottom = (smooth = false) => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = smooth
        ? messagesRef.current.scrollHeight
        : messagesRef.current.scrollHeight
      if (smooth) {
        messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })
      } else {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight
      }
    }
  }

  const handleSend = async () => {
    if (!user || !input.trim() || sending || !conversation) return
    setSending(true)

    try {
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        type: 'text',
        content: input.trim(),
        read_by: [user.id],
        created_at: new Date().toISOString(),
      })

      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: input.trim().slice(0, 100),
        })
        .eq('id', conversation.id)

      // Notis till motparten
      const otherPartyId = conversation.participant_1_id === user.id
        ? conversation.participant_2_id
        : conversation.participant_1_id

      const currentUserName = order
        ? (user.id === order.buyer_id ? order.buyer_name : order.seller_name)
        : 'En användare'

      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'new_message',
        order_id: order?.id ?? null,
        service_title: order?.service_title ?? '',
        actor_name: currentUserName,
        message: `${currentUserName}: ${input.trim().slice(0, 60)}${input.trim().length > 60 ? '...' : ''}`,
        action_url: `/meddelanden/${conversation.id}`,
        read: false,
        dismissed: false,
        email_sent: false,
        created_at: new Date().toISOString(),
      })

      setInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  const formatDate = (ts: string) =>
    new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })

  // Gruppera meddelanden per dag
  const groupedMessages = messages.reduce<{ date: string; msgs: Message[] }[]>((groups, msg) => {
    const date = formatDate(msg.created_at)
    const last = groups[groups.length - 1]
    if (last && last.date === date) {
      last.msgs.push(msg)
    } else {
      groups.push({ date, msgs: [msg] })
    }
    return groups
  }, [])

  const projectStatusLabel: Record<string, string> = {
    not_started: '⏳ Ej påbörjat',
    in_progress: '🔵 Pågår',
    almost_done: '🟡 Nästan klart',
    completed: '✅ Slutfört',
  }

  if (loading) return <div className={styles.loading}>Laddar konversation...</div>
  if (!conversation) return null

  const isBuyer = user?.id === order?.buyer_id
  const orderLink = order
    ? (isBuyer ? `/min-bestallning/${order.id}` : `/bestallning/${order.id}`)
    : null

  return (
    <div className={styles.page}>
      <div className={styles.page__inner}>

        {/* Vänster – chattfönstret */}
        <div className={styles.chat}>

          {/* Chattens header */}
          <div className={styles.chat__header}>
            <button className={styles.back_btn} onClick={() => router.push('/meddelanden')}>
              ← Tillbaka
            </button>
            <div className={styles.chat__party}>
              <div className={styles.chat__avatar}>
                {otherPartyAvatar
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={otherPartyAvatar} alt={otherPartyName} className={styles.chat__avatar_img} />
                  : <span>{otherPartyName.charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <strong className={styles.chat__name}>{otherPartyName}</strong>
                {order && (
                  <span className={styles.chat__context}>{order.service_title}</span>
                )}
              </div>
            </div>
          </div>

          {/* Meddelandeyta */}
          <div className={styles.chat__messages} ref={messagesRef}>
            {messages.length === 0 && (
              <div className={styles.chat__empty}>
                Inga meddelanden än. Skicka ett för att starta konversationen.
              </div>
            )}

            {groupedMessages.map(group => (
              <div key={group.date}>
                <div className={styles.date_divider}>{group.date}</div>
                {group.msgs.map(msg => {
                  const isOwn = msg.sender_id === user?.id
                  const isSystem = msg.type === 'system'

                  if (isSystem) {
                    return (
                      <div key={msg.id} className={styles.system_msg}>
                        {msg.content}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`${styles.msg} ${isOwn ? styles['msg--own'] : styles['msg--other']}`}
                    >
                      {!isOwn && (
                        <div className={styles.msg__avatar}>
                          {otherPartyAvatar
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={otherPartyAvatar} alt={otherPartyName} className={styles.msg__avatar_img} />
                            : <span>{otherPartyName.charAt(0).toUpperCase()}</span>
                          }
                        </div>
                      )}
                      <div className={styles.msg__content}>
                        <div className={styles.msg__bubble}>
                          {msg.type === 'file' && msg.file_url ? (
                            <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                              📎 Bifogad fil
                            </a>
                          ) : (
                            msg.content
                          )}
                        </div>
                        <span className={styles.msg__time}>{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Inputfält */}
          <div className={styles.chat__input_area}>
            <textarea
              className={styles.chat__input}
              placeholder="Skriv ett meddelande... (Enter för att skicka)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={sending}
            />
            <button
              className={styles.chat__send}
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending ? '...' : '➤'}
            </button>
          </div>
        </div>

        {/* Höger – kontextkort */}
        {(order || service) && (
          <div className={styles.sidebar}>
            <div className={`${styles.context_card} card`}>

              {/* Typ B – uppdragskort */}
              {order && (
                <>
                  <h2 className={styles.context_title}>📦 Uppdrag</h2>
                  <strong className={styles.context_service}>{order.service_title}</strong>
                  <div className={styles.context_rows}>
                    <div className={styles.context_row}>
                      <span>Status</span>
                      <strong>{order.status === 'accepted' ? '✅ Godkänd' : order.status === 'pending' ? '⏳ Väntar' : '❌ Nekad'}</strong>
                    </div>
                    <div className={styles.context_row}>
                      <span>Projektstatus</span>
                      <strong>{projectStatusLabel[order.project_status] ?? order.project_status}</strong>
                    </div>
                    {order.answers?.['Önskat datum'] && (
                      <div className={styles.context_row}>
                        <span>Datum</span>
                        <strong>{order.answers['Önskat datum']}</strong>
                      </div>
                    )}
                    {order.answers?.['Adress'] && (
                      <div className={styles.context_row}>
                        <span>Adress</span>
                        <strong>{order.answers['Adress']}</strong>
                      </div>
                    )}
                    {order.answers?.['Upphämtningsadress'] && (
                      <div className={styles.context_row}>
                        <span>Upphämtning</span>
                        <strong>{order.answers['Upphämtningsadress']}</strong>
                      </div>
                    )}
                    {order.answers?.['Leveransadress'] && (
                      <div className={styles.context_row}>
                        <span>Leverans</span>
                        <strong>{order.answers['Leveransadress']}</strong>
                      </div>
                    )}
                  </div>
                  {orderLink && (
                    <Link href={orderLink} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                      📋 Visa beställningen
                    </Link>
                  )}
                </>
              )}

              {/* Typ A – tjänstekort */}
              {service && !order && (
                <>
                  <h2 className={styles.context_title}>🛠️ Tjänst</h2>
                  <strong className={styles.context_service}>{service.title}</strong>
                  <div className={styles.context_rows}>
                    <div className={styles.context_row}>
                      <span>Kategori</span>
                      <strong>{service.subcategory}</strong>
                    </div>
                    <div className={styles.context_row}>
                      <span>Plats</span>
                      <strong>{service.location}</strong>
                    </div>
                    <div className={styles.context_row}>
                      <span>Pris</span>
                      <strong>{service.price_type === 'offert' ? 'Offert' : `${service.price} kr (${service.price_type})`}</strong>
                    </div>
                  </div>
                  <Link href={`/tjanst/${service.id}`} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                    🔗 Visa tjänsten
                  </Link>
                  {user?.id !== service.user_id && (
                    <Link href={`/tjanst/${service.id}?order=true`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                      🛒 Beställ tjänsten
                    </Link>
                  )}
                </>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}