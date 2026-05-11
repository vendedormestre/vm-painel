import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => createAdminClient() as any

export async function GET() {
  const supabase = createAdminClient()
  const db = adminDb()

  const [aplicacaoRes, feedbackRes] = await Promise.all([
    supabase
      .from('aplicacao')
      .select('fullname, email, whatsapp, cargo, empresa, created_at, utm_source')
      .order('created_at', { ascending: false }),
    db.schema('dashboard').from('feedback_candidatos').select('candidato_email, status, updated_at, observacoes'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feedbackMap: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(feedbackRes.data ?? []).forEach((f: any) => { feedbackMap[f.candidato_email] = f })

  const now = Date.now()

  const queue = (aplicacaoRes.data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => {
      const fb = feedbackMap[a.email]
      return !fb || fb.status === 'novo'
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => {
      const fb = feedbackMap[a.email]
      const ref = fb?.updated_at ? new Date(fb.updated_at) : new Date(a.created_at)
      const dias = Math.floor((now - ref.getTime()) / 86400000)
      return {
        fullname:       a.fullname      ?? null,
        email:          a.email,
        whatsapp:       a.whatsapp      ?? null,
        cargo:          a.cargo         ?? null,
        empresa:        a.empresa       ?? null,
        created_at:     a.created_at,
        utm_source:     a.utm_source    ?? null,
        status_atual:   fb?.status      ?? 'novo',
        observacoes:    fb?.observacoes ?? '',
        dias_aguardando: dias,
      }
    })

  return NextResponse.json(queue)
}

// aprovado_triagem em feedback_candidatos corresponde a 'aprovado' em aplicacao.status_processo
const APLICACAO_STATUS_MAP: Record<string, string> = {
  aprovado_triagem: 'aprovado',
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const emails: string[] = body.emails ?? (body.email ? [body.email] : [])
  const { status, observacoes } = body

  if (emails.length === 0 || !status) {
    return NextResponse.json({ error: 'email(s) e status são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const records = emails.map(email => ({
    candidato_email: email,
    status,
    observacoes:     observacoes ?? null,
    updated_at:      now,
  }))

  const aplicacaoStatus = APLICACAO_STATUS_MAP[status] ?? status

  // Atualiza feedback_candidatos e aplicacao.status_processo em paralelo
  const [feedbackResult] = await Promise.all([
    adminDb()
      .schema('dashboard')
      .from('feedback_candidatos')
      .upsert(records, { onConflict: 'candidato_email' }),
    supabase
      .from('aplicacao')
      .update({ status_processo: aplicacaoStatus })
      .in('email', emails),
  ])

  if (feedbackResult.error) {
    return NextResponse.json({ error: feedbackResult.error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
