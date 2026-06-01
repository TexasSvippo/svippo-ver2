import { groq } from 'next-sanity'

export const blogPostsQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, category, targetRole, publishedAt,
    mainImage { asset->{ url } },
    seoTitle, seoDescription
  }
`

export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, excerpt, body, category, targetRole, publishedAt,
    mainImage { asset->{ url } },
    seoTitle, seoDescription
  }
`

export const faqQuery = groq`
  *[_type == "faq"] | order(category asc, order asc) {
    _id, question, answer, category, order
  }
`

export const dashboardTipsQuery = groq`
  *[_type == "dashboardTip" && ($role in targetRole || "alla" in targetRole)] | order(publishedAt desc) {
    _id, title, body, targetRole, icon, publishedAt
  }
`

export const helpArticlesQuery = groq`
  *[_type == "helpArticle"] | order(publishedAt desc) {
    _id, title, slug, category, publishedAt
  }
`
