import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

export type CanalQualidade = {
  canal: string
  leads: number
  contactados: number
  videos: number
  aprovados: number
  contratados: number
  taxa: number
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const [aplicacaoRes, feedbackRes] = await Promise.all([
    supabase.from('aplicacao').select('email, utm_source'),
    db.schema('dashboard').from('feedback_candidatos').select('candidato_email, status'),
  ])

  const feedbackMap: Record<string, string> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(feedbackRes.data ?? []).forEach((f: any) => { feedbackMap[f.candidato_email] = f.status })

  const stats: Record<string, CanalQualidade> = {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(aplicacaoRes.data ?? []).forEach((a: any) => {
    const canal = a.utm_source || 'Direto'
    if (!stats[canal]) {
      stats[canal] = { canal, leads: 0, contactados: 0, videos: 0, aprovados: 0, contratados: 0, taxa: 0 }
    }
    const s = stats[canal]
    s.leads++
    const st = feedbackMap[a.email]
    if (st && ['contactado', 'video_enviado', 'aprovado_triagem', 'contratado'].includes(st)) s.contactados++
    if (st && ['video_enviado', 'aprovado_triagem', 'contratado'].includes(st)) s.videos++
    if (st && ['aprovado_triagem', 'contratado'].includes(st)) s.aprovados++
    if (st === 'contratado') s.contratados++
  })

  const rows: CanalQualidade[] = Object.values(stats)
    .map(s => ({ ...s, taxa: s.leads > 0 ? Math.round((s.contratados / s.leads) * 100) : 0 }))
    .sort((a, b) => b.leads - a.leads)

  return NextResponse.json(rows)
}
