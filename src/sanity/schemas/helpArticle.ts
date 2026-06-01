import { defineField, defineType } from 'sanity'

export const helpArticle = defineType({
  name: 'helpArticle',
  title: 'Hjälpartiklar',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Rubrik', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: Rule => Rule.required() }),
    defineField({
      name: 'body',
      title: 'Innehåll',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'category', title: 'Kategori', type: 'string' }),
    defineField({ name: 'publishedAt', title: 'Publicerat', type: 'datetime' }),
  ],
  orderings: [{ title: 'Publicerat (nyast)', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
})
