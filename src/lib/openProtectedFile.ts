import { authHeaders } from '@/lib/authHeaders'

// Opens a file served by one of our Bearer-protected /api/files/* routes.
// A plain <a href> can't send the Authorization header, so we fetch a
// short-lived signed URL first. The new tab is opened synchronously on the
// click (so popup blockers allow it) and pointed at the file once the URL arrives.
export async function openProtectedFile(endpoint: string) {
  const win = window.open('', '_blank')
  try {
    const res = await fetch(endpoint, { headers: await authHeaders(), cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { url } = (await res.json()) as { url: string }
    if (win) win.location.href = url
    else window.location.href = url
  } catch (err) {
    console.error('Could not open file:', err)
    win?.close()
    alert('Filen kunde inte öppnas. Försök igen.')
  }
}
