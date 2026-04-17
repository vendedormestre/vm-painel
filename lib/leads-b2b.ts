import { createAdminClient } from './supabase'
import { Period, getPeriodDates } from './data'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

export type LeadB2B = {
  nome: string | null
  email: string
  empresa: string | null
  whatsapp: string | null
  created_at: string
  utm_source: string | null
  status_atual: string
}

export type SemanaData = { semana: string; label: string; count: number }

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

function fmtWeek(iso: string) {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

export async function getLeadsB2BData(period: Period) {
  const { start, end } = getPeriodDates(period)
  const supabase = db()

  const [leadsRes, feedbacksRes] = await Promise.all([
    createAdminClient()
      .from('leads')
      .select('"Nome", email, empresa, whatsapp, created_at, utm_source')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false }),
    supabase.schema('dashboard').from('feedback_leads_b2b').select('lead_email, status'),
  ])

  const rows = (leadsRes.data ?? []) as Record<string, string>[]
  const statusMap: Record<string, string> = {}
  ;((feedbacksRes.data ?? []) as { lead_email: string; status: string }[]).forEach(f => {
    statusMap[f.lead_email] = f.status
  })

  const leads: LeadB2B[] = rows.map(r => ({
    nome: r['Nome'] ?? null,
    email: r.email,
    empresa: r.empresa ?? null,
    whatsapp: r.whatsapp ?? null,
    created_at: r.created_at,
    utm_source: r.utm_source ?? null,
    status_atual: statusMap[r.email] ?? 'novo',
  }))

  const weekGroups: Record<string, number> = {}
  rows.forEach(r => {
    const week = getWeekStart(r.created_at)
    weekGroups[week] = (weekGroups[week] || 0) + 1
  })

  const tendencia: SemanaData[] = Object.entries(weekGroups)
    .map(([semana, count]) => ({ semana, label: fmtWeek(semana), count }))
    .sort((a, b) => a.semana.localeCompare(b.semana))

  return { leads, tendencia, total: leads.length }
}
