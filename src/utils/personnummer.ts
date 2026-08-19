// Parses a Swedish personnummer (ÅÅÅÅMMDD-XXXX or ÅÅMMDD-XXXX) into an age
// in whole years. Returns null when the input doesn't match either format
// or doesn't resolve to a valid calendar date -- callers must treat null as
// "could not verify", not as "any age", since this is also used server-side
// to gate the 18+ requirement for becoming a svippare (become-svippare
// page + api/become-svippare/submit route.ts share this single
// implementation so client-side UX hints and server-side enforcement can
// never drift apart).
export function parseAgeFromPersonnummer(pnr: string): number | null {
  const cleaned = pnr.trim().replace(/\s/g, '')
  let year: number, month: number, day: number

  if (/^\d{8}[-+]?\d{4}$/.test(cleaned)) {
    year = parseInt(cleaned.substring(0, 4), 10)
    month = parseInt(cleaned.substring(4, 6), 10)
    day = parseInt(cleaned.substring(6, 8), 10)
  } else if (/^\d{6}[-+]?\d{4}$/.test(cleaned)) {
    const yy = parseInt(cleaned.substring(0, 2), 10)
    month = parseInt(cleaned.substring(2, 4), 10)
    day = parseInt(cleaned.substring(4, 6), 10)
    const currentYear2d = new Date().getFullYear() % 100
    year = yy <= currentYear2d ? 2000 + yy : 1900 + yy
  } else {
    return null
  }

  const birth = new Date(year, month - 1, day)
  if (isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}
