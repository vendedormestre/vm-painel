import { createAdminClient } from './supabase'

export type Period = 'hoje' | '7d' | '30d' | 'mes'

// Brazil abolished DST in April 2019 — São Paulo is permanently UTC-3
const SP_OFFSET = '-03:00'

function spDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function getPeriodDates(period: Period) {
  // Resolve "today" in the São Paulo timezone, not UTC
  const todaySP = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  const [year, month, day] = todaySP.split('-').map(Number)

  const startOf = (s: string) => new Date(`${s}T00:00:00.000${SP_OFFSET}`)
  const endOf   = (s: string) => new Date(`${s}T23:59:59.999${SP_OFFSET}`)

  let start: Date
  switch (period) {
    case 'hoje':
      start = startOf(todaySP)
      break
    case '7d': {
      const d = new Date(year, month - 1, day - 6)
      start = startOf(spDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate()))
      break
    }
    case '30d': {
      const d = new Date(year, month - 1, day - 29)
      start = startOf(spDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate()))
      break
    }
    default: // 'mes'
      start = startOf(spDateStr(year, month, 1))
  }

  const end = endOf(todaySP)
  const monthPeriod = `${year}-${String(month).padStart(2, '0')}`
  return { start: start.toISOString(), end: end.toISOString(), monthPeriod }
}

export async function getKpiData(period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)
  const dateFrom = start.split('T')[0]
  const dateTo   = end.split('T')[0]

  const [candidatosRes, videosRes, feedbackRes, metaReportsRes] = await Promise.all([
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
    supabase.from('aplicacao').select('*', { count: 'exact', head: true })
      .gte('created_at', start).lte('created_at', end)
      .not('link_video', 'is', null).neq('link_video', ''),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).schema('dashboard').from('feedback_candidatos').select('status'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).schema('dashboard').from('meta_reports').select('verba_gasta').gte('data_relatorio', dateFrom).lte('data_relatorio', dateTo),
  ])

  const totalCandidatos = candidatosRes.count ?? 0
  const videosEnviados = videosRes.count ?? 0
  const feedbacks: { status: string }[] = feedbackRes.data ?? []
  const contratados = feedbacks.filter(f => f.status === 'contratado').length

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const metaReports = (metaReportsRes.data ?? []) as { verba_gasta: number | null }[]
  const hasMetaData = metaReports.length > 0
  const totalVerba = metaReports.reduce((s, r) => s + (Number(r.verba_gasta) || 0), 0)
  const cpl = hasMetaData && totalCandidatos > 0 ? fmt(totalVerba / totalCandidatos) : null
  const cplSub = !hasMetaData ? 'Sem dados de campanha' : undefined

  return { totalCandidatos, videosEnviados, contratados, cpl, cplSub }
}

export async function getDailyVolume(period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)

  const { data } = await supabase.from('aplicacao').select('created_at').gte('created_at', start).lte('created_at', end)

  const grouped: Record<string, number> = {}
  data?.forEach(row => {
    const date = (row.created_at as string).split('T')[0]
    grouped[date] = (grouped[date] || 0) + 1
  })

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getFunnelData(period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)

  const [{ count: total }, feedbackRes] = await Promise.all([
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).schema('dashboard').from('feedback_candidatos').select('status'),
  ])

  const feedbacks: { status: string }[] = feedbackRes.data ?? []
  const cnt = (s: string[]) => feedbacks.filter(f => s.includes(f.status)).length

  return [
    { label: 'Cadastrados', count: total ?? 0 },
    { label: 'Contactados', count: cnt(['contactado', 'video_enviado', 'aprovado_triagem', 'contratado']) },
    { label: 'Vídeo enviado', count: cnt(['video_enviado', 'aprovado_triagem', 'contratado']) },
    { label: 'Aprovados', count: cnt(['aprovado_triagem', 'contratado']) },
    { label: 'Contratados', count: cnt(['contratado']) },
  ]
}

export async function getChannelData(period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)

  const { data } = await supabase.from('aplicacao').select('utm_source').gte('created_at', start).lte('created_at', end)

  const grouped: Record<string, number> = {}
  data?.forEach(row => {
    const source = (row.utm_source as string) || 'Direto'
    grouped[source] = (grouped[source] || 0) + 1
  })

  return Object.entries(grouped)
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export type Candidate = {
  fullname: string | null
  email: string
  cargo: string | null
  empresa: string | null
  whatsapp: string | null
  utm_source: string | null
  created_at: string
  status_atual: string
}

export async function getCandidates(
  period: Period,
  page: number = 1,
  filters: { cargo?: string; empresa?: string; status?: string } = {},
  pageSize: number = 20
) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)
  const offset = (page - 1) * pageSize

  let emailFilter: string[] | null = null
  if (filters.status && filters.status !== 'novo') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).schema('dashboard')
      .from('feedback_candidatos')
      .select('candidato_email')
      .eq('status', filters.status)
    emailFilter = (data as { candidato_email: string }[])?.map(f => f.candidato_email) ?? []
    if (emailFilter.length === 0) return { candidates: [] as Candidate[], total: 0, pages: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('aplicacao')
    .select('fullname, email, cargo, empresa, whatsapp, utm_source, created_at', { count: 'exact' })
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (filters.cargo) query = query.eq('cargo', filters.cargo)
  if (filters.empresa) query = query.eq('empresa', filters.empresa)
  if (emailFilter !== null) query = query.in('email', emailFilter)

  const { data: rows, count } = await query.range(offset, offset + pageSize - 1)

  const emails: string[] = (rows as { email: string }[])?.map(r => r.email).filter(Boolean) ?? []
  const statusMap: Record<string, string> = {}

  if (emails.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedbacks } = await (supabase as any).schema('dashboard')
      .from('feedback_candidatos')
      .select('candidato_email, status')
      .in('candidato_email', emails)
    ;(feedbacks as { candidato_email: string; status: string }[])?.forEach(f => {
      statusMap[f.candidato_email] = f.status
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let candidates: Candidate[] = (rows as any[])?.map(r => ({
    ...r,
    status_atual: statusMap[r.email] ?? 'novo',
  })) ?? []

  if (filters.status === 'novo') {
    candidates = candidates.filter(c => c.status_atual === 'novo')
  }

  return { candidates, total: count ?? 0, pages: Math.ceil((count ?? 0) / pageSize), pageSize }
}

export async function getCandidateFilters() {
  const supabase = createAdminClient()
  const [{ data: cargoRows }, { data: empresaRows }] = await Promise.all([
    supabase.from('aplicacao').select('cargo').not('cargo', 'is', null),
    supabase.from('aplicacao').select('empresa').not('empresa', 'is', null),
  ])

  const cargos = [...new Set((cargoRows as { cargo: string }[])?.map(r => r.cargo).filter(Boolean) ?? [])].sort()
  const empresas = [...new Set((empresaRows as { empresa: string }[])?.map(r => r.empresa).filter(Boolean) ?? [])].sort()
  return { cargos, empresas }
}
