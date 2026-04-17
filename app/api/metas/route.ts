import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

function parsePeriodo(raw: string): { periodoDate: string; start: string; end: string } | null {
  if (!/^\d{4}-\d{2}$/.test(raw)) return null
  const [y, m] = raw.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end   = new Date(Date.UTC(y, m,     1))
  return { periodoDate: `${raw}-01`, start: start.toISOString(), end: end.toISOString() }
}

export async function GET(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const rawPeriodo = request.nextUrl.searchParams.get('periodo') ??
    `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const parsed = parsePeriodo(rawPeriodo)
  if (!parsed) return NextResponse.json({ error: 'periodo inválido (use YYYY-MM)' }, { status: 400 })
  const { periodoDate, start, end } = parsed

  const supabase = createAdminClient()

  const [metasRes, candidatosRes, contratadosRes, leadsRes] = await Promise.all([
    supabase.rpc('get_meta_por_periodo', { p_periodo: periodoDate }),
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }).gte('created_at', start).lt('created_at', end),
    supabase.rpc('count_contratados_no_periodo', { p_start: start, p_end: end }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', start).lt('created_at', end),
  ])

  const metasRow = Array.isArray(metasRes.data) ? (metasRes.data[0] ?? null) : null
  const realizado_leads = leadsRes.count ?? 0
  const verba = Number(metasRow?.verba_investida ?? 0)
  const realizado_cpl = realizado_leads > 0 && verba > 0
    ? Math.round((verba / realizado_leads) * 100) / 100
    : null

  return NextResponse.json({
    periodo: rawPeriodo,
    metas:   metasRow,
    realizado: {
      candidatos:   candidatosRes.count ?? 0,
      contratacoes: (contratadosRes.data as number | null) ?? 0,
      leads:        realizado_leads,
      cpl:          realizado_cpl,
    },
  })
}

export async function POST(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { periodo, meta_candidatos, meta_contratacoes, meta_leads, verba_investida, meta_cpl } = body

  const parsed = parsePeriodo(periodo ?? '')
  if (!parsed) return NextResponse.json({ error: 'periodo inválido (use YYYY-MM)' }, { status: 400 })

  const { data, error } = await createAdminClient().rpc('upsert_meta', {
    p_periodo:           parsed.periodoDate,
    p_meta_candidatos:   meta_candidatos   ?? null,
    p_meta_contratacoes: meta_contratacoes ?? null,
    p_meta_leads:        meta_leads        ?? null,
    p_verba_investida:   verba_investida   ?? null,
    p_meta_cpl:          meta_cpl          ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const row = Array.isArray(data) ? (data[0] ?? null) : null
  if (!row) return NextResponse.json({ error: 'Nenhum registro retornado pelo upsert' }, { status: 500 })
  return NextResponse.json(row)
}
