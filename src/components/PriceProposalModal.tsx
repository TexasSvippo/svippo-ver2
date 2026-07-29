'use client'

import { useState, useEffect } from 'react'
import { Paperclip } from 'lucide-react'
import { submitPriceProposal } from '@/lib/submitPriceProposal'
import styles from './PriceProposalModal.module.scss'

type Props = {
  open: boolean
  onClose: () => void
  orderId: string
  priceType: string | null
  onSubmitted: () => void
}

export default function PriceProposalModal({ open, onClose, orderId, priceType, onSubmitted }: Props) {
  const [amount, setAmount] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [hoursInput, setHoursInput] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAmount('')
      setHourlyRate('')
      setHoursInput('')
      setNote('')
      setFile(null)
      setError('')
    }
  }, [open])

  if (!open) return null

  const isTimpris = priceType === 'timpris'
  const isOffert = priceType === 'offert'
  const title = isOffert ? 'Föreslå ett pris' : 'Föreslå nytt pris'

  const total = isTimpris
    ? (Number(hourlyRate) || 0) * (Number(hoursInput) || 0)
    : Number(amount) || 0

  const canSubmit = isTimpris
    ? Number(hourlyRate) > 0 && Number(hoursInput) > 0
    : Number(amount) > 0

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) {
      setError('Filen är för stor! Max 10MB.')
      return
    }
    setError('')
    setFile(f)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      await submitPriceProposal({
        orderId,
        amount: total,
        note: note.trim() || undefined,
        hours: isTimpris ? Number(hoursInput) : undefined,
        file,
      })
      onSubmitted()
      onClose()
    } catch (err) {
      console.error('Price proposal submit error:', err)
      setError('Något gick fel. Försök igen.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          {isTimpris ? (
            <>
              <div className={styles.field}>
                <label>Timpris (kr/h)</label>
                <input
                  type="number"
                  min={1}
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  placeholder="T.ex. 450"
                />
              </div>
              <div className={styles.field}>
                <label>Antal timmar</label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={hoursInput}
                  onChange={e => setHoursInput(e.target.value)}
                  placeholder="T.ex. 5"
                />
              </div>
              {total > 0 && <div className={styles.total}>= {total.toLocaleString('sv-SE')} kr</div>}
            </>
          ) : (
            <div className={styles.field}>
              <label>{isOffert ? 'Pris (kr)' : 'Nytt pris (kr)'}</label>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="T.ex. 2000"
              />
            </div>
          )}

          <div className={styles.field}>
            <label>Kommentar (valfritt)</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Beskriv gärna prisförslaget..."
              maxLength={500}
            />
          </div>

          <div className={styles.field}>
            <label>Bilaga (valfritt)</label>
            <label className={styles.file_upload}>
              <Paperclip size={14} /> {file ? file.name : 'Bifoga offert-PDF eller specifikation'}
              <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
        <div className={styles.footer}>
          <button className="btn btn-outline" onClick={onClose}>Avbryt</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Skickar...' : 'Skicka förslag'}
          </button>
        </div>
      </div>
    </div>
  )
}
