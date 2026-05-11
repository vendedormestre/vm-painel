import { createAdminClient } from './supabase'
import { getPeriodDates, Period } from './data'

export type ProcessoAtivo = {
  codigo_ps: string
  cargo: string
  empresa: string
}

export async function getProcessosAtivos(): Promise<ProcessoAtivo[]> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .schema('dashboard')
    .from('processos_seletivos')
    .select('codigo_ps, cargo, empresa')
    .eq('ativo_meta', true)
    .order('codigo_ps')
  return (data ?? []) as ProcessoAtivo[]
}

export async function getProcessoKpis(codigoPs: string, period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)
  const dateFrom = start.split('T')[0]
  const dateTo = end.split('T')[0]

  const [candidatosRes, videosRes, contratadosRes, metaRes] = await Promise.all([
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs)
      .gte('created_at', start)
      .lte('created_at', end),
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs)
      .gte('created_at', start)
      .lte('created_at', end)
      .not('link_video', 'is', null),
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs)
      .gte('created_at', start)
      .lte('created_at', end)
      .eq('status_processo', 'contratado'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .schema('dashboard')
      .from('meta_reports')
      .select('gasto')
      .eq('codigo_ps', codigoPs)
      .gte('data_relatorio', dateFrom)
      .lte('data_relatorio', dateTo),
  ])

  const totalCandidatos = candidatosRes.count ?? 0
  const videosEnviados = videosRes.count ?? 0
  const contratados = contratadosRes.count ?? 0
  const reports = (metaRes.data ?? []) as { gasto: number | null }[]
  const totalGasto = reports.reduce((s, r) => s + (Number(r.gasto) || 0), 0)

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const cpl = totalCandidatos === 0 ? '—' : fmt(totalGasto / totalCandidatos)

  return { totalCandidatos, videosEnviados, contratados, cpl }
}

export async function getProcessoDailyVolume(codigoPs: string, period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)

  const { data } = await supabase
    .from('aplicacao')
    .select('created_at')
    .eq('codigo_ps', codigoPs)
    .gte('created_at', start)
    .lte('created_at', end)

  const grouped: Record<string, number> = {}
  data?.forEach(row => {
    const date = (row.created_at as string).split('T')[0]
    grouped[date] = (grouped[date] || 0) + 1
  })

  return Object.entries(grouped)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getProcessoChannelData(codigoPs: string, period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)

  const { data } = await supabase
    .from('aplicacao')
    .select('utm_source')
    .eq('codigo_ps', codigoPs)
    .gte('created_at', start)
    .lte('created_at', end)
    .not('utm_source', 'is', null)

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

export async function getProcessoFunnelData(codigoPs: string, period: Period) {
  const supabase = createAdminClient()
  const { start, end } = getPeriodDates(period)

  const base = () =>
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs)
      .gte('created_at', start)
      .lte('created_at', end)

  const [total, contactados, videos, aprovados, contratados] = await Promise.all([
    base(),
    base().eq('status_processo', 'contactado'),
    base().not('link_video', 'is', null),
    base().eq('status_processo', 'aprovado'),
    base().eq('status_processo', 'contratado'),
  ])

  return [
    { label: 'Cadastrados', count: total.count ?? 0 },
    { label: 'Contactados', count: contactados.count ?? 0 },
    { label: 'Vídeo enviado', count: videos.count ?? 0 },
    { label: 'Aprovados', count: aprovados.count ?? 0 },
    { label: 'Contratados', count: contratados.count ?? 0 },
  ]
}

export type ProcessoInfoData = {
  cargo: string
  empresa: string
  data_inicio: string | null
  vagas_abertas: number | null
  meta_contratacoes: number | null
  investimento_total: number
  cpl_historico: string
  custo_por_contratacao: string
}

export async function getProcessoInfo(codigoPs: string): Promise<ProcessoInfoData> {
  const supabase = createAdminClient()

  const [processoRes, metaRes, candRes, contratRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .schema('dashboard')
      .from('processos_seletivos')
      .select('cargo, empresa, data_inicio, vagas_abertas, meta_contratacoes')
      .eq('codigo_ps', codigoPs)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .schema('dashboard')
      .from('meta_reports')
      .select('gasto')
      .eq('codigo_ps', codigoPs),
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs),
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs)
      .eq('status_processo', 'contratado'),
  ])

  const p = processoRes.data ?? {}
  const reports = (metaRes.data ?? []) as { gasto: number | null }[]
  const investimento = reports.reduce((s, r) => s + (Number(r.gasto) || 0), 0)
  const totalCandidatos = candRes.count ?? 0
  const totalContratados = contratRes.count ?? 0

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return {
    cargo: p.cargo ?? '',
    empresa: p.empresa ?? '',
    data_inicio: p.data_inicio ?? null,
    vagas_abertas: p.vagas_abertas ?? null,
    meta_contratacoes: p.meta_contratacoes ?? null,
    investimento_total: investimento,
    cpl_historico: totalCandidatos > 0 ? fmt(investimento / totalCandidatos) : '—',
    custo_por_contratacao: totalContratados > 0 ? fmt(investimento / totalContratados) : '—',
  }
}

export type ProcessoMetasData = {
  meta_candidatos: number
  meta_cpl: number
  meta_videos: number
  meta_contratacoes: number
  total_candidatos: number
  total_videos: number
  total_contratados: number
  cpl_historico: number | null
}

export async function getProcessoMetas(codigoPs: string): Promise<ProcessoMetasData> {
  const supabase = createAdminClient()

  const [processoRes, metaRes, candRes, videoRes, contratRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .schema('dashboard')
      .from('processos_seletivos')
      .select('meta_candidatos, meta_cpl, meta_videos, meta_contratacoes')
      .eq('codigo_ps', codigoPs)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .schema('dashboard')
      .from('meta_reports')
      .select('gasto')
      .eq('codigo_ps', codigoPs),
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs),
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs)
      .not('link_video', 'is', null),
    supabase
      .from('aplicacao')
      .select('*', { count: 'exact', head: true })
      .eq('codigo_ps', codigoPs)
      .eq('status_processo', 'contratado'),
  ])

  const p = processoRes.data ?? {}
  const reports = (metaRes.data ?? []) as { gasto: number | null }[]
  const investimento = reports.reduce((s, r) => s + (Number(r.gasto) || 0), 0)
  const totalCandidatos = candRes.count ?? 0

  return {
    meta_candidatos: p.meta_candidatos ?? 100,
    meta_cpl: Number(p.meta_cpl ?? 2.5),
    meta_videos: p.meta_videos ?? 40,
    meta_contratacoes: p.meta_contratacoes ?? 1,
    total_candidatos: totalCandidatos,
    total_videos: videoRes.count ?? 0,
    total_contratados: contratRes.count ?? 0,
    cpl_historico: totalCandidatos > 0 ? investimento / totalCandidatos : null,
  }
}
