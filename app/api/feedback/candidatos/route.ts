import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => createAdminClient() as any

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createAdminClient()
  const db = adminDb()

  const [aplicacaoRes, feedbackRes] = await Promise.all([
    supabase
      .from('aplicacao')
      .select('fullname, email, whatsapp, cargo, empresa, created_at, utm_source')
      .order('created_at', { ascending: true }),
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

export async function POST(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, status, observacoes } = await request.json()
  if (!email || !status) {
    return NextResponse.json({ error: 'email e status são obrigatórios' }, { status: 400 })
  }

  const { error } = await adminDb()
    .schema('dashboard')
    .from('feedback_candidatos')
    .upsert(
      {
        candidato_email: email,
        status,
        observacoes:     observacoes ?? null,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: 'candidato_email' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
