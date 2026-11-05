import { supabase } from '@/lib/supabase'
import { authHeaders } from '@/lib/authHeaders'

export type ReportTargetType = 'service' | 'request'

type SubmitReportParams = {
  reporterId: string | null
  targetType: ReportTargetType
  targetId: string
  reason: string
  message?: string
}

export async function submitReport({ reporterId, targetType, targetId, reason, message }: SubmitReportParams) {
  // Generate the id client-side and skip .select() after insert: the SELECT
  // policy on `reports` is admin-only by design, so a non-admin reporter
  // can never read back their own just-inserted row via RETURNING — asking
  // for it here would make PostgREST report the insert itself as an RLS
  // violation even though the insert succeeded.
  const id = crypto.randomUUID()

  const { error } = await supabase
    .from('reports')
    .insert({
      id,
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      message: message?.trim() || null,
      status: 'open',
      created_at: new Date().toISOString(),
    })

  if (error) throw error

  // Everything in the email is read server-side from the reports row.
  // The token is empty for anonymous reporters, which the route allows.
  fetch('/api/reports/notify-email', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ reportId: id }),
  }).catch(err => console.error('Report email notification error:', err))

  return { id }
}
