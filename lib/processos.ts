import { createAdminClient } from './supabase'

export type CandidatoProcesso = {
  fullname: string | null
  email: string
  whatsapp: string | null
  created_at: string
  status_atual: string
  dias_sem_atualizacao: number
  parado: boolean
}

export type FunilEtapa = { label: string; count: number }

export type Saude =
  | { tipo: 'saudavel' }
  | { tipo: 'atencao' }
  | { tipo: 'gargalo'; etapa: string }

export type ProcessoData = {
  id: string | null
  cargo: string
  empresa: string
  status: string
  vagas_abertas: number | null
  meta_contratacoes: number | null
  data_inicio: string | null
  observacoes: string | null
  created_at: string | null
  totalCandidatos: number
  parados: number
  contratados: number
  ultimoCandidato: string | null
  canalPrincipal: string | null
  funil: FunilEtapa[]
  saude: Saude
  candidatos: CandidatoProcesso[]
}

export type ProcessosPeriod = 'mes' | '3m' | 'all'

// Returns an ISO string in UTC for safe comparison with timestamptz values
export function getProcessosPeriodStart(pp: ProcessosPeriod): string | null {
  const now = new Date()
  switch (pp) {
    case 'mes': {
      const y = now.getUTCFullYear()
      const m = String(now.getUTCMonth() + 1).padStart(2, '0')
      return `${y}-${m}-01T00:00:00.000Z`
    }
    case '3m': {
      const d = new Date(now)
      d.setUTCDate(d.getUTCDate() - 89)
      d.setUTCHours(0, 0, 0, 0)
      return d.toISOString()
    }
    case 'all':
      return null
  }
}

function computeSaude(funil: FunilEtapa[]): Saude {
  if (funil[0].count === 0) return { tipo: 'saudavel' }

  const pairs = [
    { from: funil[1], to: funil[2], label: 'Vídeo enviado' },
    { from: funil[2], to: funil[3], label: 'Aprovados' },
    { from: funil[3], to: funil[4], label: 'Contratados' },
  ]

  let minRate = 100
  let minLabel = ''

  for (const { from, to, label } of pairs) {
    if (!from || !to || from.count === 0) continue
    const rate = Math.round((to.count / from.count) * 100)
    if (rate < minRate) {
      minRate = rate
      minLabel = label
    }
  }

  if (minRate < 20) return { tipo: 'gargalo', etapa: minLabel || 'N/A' }
  if (minRate < 50) return { tipo: 'atencao' }
  return { tipo: 'saudavel' }
}

export async function getProcessosAtivos(pp: ProcessosPeriod = '3m'): Promise<ProcessoData[]> {
  const periodStart = getProcessosPeriodStart(pp)

  console.log('[processos] pp recebido:', pp, '| period_start enviado:', periodStart)

  const { data, error } = await createAdminClient().rpc('get_processos_agrupados', {
    period_start: periodStart,
  })

  if (error) throw new Error(`[processos] RPC error: ${error.message}`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: Record<string, any>): ProcessoData => {
    const funil: FunilEtapa[] = [
      { label: 'Cadastrados',   count: Number(row.funil_cadastrados) },
      { label: 'Contactados',   count: Number(row.funil_contactados) },
      { label: 'Vídeo enviado', count: Number(row.funil_video_enviado) },
      { label: 'Aprovados',     count: Number(row.funil_aprovados) },
      { label: 'Contratados',   count: Number(row.funil_contratados) },
    ]

    return {
      id:                row.processo_id ?? null,
      cargo:             row.cargo,
      empresa:           row.empresa,
      status:            row.processo_status ?? 'ativo',
      vagas_abertas:     row.vagas_abertas     != null ? Number(row.vagas_abertas)     : null,
      meta_contratacoes: row.meta_contratacoes != null ? Number(row.meta_contratacoes) : null,
      data_inicio:       row.data_inicio       ?? null,
      observacoes:       row.observacoes       ?? null,
      created_at:        row.processo_created_at ?? null,
      totalCandidatos:   Number(row.total_candidatos),
      parados:           Number(row.parados),
      contratados:       Number(row.funil_contratados),
      ultimoCandidato:   row.ultimo_candidato  ?? null,
      canalPrincipal:    row.canal_principal   ?? null,
      funil,
      saude:             computeSaude(funil),
      candidatos:        (row.candidatos ?? []) as CandidatoProcesso[],
    }
  })
}
