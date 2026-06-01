import Link from 'next/link'
import { sanityClient } from '@/sanity/client'
import { blogPostsQuery } from '@/sanity/queries'
import styles from './blogg.module.scss'

type BlogPost = {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  category?: string
  publishedAt?: string
  mainImage?: { asset: { url: string } }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export const metadata = {
  title: 'Blogg – Svippo',
  description: 'Tips, nyheter och inspiration från Svippo.',
}

export default async function BloggPage() {
  const posts: BlogPost[] = await sanityClient.fetch(blogPostsQuery)

  return (
    <div className={styles.blogg}>
      <div className={`container ${styles.blogg__inner}`}>

        <div className={styles.blogg__header}>
          <h1 className={styles.blogg__title}>Blogg</h1>
          <p className={styles.blogg__subtitle}>Tips, nyheter och inspiration från Svippo</p>
        </div>

        {posts.length === 0 ? (
          <div className={styles.blogg__empty}>
            <p>Inga inlägg publicerade ännu. Kom tillbaka snart!</p>
          </div>
        ) : (
          <div className={styles.blogg__grid}>
            {posts.map(post => (
              <Link href={`/blogg/${post.slug.current}`} key={post._id} className={styles.blogg__card}>
                <div className={styles.blogg__card_img_wrap}>
                  {post.mainImage?.asset?.url
                    ? <img src={post.mainImage.asset.url} alt={post.title} className={styles.blogg__card_img} />
                    : <div className={styles.blogg__card_img_fallback} />
                  }
                </div>
                <div className={styles.blogg__card_body}>
                  {post.category && <span className={styles.blogg__card_badge}>{post.category}</span>}
                  <h2 className={styles.blogg__card_title}>{post.title}</h2>
                  {post.excerpt && <p className={styles.blogg__card_excerpt}>{post.excerpt}</p>}
                  {post.publishedAt && (
                    <span className={styles.blogg__card_date}>{formatDate(post.publishedAt)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
