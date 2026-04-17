import { createAdminClient } from './supabase'

export type Period = 'hoje' | '7d' | '30d' | 'mes'

export function getPeriodDates(period: Period) {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  let start: Date
  switch (period) {
    case 'hoje':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case '7d':
      start = new Date(now)
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      break
    case '30d':
      start = new Date(now)
      start.setDate(start.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  const monthPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return { start: start.toISOString(), end: end.toISOString(), monthPeriod }
}

export async function getKpiData(period: Period) {
  const supabase = createAdminClient()
  const { start, end, monthPeriod } = getPeriodDates(period)

  const [candidatosRes, leadsRes, feedbackRes, metaRes] = await Promise.all([
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).schema('dashboard').from('feedback_candidatos').select('status'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).schema('dashboard').from('metas').select('verba_investida').eq('periodo', monthPeriod).maybeSingle(),
  ])

  const totalCandidatos = candidatosRes.count ?? 0
  const totalLeads = leadsRes.count ?? 0
  const feedbacks: { status: string }[] = feedbackRes.data ?? []
  const verba: number | null = metaRes.data?.verba_investida ?? null

  const contactadosOuSuperior = feedbacks.filter(f =>
    ['contactado', 'video_enviado', 'aprovado_triagem', 'contratado'].includes(f.status)
  ).length
  const contratados = feedbacks.filter(f => f.status === 'contratado').length
  const taxaContato = totalCandidatos > 0 ? Math.round((contactadosOuSuperior / totalCandidatos) * 100) : 0

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const cpl = verba && totalCandidatos > 0 ? fmt(verba / totalCandidatos) : null
  const custoContratacao = verba && contratados > 0 ? fmt(verba / contratados) : null

  return { totalCandidatos, totalLeads, taxaContato, contratados, cpl, custoContratacao }
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
