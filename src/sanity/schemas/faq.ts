import { defineField, defineType } from 'sanity'

export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: 'Fråga', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'answer', title: 'Svar', type: 'text', rows: 5, validation: Rule => Rule.required() }),
    defineField({
      name: 'category',
      title: 'Kategori',
      type: 'string',
      options: {
        list: [
          { title: 'Beställare', value: 'bestellare' },
          { title: 'Svippare', value: 'svippare' },
          { title: 'Företag', value: 'foretag' },
          { title: 'Generell', value: 'generell' },
        ],
      },
      validation: Rule => Rule.required(),
    }),
    defineField({ name: 'order', title: 'Sorteringsordning', type: 'number' }),
  ],
  orderings: [{ title: 'Kategori + ordning', name: 'categoryOrder', by: [{ field: 'category', direction: 'asc' }, { field: 'order', direction: 'asc' }] }],
})
