import { defineField, defineType } from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blogginlägg',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Rubrik', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: Rule => Rule.required() }),
    defineField({ name: 'excerpt', title: 'Ingress', type: 'text', rows: 3 }),
    defineField({
      name: 'body',
      title: 'Innehåll',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'category', title: 'Kategori', type: 'string' }),
    defineField({
      name: 'targetRole',
      title: 'Målgrupp',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Alla', value: 'alla' },
          { title: 'Beställare', value: 'bestellare' },
          { title: 'Svippare', value: 'svippare' },
          { title: 'Företag', value: 'foretag' },
          { title: 'UF-företag', value: 'uf-foretag' },
        ],
      },
    }),
    defineField({ name: 'publishedAt', title: 'Publicerat', type: 'datetime' }),
    defineField({ name: 'mainImage', title: 'Huvudbild', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'seoTitle', title: 'SEO-rubrik', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO-beskrivning', type: 'text', rows: 2 }),
  ],
  orderings: [{ title: 'Publicerat (nyast)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
})
