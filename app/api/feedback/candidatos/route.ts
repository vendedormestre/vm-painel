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
      .select('id, fullname, email, whatsapp, cargo, empresa, created_at, utm_source, status, informacoes_relevantes, codigo_ps, link_video')
      .order('created_at', { ascending: false }),
    db.schema('dashboard').from('feedback_candidatos').select('candidato_email, status, updated_at'),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const feedbackMap: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(feedbackRes.data ?? []).forEach((f: any) => { feedbackMap[f.candidato_email] = f })

  const now = Date.now()

  const queue = (aplicacaoRes.data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((a: any) => {
      const status = a.status ?? 'novo'
      return status === 'novo' || status === 'contactado' || status === 'video_enviado'
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => {
      const fb = feedbackMap[a.email]
      const ref = fb?.updated_at ? new Date(fb.updated_at) : new Date(a.created_at)
      const dias = Math.floor((now - ref.getTime()) / 86400000)
      return {
        id:              a.id,
        fullname:        a.fullname              ?? null,
        email:           a.email,
        whatsapp:        a.whatsapp              ?? null,
        cargo:           a.cargo                 ?? null,
        empresa:         a.empresa               ?? null,
        created_at:      a.created_at,
        utm_source:      a.utm_source            ?? null,
        codigo_ps:       a.codigo_ps             ?? null,
        link_video:      a.link_video            ?? null,
        status_atual:    a.status                ?? 'novo',
        informacoes_relevantes: a.informacoes_relevantes ?? '',
        dias_aguardando: dias,
      }
    })

  return NextResponse.json(queue)
}

// Maps feedback status values → aplicacao.status values
const APLICACAO_STATUS_MAP: Record<string, string> = {
  aprovado_triagem: 'aprovado',
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { status, informacoes_relevantes, id } = body
  const emails: string[] = body.emails ?? (body.email ? [body.email] : [])

  if (emails.length === 0 || !status) {
    return NextResponse.json({ error: 'email(s) e status são obrigatórios' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const records = emails.map(email => ({
    candidato_email: email,
    status,
    updated_at: now,
  }))

  const aplicacaoStatus = APLICACAO_STATUS_MAP[status] ?? status

  const updates: Promise<unknown>[] = [
    adminDb()
      .schema('dashboard')
      .from('feedback_candidatos')
      .upsert(records, { onConflict: 'candidato_email' }),
  ]

  if (id) {
    // Single record update — use id for precision
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = { status: aplicacaoStatus }
    if (informacoes_relevantes !== undefined) patch.informacoes_relevantes = informacoes_relevantes
    updates.push(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('aplicacao').update(patch).eq('id', id) as any
    )
  } else {
    updates.push(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase.from('aplicacao').update({ status: aplicacaoStatus }).in('email', emails) as any
    )
  }

  const [feedbackResult] = await Promise.all(updates)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((feedbackResult as any)?.error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return NextResponse.json({ error: (feedbackResult as any).error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
