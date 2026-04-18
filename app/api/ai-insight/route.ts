import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'
import OpenAI from 'openai'

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => createAdminClient() as any

function utcMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1))
  const end   = new Date(Date.UTC(year, month + 1, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ error: 'OPENAI_API_KEY não configurada' }, { status: 500 })

  const supabase = createAdminClient()
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()

  const curr = utcMonthRange(y, m)
  const prev = utcMonthRange(y, m - 1)
  const periodoDate = `${y}-${String(m + 1).padStart(2, '0')}-01`

  // ── parallel data fetch ──────────────────────────────────────────
  const [
    currCandRes, prevCandRes,
    allFeedbackRes,
    currCandidatesRes,
    metaRes,
    leadsRes,
    processosRes,
  ] = await Promise.all([
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }).gte('created_at', curr.start).lt('created_at', curr.end),
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }).gte('created_at', prev.start).lt('created_at', prev.end),
    adminDb().schema('dashboard').from('feedback_candidatos').select('candidato_email, status'),
    supabase.from('aplicacao').select('email, utm_source').gte('created_at', curr.start).lt('created_at', curr.end),
    supabase.rpc('get_meta_por_periodo', { p_periodo: periodoDate }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', curr.start).lt('created_at', curr.end),
    supabase.rpc('get_processos_agrupados', { period_start: new Date(Date.UTC(y, m - 2, 1)).toISOString() }),
  ])

  // ── candidates current vs previous month ────────────────────────
  const currCand = currCandRes.count ?? 0
  const prevCand = prevCandRes.count ?? 0
  const variacaoCandidatos = prevCand > 0
    ? Math.round(((currCand - prevCand) / prevCand) * 1000) / 10
    : null

  // ── funnel conversion (emails in current month) ──────────────────
  const currEmails = new Set((currCandidatesRes.data ?? []).map((r: { email: string }) => r.email))
  const feedbacks: { candidato_email: string; status: string }[] = allFeedbackRes.data ?? []
  const currFeedbacks = feedbacks.filter(f => currEmails.has(f.candidato_email))

  const cnt = (statuses: string[]) => currFeedbacks.filter(f => statuses.includes(f.status)).length
  const funil = {
    cadastrados:   currCand,
    contactados:   cnt(['contactado', 'video_enviado', 'aprovado_triagem', 'contratado']),
    video_enviado: cnt(['video_enviado', 'aprovado_triagem', 'contratado']),
    aprovados:     cnt(['aprovado_triagem', 'contratado']),
    contratados:   cnt(['contratado']),
  }
  const taxaConversao = {
    contato:    currCand > 0 ? `${(funil.contactados / currCand * 100).toFixed(1)}%` : 'N/A',
    video:      funil.contactados > 0 ? `${(funil.video_enviado / funil.contactados * 100).toFixed(1)}%` : 'N/A',
    aprovacao:  funil.video_enviado > 0 ? `${(funil.aprovados / funil.video_enviado * 100).toFixed(1)}%` : 'N/A',
    contratacao: funil.aprovados > 0 ? `${(funil.contratados / funil.aprovados * 100).toFixed(1)}%` : 'N/A',
  }

  // ── top 3 channels ───────────────────────────────────────────────
  const contratadosSet = new Set(feedbacks.filter(f => f.status === 'contratado').map(f => f.candidato_email))
  const channelMap: Record<string, { total: number; contratados: number }> = {}
  ;(currCandidatesRes.data ?? []).forEach((r: { email: string; utm_source: string | null }) => {
    const ch = r.utm_source || 'Direto'
    if (!channelMap[ch]) channelMap[ch] = { total: 0, contratados: 0 }
    channelMap[ch].total++
    if (contratadosSet.has(r.email)) channelMap[ch].contratados++
  })
  const top3Canais = Object.entries(channelMap)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3)
    .map(([canal, d]) => ({
      canal,
      volume: d.total,
      taxaContratacao: d.total > 0 ? `${(d.contratados / d.total * 100).toFixed(1)}%` : '0%',
    }))

  // ── CPL ─────────────────────────────────────────────────────────
  const metaRow = Array.isArray(metaRes.data) ? (metaRes.data[0] ?? null) : null
  const verba = metaRow?.verba_investida ? Number(metaRow.verba_investida) : null
  const totalLeads = leadsRes.count ?? 0
  const cplRealizado = verba && totalLeads > 0
    ? `R$ ${(verba / totalLeads).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null
  const cplMeta = metaRow?.meta_cpl
    ? `R$ ${Number(metaRow.meta_cpl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null

  // ── processos com gargalo ────────────────────────────────────────
  const processos: { parados: number }[] = processosRes.data ?? []
  const processosAtivos = processos.length
  const processosComGargalo = processos.filter(p => (p.parados ?? 0) > 0).length

  // ── contratações vs meta ─────────────────────────────────────────
  const metaContratacoes = metaRow?.meta_contratacoes ?? null

  // ── build payload ────────────────────────────────────────────────
  const payload = {
    periodo: `${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}`,
    candidatos: {
      mes_atual: currCand,
      mes_anterior: prevCand,
      variacao_pct: variacaoCandidatos !== null ? `${variacaoCandidatos > 0 ? '+' : ''}${variacaoCandidatos}%` : 'primeiro mês',
    },
    funil,
    taxaConversao,
    cpl: {
      realizado: cplRealizado ?? 'sem verba cadastrada',
      meta:      cplMeta ?? 'sem meta cadastrada',
    },
    top3Canais,
    processos: {
      ativos: processosAtivos,
      com_gargalo: processosComGargalo,
    },
    contratacoes: {
      confirmadas: funil.contratados,
      meta:        metaContratacoes ?? 'sem meta cadastrada',
    },
  }

  // ── OpenAI call ──────────────────────────────────────────────────
  const openai = new OpenAI({ apiKey: key })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content:
          'Você é o especialista de marketing da Vendedor Mestre, empresa de recrutamento B2B especializada em vendedores de alta performance. Analise os dados fornecidos e gere um resumo executivo em 3 partes numeradas: 1. O que está funcionando bem (máximo 2 pontos objetivos). 2. O que precisa de atenção (máximo 2 pontos com dado específico). 3. Uma recomendação de ação imediata e concreta. Seja direto e profissional. Sem bullet points. Máximo 200 palavras no total.',
      },
      {
        role: 'user',
        content: JSON.stringify(payload, null, 2),
      },
    ],
  })

  const insight = completion.choices[0]?.message?.content ?? ''

  return NextResponse.json({ insight, generatedAt: new Date().toISOString(), payload })
}
