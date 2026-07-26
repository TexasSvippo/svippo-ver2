import { supabase } from '@/lib/supabase'

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

  fetch('/api/reports/notify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId: id, targetType, targetId, reason }),
  }).catch(err => console.error('Report email notification error:', err))

  return { id }
}
