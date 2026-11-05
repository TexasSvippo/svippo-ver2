import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser, isAdmin, forbidden } from '@/lib/requireUser'
import { toStoragePath } from '@/lib/storagePaths'

const BUCKET = 'certificates'

// Deletes a certificate (file + row). Owner or admin. Done server-side so the
// client needs no storage delete rights on the (private) certificates bucket.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if ('response' in auth) return auth.response
  const { user } = auth

  const { id } = await params
  const { data: cert } = await supabaseAdmin
    .from('certificates')
    .select('id, user_id, file_url')
    .eq('id', id)
    .maybeSingle()

  if (!cert) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  if (cert.user_id !== user.id && !(await isAdmin(user.id))) return forbidden()

  const path = toStoragePath(cert.file_url, BUCKET)
  if (path && path.startsWith(`${cert.user_id}/`)) {
    const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (removeError) console.error('[certificates/delete] file removal failed:', removeError.message)
  }

  const { error: deleteError } = await supabaseAdmin.from('certificates').delete().eq('id', cert.id)
  if (deleteError) {
    console.error('[certificates/delete] row delete failed:', deleteError.message)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
