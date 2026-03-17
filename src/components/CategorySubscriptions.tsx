'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import useAuth from '@/hooks/useAuth'
import { categories } from '@/data/categories'
import styles from './CategorySubscriptions.module.scss'

export default function CategorySubscriptions() {
  const { user } = useAuth()
  const [subscribed, setSubscribed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from('category_subscriptions')
        .select('category_id')
        .eq('user_id', user.id)
      setSubscribed(data?.map(s => s.category_id) ?? [])
      setLoading(false)
    }
    fetch()
  }, [user])

  const toggle = async (categoryId: string) => {
    if (!user || saving) return
    setSaving(true)
    const isSubscribed = subscribed.includes(categoryId)
    if (isSubscribed) {
      await supabase.from('category_subscriptions').delete().eq('user_id', user.id).eq('category_id', categoryId)
      setSubscribed(prev => prev.filter(id => id !== categoryId))
    } else {
      await supabase.from('category_subscriptions').insert({ user_id: user.id, category_id: categoryId })
      setSubscribed(prev => [...prev, categoryId])
    }
    setSaving(false)
  }

  if (!user || loading) return null

  // Bygg upp en lista med underkategorier som valbara prenumerationer
  // Format: "kategori-id:underkategori"
  const allSubcategories = categories.flatMap(cat =>
    cat.subcategories.map(sub => ({
      id: `${cat.id}:${sub}`,
      label: sub,
      categoryLabel: cat.label,
      categoryIcon: cat.icon,
      categoryId: cat.id,
    }))
  )

  const subscribedCount = subscribed.length

  return (
    <>
      {/* Knapp */}
      <button
        className={`${styles.trigger_btn} ${subscribedCount > 0 ? styles['trigger_btn--active'] : ''}`}
        onClick={() => setShowModal(true)}
      >
        <span>🔔</span>
        <span>Bevaka kategorier</span>
        {subscribedCount > 0 && (
          <span className={styles.trigger_badge}>{subscribedCount}</span>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className={`modal-box ${styles.modal}`} onClick={e => e.stopPropagation()}>

            <div className={styles.modal__header}>
              <div>
                <h2 className={styles.modal__title}>Bevaka förfrågningar</h2>
                <p className={styles.modal__subtitle}>
                  Välj underkategorier – få notifikationer när nya förfrågningar dyker upp
                </p>
              </div>
              <button className={styles.modal__close} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className={styles.modal__body}>
              {categories.map(cat => (
                <div key={cat.id} className={styles.cat_group}>

                  {/* Kategori-rubrik */}
                  <button
                    className={styles.cat_header}
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  >
                    <span>{cat.icon}</span>
                    <span className={styles.cat_label}>{cat.label}</span>
                    <span className={styles.cat_count}>
                      {subscribed.filter(s => s.startsWith(cat.id)).length > 0 && (
                        <span className={styles.cat_badge}>
                          {subscribed.filter(s => s.startsWith(cat.id)).length}
                        </span>
                      )}
                    </span>
                    <span className={styles.cat_arrow}>
                      {expandedCategory === cat.id ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Underkategorier */}
                  {expandedCategory === cat.id && (
                    <div className={styles.subcats}>
                      {cat.subcategories.map(sub => {
                        const id = `${cat.id}:${sub}`
                        const isActive = subscribed.includes(id)
                        return (
                          <button
                            key={id}
                            className={`${styles.subcat_btn} ${isActive ? styles['subcat_btn--active'] : ''}`}
                            onClick={() => toggle(id)}
                            disabled={saving}
                          >
                            {isActive ? '✓ ' : ''}{sub}
                          </button>
                        )
                      })}
                    </div>
                  )}

                </div>
              ))}
            </div>

            <div className={styles.modal__footer}>
              <p className={styles.modal__footer_text}>
                {subscribedCount > 0
                  ? `Du bevakar ${subscribedCount} underkategori${subscribedCount !== 1 ? 'er' : ''}`
                  : 'Inga kategorier bevakade än'}
              </p>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                Klar
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}