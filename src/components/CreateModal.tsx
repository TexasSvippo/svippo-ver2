'use client'

import { useRouter } from 'next/navigation'
import styles from './CreateModal.module.scss'
import { Wrench, Users } from 'lucide-react'

type Props = {
  onClose: () => void
}

export default function CreateModal({ onClose }: Props) {
  const router = useRouter()

  const handleChoice = (path: string) => {
    onClose()
    router.push(path)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>

        <div className={styles.modal__header}>
          <h2 className={styles.modal__title}>Vad vill du skapa?</h2>
          <button className={styles.modal__close} onClick={onClose}>✕</button>
        </div>

        <div className={styles.modal__options}>

          <button
            className={`${styles.modal__option} ${styles['modal__option--service']}`}
            onClick={() => handleChoice('/create-service')}
          >
            <div className={styles.modal__option_icon}><Wrench size={24} /></div>
            <div className={styles.modal__option_content}>
              <strong>Erbjud en tjänst</strong>
              <p>Publicera din tjänst och börja ta emot beställningar</p>
            </div>
            <span className={styles.modal__option_arrow}>→</span>
          </button>

          <button
            className={`${styles.modal__option} ${styles['modal__option--request']}`}
            onClick={() => handleChoice('/create-request')}
          >
            <div className={styles.modal__option_icon}><Users size={24} /></div>
            <div className={styles.modal__option_content}>
              <strong>Skapa en förfrågan</strong>
              <p>Beskriv vad du behöver hjälp med och få svar från Svippare</p>
            </div>
            <span className={styles.modal__option_arrow}>→</span>
          </button>

        </div>
      </div>
    </div>
  )
}