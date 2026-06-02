'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import styles from './RichTextEditor.module.scss'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions we don't want
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        // Keep: bold, italic, bulletList, orderedList, heading (limited to h3)
        heading: { levels: [3] },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: styles.editor_area,
        'data-placeholder': placeholder ?? 'Beskriv vad du erbjuder, din erfarenhet och vad som ingår...',
      },
    },
  })

  // Sync external value changes (e.g. when editing an existing service)
  useEffect(() => {
    if (!editor) return
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`${styles.toolbar_btn} ${active ? styles['toolbar_btn--active'] : ''}`}
      title={title}
    >
      {children}
    </button>
  )

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Fetstil"
        >
          <strong>B</strong>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Kursiv"
        >
          <em>I</em>
        </ToolbarButton>

        <div className={styles.toolbar_sep} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Rubrik"
        >
          H3
        </ToolbarButton>

        <div className={styles.toolbar_sep} />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Punktlista"
        >
          • —
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numrerad lista"
        >
          1. —
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}
