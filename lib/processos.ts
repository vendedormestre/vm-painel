import { createAdminClient } from './supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any

type FeedbackRow = { candidato_email: string; status: string; updated_at: string }
type AplicacaoRow = {
  fullname: string | null
  email: string
  whatsapp: string | null
  utm_source: string | null
  created_at: string
  cargo: string | null
  empresa: string | null
}

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
  id: string
  cargo: string
  empresa: string
  status: string
  vagas_abertas: number | null
  meta_contratacoes: number | null
  data_inicio: string | null
  observacoes: string | null
  created_at: string
  totalCandidatos: number
  parados: number
  contratados: number
  ultimoCandidato: string | null
  canalPrincipal: string | null
  funil: FunilEtapa[]
  saude: Saude
  candidatos: CandidatoProcesso[]
}

const TERMINAL = ['contratado', 'reprovado', 'descartado']

function computeSaude(funil: FunilEtapa[]): Saude {
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

  if (funil[0].count === 0) return { tipo: 'saudavel' }
  if (minRate < 20) return { tipo: 'gargalo', etapa: minLabel || 'N/A' }
  if (minRate < 50) return { tipo: 'atencao' }
  return { tipo: 'saudavel' }
}

export async function getProcessosAtivos(): Promise<ProcessoData[]> {
  const supabase = db()

  const [processosRes, allFeedbacksRes, allCandidatosRes] = await Promise.all([
    supabase.schema('dashboard').from('processos_seletivos').select('*').eq('status', 'ativo').order('created_at', { ascending: false }),
    supabase.schema('dashboard').from('feedback_candidatos').select('candidato_email, status, updated_at'),
    createAdminClient().from('aplicacao').select('fullname, email, whatsapp, utm_source, created_at, cargo, empresa'),
  ])

  const processos: Record<string, string>[] = processosRes.data ?? []
  if (!processos.length) return []

  const feedbackMap: Record<string, FeedbackRow> = {}
  ;(allFeedbacksRes.data as FeedbackRow[] ?? []).forEach(f => {
    feedbackMap[f.candidato_email] = f
  })

  const allCandidatos: AplicacaoRow[] = allCandidatosRes.data ?? []
  const now = new Date()

  return processos.map(processo => {
    const rows = allCandidatos.filter(
      c => c.cargo === processo.cargo && c.empresa === processo.empresa
    )

    const candidatos: CandidatoProcesso[] = rows.map(r => {
      const fb = feedbackMap[r.email]
      const status_atual = fb?.status ?? 'novo'
      const lastUpdate = fb?.updated_at ? new Date(fb.updated_at) : new Date(r.created_at)
      const dias = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
      const parado = dias > 2 && !TERMINAL.includes(status_atual)
      return { fullname: r.fullname, email: r.email, whatsapp: r.whatsapp, created_at: r.created_at, status_atual, dias_sem_atualizacao: dias, parado }
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const cnt = (s: string[]) => candidatos.filter(c => s.includes(c.status_atual)).length

    const funil: FunilEtapa[] = [
      { label: 'Cadastrados', count: rows.length },
      { label: 'Contactados', count: cnt(['contactado', 'video_enviado', 'aprovado_triagem', 'contratado']) },
      { label: 'Vídeo enviado', count: cnt(['video_enviado', 'aprovado_triagem', 'contratado']) },
      { label: 'Aprovados', count: cnt(['aprovado_triagem', 'contratado']) },
      { label: 'Contratados', count: cnt(['contratado']) },
    ]

    const canalCount: Record<string, number> = {}
    rows.forEach(r => { const s = r.utm_source || 'Direto'; canalCount[s] = (canalCount[s] || 0) + 1 })
    const canalPrincipal = Object.entries(canalCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

    return {
      id: processo.id,
      cargo: processo.cargo,
      empresa: processo.empresa,
      status: processo.status,
      vagas_abertas: processo.vagas_abertas != null ? Number(processo.vagas_abertas) : null,
      meta_contratacoes: processo.meta_contratacoes != null ? Number(processo.meta_contratacoes) : null,
      data_inicio: processo.data_inicio ?? null,
      observacoes: processo.observacoes ?? null,
      created_at: processo.created_at,
      totalCandidatos: rows.length,
      parados: candidatos.filter(c => c.parado).length,
      contratados: cnt(['contratado']),
      ultimoCandidato: candidatos[0]?.created_at ?? null,
      canalPrincipal,
      funil,
      saude: computeSaude(funil),
      candidatos,
    }
  })
}
