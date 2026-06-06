'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import styles from './complete.module.scss'
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink, FileText, User, Wallet } from 'lucide-react'

type Order = {
  id: string
  service_title: string
  seller_id: string
  seller_name: string
  buyer_id: string
  buyer_name: string
  status: 'pending' | 'accepted' | 'rejected'
  project_status: 'not_started' | 'in_progress' | 'almost_done' | 'completed'
  service_type: 'typ1' | 'typ2' | 'typ3'
  price_type: string | null
  active_price: number | null
  price_status: string | null
  conversation_id: string | null
  delivered_at?: string | null
}

const STEPS = [
  { num: 1, label: 'Slutpris' },
  { num: 2, label: 'Betalning' },
  { num: 3, label: 'Meddelande' },
]

export default function CompleteOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading: authLoading, accountType } = useAuth()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [orderId, setOrderId] = useState('')
  const [step, setStep] = useState(1)
  const [hours, setHours] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [priceSubmitting, setPriceSubmitting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return

    const init = async () => {
      const { id } = await params
      setOrderId(id)

      const { data } = await supabase.from('orders').select('*').eq('id', id).single()

      if (
        !data ||
        !user ||
        user.id !== data.seller_id ||
        data.status !== 'accepted' ||
        data.project_status === 'completed'
      ) {
        router.replace(`/order/${id}`)
        return
      }

      setOrder(data)
      setMessage(
        `Hej ${data.buyer_name}! Uppdraget är nu slutfört från min sida. Kolla gärna igenom och bekräfta att allt är bra.`
      )
      setPageLoading(false)
    }

    init()
  }, [authLoading, user])

  const postPriceProposal = async (amount: number, note?: string) => {
    if (!order) return
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/price-proposals', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ order_id: order.id, amount, note }),
    })
  }

  const handlePriceStep = async () => {
    if (!order) return
    const { price_type, active_price } = order
    setPriceSubmitting(true)
    try {
      if (price_type === 'timpris' && active_price) {
        const amount = active_price * Number(hours)
        await postPriceProposal(amount, `${hours} timmar à ${active_price} kr/h`)
      } else if (price_type === 'offert' && active_price == null) {
        await postPriceProposal(Number(customAmount))
      }
    } finally {
      setPriceSubmitting(false)
    }
    setStep(2)
  }

  const handleComplete = async (withMessage: boolean) => {
    if (!order) return
    setSubmitting(true)
    try {
      const isTyp3 = order.service_type === 'typ3'
      const now = new Date().toISOString()

      if (isTyp3) {
        await supabase.from('orders').update({ delivered_at: now }).eq('id', order.id)
      } else {
        await supabase.from('orders').update({ project_status: 'completed' }).eq('id', order.id)
      }

      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: isTyp3 ? 'delivery_marked' : 'project_completed',
        order_id: order.id,
        service_title: order.service_title,
        actor_name: order.seller_name,
        message: isTyp3
          ? `${order.seller_name} har markerat uppdraget som levererat. Om du inte hör av dig inom 24 timmar bekräftas uppdraget automatiskt.`
          : `${order.seller_name} har markerat projektet "${order.service_title}" som slutfört!`,
        action_url: `/my-order/${order.id}`,
        read: false,
        dismissed: false,
        email_sent: false,
        created_at: now,
      })

      if (!isTyp3) {
        await supabase.from('notifications').insert({
          user_id: order.seller_id,
          type: 'request_review',
          order_id: order.id,
          service_title: order.service_title,
          message: `Projektet "${order.service_title}" är slutfört – glöm inte ta betalt och lämna en recension!`,
          read: false,
          dismissed: false,
          email_sent: false,
          created_at: now,
        })
      }

      if (withMessage && order.conversation_id) {
        await supabase.from('messages').insert({
          conversation_id: order.conversation_id,
          sender_id: null,
          type: 'system',
          content: message,
          read_by: [],
        })
        await supabase.from('conversations').update({
          last_message_at: now,
          last_message_preview: message,
        }).eq('id', order.conversation_id)
      }

      router.replace(`/order/${order.id}`)
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  if (authLoading || pageLoading) return <div className={styles.loading}>Laddar...</div>
  if (!order) return null

  const { price_type, active_price } = order
  const hourlyRate = active_price ?? 0
  const calculatedTotal = hourlyRate * (Number(hours) || 0)

  // ── Step 1 content – resolved before render ──────────────────────────────
  let step1: React.ReactNode = null
  if (step === 1) {
    const hasClearedPrice = active_price != null

    if (hasClearedPrice && price_type !== 'timpris') {
      step1 = (
        <div className={`${styles.card} staticcard`}>
          <h2 className={styles.card__heading}>Bekräfta slutpriset</h2>
          <p className={styles.card__sub}>Stämmer priset nedan?</p>
          <div className={styles.price_highlight}>{active_price} kr</div>
          <div className={styles.actions}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>
              <CheckCircle size={16} /> Stämmer – gå vidare
            </button>
            <Link href={`/order/${orderId}`} className={styles.link_btn}>Justera priset</Link>
          </div>
        </div>
      )
    } else if (price_type === 'timpris') {
      step1 = (
        <div className={`${styles.card} staticcard`}>
          <h2 className={styles.card__heading}>Registrera nedlagd tid</h2>
          <p className={styles.card__sub}>
            {active_price ? `Timpris: ${active_price} kr/h` : 'Ange antal timmar nedlagda på uppdraget.'}
          </p>
          <input
            className={styles.input}
            type="number"
            min={0}
            step={0.5}
            placeholder="Antal timmar"
            value={hours}
            onChange={e => setHours(e.target.value)}
          />
          {active_price && Number(hours) > 0 && (
            <div className={styles.calc}>
              {calculatedTotal} kr
              <span>({hours} h × {active_price} kr/h)</span>
            </div>
          )}
          <div className={styles.actions}>
            <button
              className="btn btn-primary"
              disabled={!hours || Number(hours) <= 0 || priceSubmitting}
              onClick={handlePriceStep}
            >
              {priceSubmitting ? 'Skickar...' : 'Gå vidare'}
            </button>
          </div>
        </div>
      )
    } else if (price_type === 'offert' && !hasClearedPrice) {
      step1 = (
        <div className={`${styles.card} staticcard`}>
          <h2 className={styles.card__heading}>Registrera slutbelopp</h2>
          <p className={styles.card__sub}>Vad blev det totala priset för uppdraget?</p>
          <input
            className={styles.input}
            type="number"
            min={1}
            placeholder="Belopp (kr)"
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
          />
          <div className={styles.actions}>
            <button
              className="btn btn-primary"
              disabled={!customAmount || Number(customAmount) <= 0 || priceSubmitting}
              onClick={handlePriceStep}
            >
              {priceSubmitting ? 'Skickar...' : 'Gå vidare'}
            </button>
          </div>
        </div>
      )
    } else {
      step1 = (
        <div className={`${styles.card} staticcard`}>
          <h2 className={styles.card__heading}>Pris</h2>
          <p className={styles.card__sub}>Inget pris är registrerat för detta uppdrag.</p>
          <div className={styles.actions}>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Gå vidare</button>
          </div>
        </div>
      )
    }
  }

  return (
    <div className={styles.complete}>
      <div className={styles.inner}>

        <Link href={`/order/${orderId}`} className={styles.back}>
          <ArrowLeft size={14} /> Tillbaka till beställningen
        </Link>

        {/* Step indicator */}
        <div className={styles.steps}>
          {STEPS.flatMap((s, i) => {
            const items: React.ReactNode[] = [
              <div key={`step-${s.num}`} className={styles.step}>
                <div
                  className={`${styles.step__num} ${
                    step === s.num ? styles['step__num--active'] :
                    step > s.num  ? styles['step__num--done']   : ''
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span
                  className={`${styles.step__label} ${step === s.num ? styles['step__label--active'] : ''}`}
                >
                  {s.label}
                </span>
              </div>,
            ]
            if (i < STEPS.length - 1) {
              items.push(<div key={`line-${s.num}`} className={styles.step__line} />)
            }
            return items
          })}
        </div>

        {/* Step 1 – Price */}
        {step1}

        {/* Step 2 – Payment guidance */}
        {step === 2 && (
          <div className={`${styles.card} staticcard`}>

            {accountType === 'svippare' && (
              <>
                <h2 className={styles.card__heading}>Ta betalt som privatperson</h2>
                <span className={styles.payment_type}>Svippare</span>
                <p className={styles.card__sub}>
                  Som privatperson behöver du deklarera inkomsten från uppdraget. Här är vad du behöver veta:
                </p>
                <ul className={styles.payment_bullets}>
                  <li>
                    <Wallet size={18} className={styles.bullet_icon} />
                    Inkomst från uppdrag räknas som inkomst av tjänst och ska deklareras
                  </li>
                  <li>
                    <FileText size={18} className={styles.bullet_icon} />
                    Du kan dra av kostnader direkt kopplade till uppdraget
                  </li>
                  <li>
                    <AlertCircle size={18} className={styles.bullet_icon} />
                    Svippo hanterar inte skatteavdrag – det är ditt ansvar
                  </li>
                </ul>
                <a
                  href="http://localhost:3000/blogg/sa-tar-du-betalt-som-svippare"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.blog_link_card}
                >
                  <div className={styles.blog_link_card__text}>
                    <span className={styles.blog_link_card__title}>Läs mer om hur du tar betalt</span>
                    <span className={styles.blog_link_card__sub}>Vi har skrivit en guide för dig som Svippare</span>
                  </div>
                  <ExternalLink size={18} className={styles.blog_link_card__icon} />
                </a>
              </>
            )}

            {accountType === 'foretag' && (
              <>
                <h2 className={styles.card__heading}>Skicka faktura som företag</h2>
                <span className={styles.payment_type}>Företag</span>
                <p className={styles.card__sub}>
                  Glöm inte att skicka faktura till beställaren via ert faktureringsprogram.
                </p>
                <ul className={styles.payment_bullets}>
                  <li>
                    <User size={18} className={styles.bullet_icon} />
                    Ange beställarens kontaktuppgifter som du hittar på ordersidan
                  </li>
                  <li>
                    <CheckCircle size={18} className={styles.bullet_icon} />
                    Använd det godkända beloppet som fakturabelopp
                  </li>
                </ul>
                <div className={styles.coming_soon_box}>
                  Vi håller på att ta fram guider för företagare på Svippo. Återkom snart!
                </div>
              </>
            )}

            {accountType === 'uf-foretag' && (
              <>
                <h2 className={styles.card__heading}>Skicka faktura som UF</h2>
                <span className={styles.payment_type}>UF-företag</span>
                <p className={styles.card__sub}>
                  Bra jobbat! Som UF-företag fakturerar ni beställaren direkt.
                </p>
                <ul className={styles.payment_bullets}>
                  <li>
                    <FileText size={18} className={styles.bullet_icon} />
                    Använd ert UF-företags fakturamall eller faktureringsprogram
                  </li>
                  <li>
                    <CheckCircle size={18} className={styles.bullet_icon} />
                    Det godkända beloppet är vad ni ska fakturera
                  </li>
                </ul>
                <div className={styles.coming_soon_box}>
                  Vi håller på att ta fram guider för UF-företag på Svippo. Återkom snart!
                </div>
              </>
            )}

            {accountType !== 'svippare' && accountType !== 'foretag' && accountType !== 'uf-foretag' && (
              <>
                <h2 className={styles.card__heading}>Betalning</h2>
                <p className={styles.card__sub}>Kom överens om betalning direkt med beställaren.</p>
              </>
            )}

            <div className={styles.actions}>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Förstått – gå vidare
              </button>
            </div>
          </div>
        )}

        {/* Step 3 – Message the buyer */}
        {step === 3 && (
          <div className={`${styles.card} staticcard`}>
            <h2 className={styles.card__heading}>Meddela beställaren</h2>
            <p className={styles.card__sub}>
              {order.conversation_id
                ? 'Skicka ett avslutningsmeddelande till beställaren.'
                : 'Inget meddelande kan skickas – ingen aktiv chatt finns för detta uppdrag.'}
            </p>
            {order.conversation_id && (
              <textarea
                className={styles.textarea}
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
              />
            )}
            <div className={styles.actions}>
              <button
                className="btn btn-primary"
                disabled={submitting}
                onClick={() => handleComplete(!!order.conversation_id)}
              >
                {submitting ? 'Slutför...' : <><CheckCircle size={16} /> Skicka och slutför</>}
              </button>
              <button
                className={styles.link_btn}
                disabled={submitting}
                onClick={() => handleComplete(false)}
              >
                Slutför utan meddelande
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
