import Link from 'next/link'
import Image from 'next/image'
import styles from './not-found.module.scss'

export default function NotFound() {
  return (
    <div className={styles.notfound}>
      <Image
        src="/images/image-404.svg"
        alt=""
        width={280}
        height={280}
        className={styles.notfound__image}
        priority
      />
      <h1 className={styles.notfound__heading}>Sidan kunde inte hittas</h1>
      <p className={styles.notfound__text}>
        Länken kan vara felaktig, eller så har sidan flyttats.
      </p>
      <div className={styles.notfound__actions}>
        <Link href="/" className="btn btn-primary">
          Till startsidan
        </Link>
        <Link href="/services" className="btn btn-outline">
          Sök tjänster
        </Link>
      </div>
    </div>
  )
}
