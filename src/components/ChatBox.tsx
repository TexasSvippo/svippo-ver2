'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './ChatBox.module.scss'

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

type Props = {
  orderId: string
  orderStatus: string
  otherPartyId: string
  otherPartyName: string
  currentUserName: string
}

export default function ChatBox({
  orderId,
  orderStatus,
  otherPartyId,
  otherPartyName,
  currentUserName,
}: Props) {
  const { user } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Hämta eller skapa konversation kopplad till ordern
  useEffect(() => {
    if (!user) return

    const initConversation = async () => {
      // Kolla om konversation redan finns för denna order
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('assignment_id', orderId)
        .single()

      if (existing) {
        setConversation(existing)
        await fetchMessages(existing.id)
      }
      setLoading(false)
    }

    initConversation()
  }, [user, orderId])

  // Realtid – lyssna på nya meddelanden
  useEffect(() => {
    if (!conversation) return

    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            // Undvik dubletter
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation])

  // Scrolla till botten när meddelanden laddas
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!user || !input.trim() || sending) return
    setSending(true)

    try {
      let activeConversation = conversation

      // Skapa konversation om den inte finns (första meddelandet)
      if (!activeConversation) {
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            type: 'assignment',
            anchor_type: 'order',
            anchor_id: orderId,
            assignment_id: orderId,
            participant_1_id: user.id,
            participant_2_id: otherPartyId,
            last_message_at: new Date().toISOString(),
            last_message_preview: input.trim().slice(0, 100),
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error || !newConv) {
          console.error('Kunde inte skapa konversation:', error)
          setSending(false)
          return
        }

        activeConversation = newConv
        setConversation(newConv)
      }

      if (!activeConversation) return

      // Skicka meddelandet
      const { error: msgError } = await supabase.from('messages').insert({
        conversation_id: activeConversation.id,
        sender_id: user.id,
        type: 'text',
        content: input.trim(),
        read_by: [user.id],
        created_at: new Date().toISOString(),
      })

      if (msgError) {
        console.error('Kunde inte skicka meddelande:', msgError)
        setSending(false)
        return
      }

      // Uppdatera konversationens förhandsgranskning
      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: input.trim().slice(0, 100),
        })
        .eq('id', activeConversation.id)

      // Skicka notis till motparten
      await supabase.from('notifications').insert({
        user_id: otherPartyId,
        type: 'new_message',
        order_id: orderId,
        service_title: '',
        actor_name: currentUserName,
        message: `${currentUserName}: ${input.trim().slice(0, 60)}${input.trim().length > 60 ? '...' : ''}`,
        action_url: `/messages`,
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

  if (loading) return <div className={styles.loading}>Laddar chatt...</div>

  return (
    <div className={styles.chatbox}>

      {/* Zon 2 – Meddelandeyta */}
      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            Inga meddelanden än. Skicka ett för att starta konversationen.
          </div>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === user?.id
          const isSystem = msg.type === 'system'

          if (isSystem) {
            return (
              <div key={msg.id} className={styles.system_message}>
                {msg.content}
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`${styles.message} ${isOwn ? styles['message--own'] : styles['message--other']}`}
            >
              {!isOwn && (
                <span className={styles.message__sender}>{otherPartyName}</span>
              )}
              <div className={styles.message__bubble}>
                {msg.type === 'file' && msg.file_url ? (
                  <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className={styles.message__file}>
                    📎 Bifogad fil
                  </a>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
              <span className={styles.message__time}>
                {new Date(msg.created_at).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Zon 3 – Inputfält */}
      {orderStatus === 'accepted' ? (
        <div className={styles.input_area}>
          <textarea
            className={styles.input}
            placeholder="Skriv ett meddelande... (Enter för att skicka)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={sending}
          />
          <button
            className={styles.send_btn}
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? '...' : '➤'}
          </button>
        </div>
      ) : (
        <div className={styles.disabled_input}>
          {orderStatus === 'pending'
            ? 'Chatten aktiveras när beställningen godkänns.'
            : 'Detta uppdrag är avslutat.'}
        </div>
      )}
    </div>
  )
}