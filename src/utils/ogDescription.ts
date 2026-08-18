const MAX_LENGTH = 155

// Strips HTML tags (description fields may contain rich text from TipTap,
// same regex already used in ServiceDetailClient.tsx) and truncates at the
// last whole word within MAX_LENGTH, rather than cutting mid-word/mid-tag.
export function stripToOgDescription(raw: string | null | undefined, fallback: string): string {
  const text = (raw ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (!text) return fallback
  if (text.length <= MAX_LENGTH) return text

  const truncated = text.slice(0, MAX_LENGTH)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}…`
}
