'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { convertToWebP } from '@/utils/convertToWebP'
import { Pencil, Trash2, Plus, Loader } from 'lucide-react'
import styles from './ReferenceImageUploader.module.scss'

export type ServiceReference = {
  id: string
  service_id: string
  user_id: string
  image_url: string
  title: string
  description?: string
  sort_order: number
  created_at: string
}

interface Props {
  serviceId: string
  userId: string
  onChange?: () => void
}

export default function ReferenceImageUploader({ serviceId, userId, onChange }: Props) {
  const [refs, setRefs] = useState<ServiceReference[]>([])
  const [loadingRefs, setLoadingRefs] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchRefs = async () => {
    const { data } = await supabase
      .from('service_references')
      .select('*')
      .eq('service_id', serviceId)
      .order('sort_order')
    setRefs(data ?? [])
    setLoadingRefs(false)
  }

  useEffect(() => { fetchRefs() }, [serviceId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { alert('Bilden är för stor! Max 10MB.'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const resetForm = () => {
    setTitle(''); setDescription(''); setFile(null); setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    setIsAdding(false)
  }

  const handleAdd = async () => {
    if (!file || !title.trim()) return
    setUploading(true)
    try {
      const webpFile = await convertToWebP(file)
      const fileName = `${userId}/${serviceId}/${Date.now()}.webp`
      const { error: uploadError } = await supabase.storage
        .from('reference-images')
        .upload(fileName, webpFile)
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('reference-images')
        .getPublicUrl(fileName)

      await supabase.from('service_references').insert({
        service_id: serviceId,
        user_id: userId,
        image_url: urlData.publicUrl,
        title: title.trim(),
        description: description.trim() || null,
        sort_order: refs.length,
        created_at: new Date().toISOString(),
      })

      resetForm()
      await fetchRefs()
      onChange?.()
    } catch (err) {
      console.error(err)
      alert('Något gick fel vid uppladdning. Försök igen.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (ref: ServiceReference) => {
    if (!confirm(`Ta bort referensen "${ref.title}"?`)) return
    try {
      const path = ref.image_url.split('/reference-images/')[1]
      if (path) await supabase.storage.from('reference-images').remove([path])
      await supabase.from('service_references').delete().eq('id', ref.id)
      await fetchRefs()
      onChange?.()
    } catch (err) {
      console.error(err)
    }
  }

  if (loadingRefs) return <div className={styles.loading}><Loader size={18} className={styles.spin} /> Laddar...</div>

  return (
    <div className={styles.uploader}>
      <div className={styles.uploader__header}>
        <h3 className={styles.uploader__title}>Referensbilder</h3>
        <span className={styles.uploader__count}>{refs.length}/5</span>
      </div>

      {/* Grid */}
      {refs.length > 0 && (
        <div className={styles.uploader__grid}>
          {refs.map(ref => (
            <div key={ref.id} className={styles.uploader__thumb}>
              <img src={ref.image_url} alt={ref.title} className={styles.uploader__thumb_img} />
              <div className={styles.uploader__thumb_overlay}>
                <span className={styles.uploader__thumb_title}>{ref.title}</span>
                <div className={styles.uploader__thumb_actions}>
                  <button
                    type="button"
                    className={styles.uploader__icon_btn}
                    onClick={() => handleDelete(ref)}
                    title="Ta bort"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {isAdding ? (
        <div className={styles.uploader__form}>
          <div className={styles.uploader__form_field}>
            <label className={styles.uploader__label}>Bild *</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.uploader__file_input}
            />
            {preview && (
              <img src={preview} alt="Förhandsgranskning" className={styles.uploader__preview} />
            )}
          </div>
          <div className={styles.uploader__form_field}>
            <label className={styles.uploader__label}>Titel * <span className={styles.uploader__hint}>({title.length}/60)</span></label>
            <input
              type="text"
              className={styles.uploader__input}
              placeholder="T.ex. Badrumsrenovering i Stockholm"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, 60))}
            />
          </div>
          <div className={styles.uploader__form_field}>
            <label className={styles.uploader__label}>Beskrivning <span className={styles.uploader__hint}>valfri ({description.length}/200)</span></label>
            <textarea
              className={`${styles.uploader__input} ${styles.uploader__textarea}`}
              placeholder="Berätta mer om projektet..."
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 200))}
              rows={3}
            />
          </div>
          <div className={styles.uploader__form_actions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={uploading || !file || !title.trim()}
            >
              {uploading ? <><Loader size={15} className={styles.spin} /> Laddar upp...</> : 'Spara bild'}
            </button>
            <button type="button" className="btn btn-outline" onClick={resetForm} disabled={uploading}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        refs.length < 5 && (
          <button type="button" className={styles.uploader__add_btn} onClick={() => setIsAdding(true)}>
            <Plus size={16} /> Lägg till referens
          </button>
        )
      )}

      {refs.length === 0 && !isAdding && (
        <p className={styles.uploader__empty}>
          Inga referensbilder ännu. Lägg till bilder som visar ditt arbete.
        </p>
      )}
    </div>
  )
}
