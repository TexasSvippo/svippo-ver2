'use client'

import { useState, useEffect } from 'react'
import { submitReport, type ReportTargetType } from '@/lib/submitReport'
import styles from './ReportModal.module.scss'

const REPORT_REASONS = ['Felaktig information', 'Olämpligt innehåll', 'Spam', 'Annat']

type Props = {
  open: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: string
  reporterId: string | null
  onSubmitted?: () => void
}

export default function ReportModal({ open, onClose, targetType, targetId, reporterId, onSubmitted }: Props) {
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (open) {
      setReason('')
      setMessage('')
      setSent(false)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = async () => {
    if (!reason) return
    setSending(true)
    try {
      await submitReport({ reporterId, targetType, targetId, reason, message })
      setSent(true)
      onSubmitted?.()
      setTimeout(onClose, 1500)
    } catch (err) {
      console.error('Report submit error:', err)
      alert('Något gick fel. Försök igen.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className={styles.success}>Tack, rapporten har skickats!</div>
        ) : (
          <>
            <div className={styles.header}>
              <h2>Rapportera inlägg</h2>
              <button onClick={onClose}>✕</button>
            </div>
            <div className={styles.body}>
              {REPORT_REASONS.map(r => (
                <label key={r} className={styles.option}>
                  <input
                    type="radio"
                    name="report_reason"
                    value={r}
                    checked={reason === r}
                    onChange={e => setReason(e.target.value)}
                  />
                  {r}
                </label>
              ))}
              <div className={styles.message_field}>
                <label>Fler detaljer (valfritt)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Beskriv gärna vad som är fel..."
                  maxLength={500}
                />
              </div>
            </div>
            <div className={styles.footer}>
              <button className="btn btn-outline" onClick={onClose}>Avbryt</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!reason || sending}>
                {sending ? 'Skickar...' : 'Skicka rapport'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
