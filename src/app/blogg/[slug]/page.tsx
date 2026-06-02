import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { sanityClient } from '@/sanity/client'
import { blogPostBySlugQuery } from '@/sanity/queries'
import styles from './blogpost.module.scss'

type Props = {
  params: Promise<{ slug: string }>
}

type BlogPost = {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  body?: PortableTextBlock[]
  category?: string
  publishedAt?: string
  mainImage?: { asset: { url: string } }
  seoTitle?: string
  seoDescription?: string
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post: BlogPost | null = await sanityClient.fetch(blogPostBySlugQuery, { slug })
  if (!post) return { title: 'Inlägg hittades inte – Svippo' }
  return {
    title: post.seoTitle ?? `${post.title} – Svippo`,
    description: post.seoDescription ?? post.excerpt,
  }
}

export default async function BloggPostPage({ params }: Props) {
  const { slug } = await params
  const post: BlogPost | null = await sanityClient.fetch(blogPostBySlugQuery, { slug })
  if (!post) notFound()

  return (
    <div className={styles.post}>
      <div className={styles.post__inner}>

        {/* Breadcrumbs */}
        <nav className={styles.post__bc}>
          <Link href="/" className={styles.post__bc_link}>Hem</Link>
          <span className={styles.post__bc_sep}>/</span>
          <Link href="/blogg" className={styles.post__bc_link}>Blogg</Link>
          <span className={styles.post__bc_sep}>/</span>
          <span className={styles.post__bc_active}>{post.title}</span>
        </nav>

        <article className={styles.post__article}>

          {/* 1. Kategori-badge */}
          {post.category && (
            <span className={styles.post__badge}>{post.category}</span>
          )}

          {/* 2. H1 */}
          <h1 className={styles.post__title}>{post.title}</h1>

          {/* 3. Ingress/excerpt */}
          {post.excerpt && (
            <p className={styles.post__excerpt}>{post.excerpt}</p>
          )}

          {/* 4. Publiceringsdatum */}
          {post.publishedAt && (
            <p className={styles.post__date}>{formatDate(post.publishedAt)}</p>
          )}

          {/* 5. Huvudbild */}
          {post.mainImage?.asset?.url && (
            <img
              src={post.mainImage.asset.url}
              alt={post.title}
              className={styles.post__image}
            />
          )}

          {/* 6. Brödtext */}
          {post.body && (
            <div className={styles.post__body}>
              <PortableText value={post.body} />
            </div>
          )}

          {/* 7. Tillbaka-länk */}
          <Link href="/blogg" className={styles.post__back}>
            ← Tillbaka till blogg
          </Link>

        </article>
      </div>
    </div>
  )
}
