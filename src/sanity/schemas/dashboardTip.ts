import { defineField, defineType } from 'sanity'

export const dashboardTip = defineType({
  name: 'dashboardTip',
  title: 'Dashboard-tips',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Rubrik', type: 'string', validation: Rule => Rule.required() }),
    defineField({
      name: 'body',
      title: 'Innehåll',
      type: 'array',
      of: [{ type: 'block' }],
    }),
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
    defineField({ name: 'icon', title: 'Ikon (Lucide-namn)', type: 'string' }),
    defineField({ name: 'publishedAt', title: 'Publicerat', type: 'datetime' }),
  ],
})
