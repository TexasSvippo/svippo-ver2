'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import styles from './SearchBar.module.scss'
import { Wrench, Users, Search } from 'lucide-react'

type Service = {
  id: string
  title: string
  subcategory: string
  location: string
  price: number
  price_type: string
  user_name: string
}

type Request = {
  id: string
  title: string
  subcategory: string
  location: string
  budget: number
  user_name: string
}

type SearchType = 'tjanster' | 'forfragningar'

type Props = {
  hideTypePicker?: boolean
  defaultType?: SearchType
}

export default function SearchBar({ hideTypePicker = false, defaultType = 'tjanster' }: Props) {
  const router = useRouter()
  const [searchType, setSearchType] = useState<SearchType>(defaultType)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Stäng dropdown vid klick utanför
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setShowTypePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Hämta data när sökning ändras
  useEffect(() => {
    if (search.length < 2) {
      setServices([])
      setRequests([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        if (searchType === 'tjanster') {
          const { data } = await supabase
            .from('services')
            .select('id, title, subcategory, location, price, price_type, user_name')
            .or(`title.ilike.%${search}%,subcategory.ilike.%${search}%,user_name.ilike.%${search}%`)
            .order('created_at', { ascending: false })
            .limit(3)
          setServices(data ?? [])
        } else {
          const { data } = await supabase
            .from('requests')
            .select('id, title, subcategory, location, budget, user_name')
            .or(`title.ilike.%${search}%,subcategory.ilike.%${search}%,user_name.ilike.%${search}%`)
            .order('created_at', { ascending: false })
            .limit(3)
          setRequests(data ?? [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [search, searchType])

  const handleFocus = () => {
    if (!search && !hideTypePicker) {
      setShowTypePicker(true)
      setShowDropdown(false)
    } else if (search) {
      setShowDropdown(true)
      setShowTypePicker(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setShowTypePicker(false)
    if (e.target.value.length >= 2) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search) {
      router.push(`/${searchType}?search=${encodeURIComponent(search)}`)
      setShowDropdown(false)
      setSearch('')
    }
  }

  const handleTypeSelect = (type: SearchType) => {
    setSearchType(type)
    setShowTypePicker(false)
  }

  const results = searchType === 'tjanster' ? services : requests

  return (
    <div className={styles.searchbar} ref={wrapperRef}>

      {/* Sökfält */}
      <div className={`${styles.searchbar__input_wrapper} ${showDropdown || showTypePicker ? styles['searchbar__input_wrapper--active'] : ''}`}>

        {/* Typ-knapp */}
        {!hideTypePicker && (
          <>
            <button
              className={styles.searchbar__type_btn}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                setShowTypePicker(!showTypePicker)
                setShowDropdown(false)
              }}
              type="button"
            >
              {searchType === 'tjanster' ? <><Wrench size={14} /> Tjänster</> : <><Users size={14} /> Förfrågningar</>}
              <span className={styles.searchbar__type_arrow}>▾</span>
            </button>
            <div className={styles.searchbar__divider} />
          </>
        )}

        <span className={styles.searchbar__icon}><Search size={16} /></span>
        <input
          type="text"
          className={styles.searchbar__input}
          placeholder={`Sök ${searchType === 'tjanster' ? 'tjänster' : 'förfrågningar'}...`}
          value={search}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />

        {search && (
          <button
            className={styles.searchbar__clear}
            onClick={() => {
              setSearch('')
              setShowDropdown(false)
            }}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Typ-väljare */}
      {showTypePicker && !hideTypePicker && (
        <div className={styles.searchbar__dropdown}>
          <p className={styles.searchbar__dropdown_hint}>Vad letar du efter?</p>
          <button
            className={`${styles.searchbar__type_option} ${searchType === 'tjanster' ? styles['searchbar__type_option--active'] : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={() => handleTypeSelect('tjanster')}
            type="button"
          >
            <Wrench size={16} />
            <div>
              <strong>Tjänster</strong>
              <span>Hitta någon som kan hjälpa dig</span>
            </div>
          </button>
          <button
            className={`${styles.searchbar__type_option} ${searchType === 'forfragningar' ? styles['searchbar__type_option--active'] : ''}`}
            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            onClick={() => handleTypeSelect('forfragningar')}
            type="button"
          >
            <Users size={16} />
            <div>
              <strong>Förfrågningar</strong>
              <span>Hitta uppdrag att utföra</span>
            </div>
          </button>
        </div>
      )}

      {/* Sökresultat */}
      {showDropdown && search.length >= 2 && (
        <div className={styles.searchbar__dropdown}>
          {loading ? (
            <div className={styles.searchbar__loading}>Söker...</div>
          ) : results.length === 0 ? (
            <div className={styles.searchbar__empty}>
              Inga {searchType === 'tjanster' ? 'tjänster' : 'förfrågningar'} hittades för &quot;{search}&quot;
            </div>
          ) : (
            <>
              <p className={styles.searchbar__dropdown_hint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {searchType === 'tjanster' ? <><Wrench size={14} /> Tjänster</> : <><Users size={14} /> Förfrågningar</>}
              </p>
              {searchType === 'tjanster'
                ? services.map(s => (
                  <Link
                    key={s.id}
                    href={`/service/${s.id}`}
                    className={styles.searchbar__result}
                    onClick={() => { setShowDropdown(false); setSearch('') }}
                  >
                    <div className={styles.searchbar__result_info}>
                      <strong>{s.title}</strong>
                      <span>{s.subcategory} · {s.location}</span>
                    </div>
                    <span className={styles.searchbar__result_price}>
                      {s.price_type === 'offert' ? 'Offert' : `${s.price} kr`}
                    </span>
                  </Link>
                ))
                : requests.map(r => (
                  <Link
                    key={r.id}
                    href={`/request/${r.id}`}
                    className={styles.searchbar__result}
                    onClick={() => { setShowDropdown(false); setSearch('') }}
                  >
                    <div className={styles.searchbar__result_info}>
                      <strong>{r.title}</strong>
                      <span>{r.subcategory} · {r.location}</span>
                    </div>
                    <span className={`${styles.searchbar__result_price} ${styles['searchbar__result_price--orange']}`}>
                      {r.budget} kr
                    </span>
                  </Link>
                ))
              }
            </>
          )}

          <Link
            href={`/${searchType}?search=${encodeURIComponent(search)}`}
            className={styles.searchbar__see_all}
            onClick={() => { setShowDropdown(false); setSearch('') }}
          >
            Se alla resultat för &quot;{search}&quot; →
          </Link>
        </div>
      )}

    </div>
  )
}
