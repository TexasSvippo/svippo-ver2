import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireUser } from '@/lib/requireUser'
import { toStoragePath } from '@/lib/storagePaths'

const BUCKET = 'certificates'
const SIGNED_URL_SECONDS = 60

// Certificates may be viewed by any signed-in user (the owner, admin and other
// members who see them on profiles and service pages). The bucket is private;
// this route hands out a short-lived signed URL for one certificate at a time,
// so files can't be listed or guessed.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(req)
  if ('response' in auth) return auth.response

  const { id } = await params
  const { data: cert } = await supabaseAdmin
    .from('certificates')
    .select('user_id, file_url')
    .eq('id', id)
    .maybeSingle()

  const path = toStoragePath(cert?.file_url, BUCKET)
  // The file must live in its owner's folder (<user_id>/...).
  if (!cert || !path || !path.startsWith(`${cert.user_id}/`)) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS)
  if (error || !data) {
    console.error('[files/certificate] signing failed:', error?.message)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ url: data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } })
}
