import sanitize from 'sanitize-html'

// Allowlist matches exactly what RichTextEditor.tsx's TipTap config can
// produce (bold, italic, h3, bullet/ordered lists, paragraphs, line
// breaks) -- nothing else, and no attributes at all (not even data-*/aria-*).
//
// sanitize-html is pure JS (htmlparser2, no DOM), so this same function runs
// on the server and in the browser. Used as two independent layers:
// - on save, in create-service/page.tsx (client), plus its preview;
// - on render, in service/[id]/page.tsx (server component), which passes the
//   sanitized HTML to ServiceDetailClient. Render-time sanitizing is the real
//   protection: save-time sanitizing runs in the browser and can be bypassed
//   by writing to Supabase directly.
const ALLOWED_TAGS = ['p', 'strong', 'em', 'h3', 'ul', 'ol', 'li', 'br']

// Disallowed tags are dropped but their text is kept, except these, which are
// dropped together with their content (mirrors DOMPurify's behaviour).
const DROP_WITH_CONTENT = [
  'script', 'style', 'textarea', 'noscript', 'iframe', 'svg', 'math',
  'template', 'object', 'title', 'xmp', 'noembed', 'noframes', 'select', 'option',
]

export function sanitizeDescriptionHtml(html: string | null | undefined): string {
  if (!html) return ''
  return sanitize(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    allowedSchemes: [],
    disallowedTagsMode: 'discard',
    nonTextTags: DROP_WITH_CONTENT,
    parseStyleAttributes: false,
  })
}
