'use client'

import { useRouter } from 'next/navigation'
import SearchBar from './SearchBar'
import styles from './Hero.module.scss'

const popularTags = ['Snickare', 'Hemsida', 'Däckbyte']

export default function Hero() {
  const router = useRouter()

  return (
    <section className={styles.hero}>
      {/* Dekorationer */}
      <div className={`${styles.hero__cloud} ${styles['hero__cloud--1']}`} />
      <div className={`${styles.hero__cloud} ${styles['hero__cloud--2']}`} />
      <div className={`${styles.hero__cloud} ${styles['hero__cloud--3']}`} />
      <div className={styles.hero__sun} />

      <div className={`container ${styles.hero__content}`}>
        <h1 className={styles.hero__title}>
          Hitta tjänster för dig,{' '}
          <span className={styles['hero__title--italic']}>i ditt område!</span>
        </h1>

        {/* Sökruta */}
        <div className={styles.hero__searchbar}>
          <SearchBar hideTypePicker defaultType="tjanster" />
        </div>

        {/* Populära sökningar */}
        <div className={styles.hero__tags}>
          <span className={styles.hero__tags_label}>Jag söker:</span>
          {popularTags.map(tag => (
            <button
              key={tag}
              className={styles.hero__tag}
              onClick={() => router.push(`/services?search=${encodeURIComponent(tag)}`)}
            >
              {tag}
            </button>
          ))}
          <button
            className={`${styles.hero__tag} ${styles['hero__tag--active']}`}
            onClick={() => router.push('/services')}
          >
            Utforska
          </button>
        </div>
      </div>
    </section>
  )
}
