import DOMPurify from 'isomorphic-dompurify'

// Allowlist matches exactly what RichTextEditor.tsx's TipTap config can
// produce (bold, italic, h3, bullet/ordered lists, paragraphs, line
// breaks) -- nothing else, so no attributes are needed at all. Used both
// when saving a description (create-service/page.tsx) and when rendering
// one (ServiceDetailClient.tsx) as two independent layers: sanitizing on
// save keeps malicious markup out of the database in the first place;
// sanitizing on render protects against any row written before this existed
// or by any other path that bypasses the save-time check.
const ALLOWED_TAGS = ['p', 'strong', 'em', 'h3', 'ul', 'ol', 'li', 'br']

export function sanitizeDescriptionHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] })
}
