import {
  getProcessosAtivos,
  getProcessoKpis,
  getProcessoDailyVolume,
  getProcessoChannelData,
  getProcessoFunnelData,
  getProcessoInfo,
  ProcessoInfoData,
} from '@/lib/processo-view'
import { Period } from '@/lib/data'
import { ProcessoSelector } from './ProcessoSelector'
import { VolumeChart } from '@/components/pipeline/VolumeChart'
import { ChannelChart } from '@/components/pipeline/ChannelChart'
import { ConversionFunnel } from '@/components/pipeline/ConversionFunnel'

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-2"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}
    >
      <p
        className="text-xs uppercase tracking-wider"
        style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}
      >
        {label}
      </p>
      <p
        className="text-4xl font-bold leading-none"
        style={{ color: '#FF5500', fontFamily: 'var(--font-barlow-condensed)' }}
      >
        {value}
      </p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}
    >
      <h3
        className="text-base mb-6"
        style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, color: '#0D0B0A' }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

function InfoCard({ info }: { info: ProcessoInfoData }) {
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const dataInicio = info.data_inicio
    ? new Date(info.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')
    : '—'

  const rows: { label: string; value: string }[] = [
    { label: 'Data de início', value: dataInicio },
    {
      label: 'Vagas abertas / Meta',
      value:
        info.vagas_abertas != null && info.meta_contratacoes != null
          ? `${info.vagas_abertas} / ${info.meta_contratacoes}`
          : info.vagas_abertas != null
          ? String(info.vagas_abertas)
          : '—',
    },
    { label: 'Investimento total', value: fmt(info.investimento_total) },
    { label: 'CPL histórico', value: info.cpl_historico },
    { label: 'Custo por contratação', value: info.custo_por_contratacao },
  ]

  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}
    >
      <div className="mb-5">
        <p
          className="text-lg font-bold leading-tight"
          style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#0D0B0A' }}
        >
          {info.cargo}
        </p>
        <p className="text-sm mt-0.5" style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}>
          {info.empresa}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {rows.map(row => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span
              className="text-sm"
              style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}
            >
              {row.label}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: 'var(--font-barlow-condensed)', color: '#0D0B0A' }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="rounded-xl flex flex-col items-center justify-center gap-3 py-16"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C8C7C3"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <p
        className="text-sm text-center"
        style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}
      >
        Selecione um processo para visualizar os dados
      </p>
    </div>
  )
}

type Props = {
  period: Period
  codigoPs?: string
}

export async function ProcessoViewBlock({ period, codigoPs }: Props) {
  const processos = await getProcessosAtivos()

  let data: {
    kpis: Awaited<ReturnType<typeof getProcessoKpis>>
    dailyVolume: Awaited<ReturnType<typeof getProcessoDailyVolume>>
    channelData: Awaited<ReturnType<typeof getProcessoChannelData>>
    funnelData: Awaited<ReturnType<typeof getProcessoFunnelData>>
    info: ProcessoInfoData
  } | null = null

  if (codigoPs) {
    try {
      const [kpis, dailyVolume, channelData, funnelData, info] = await Promise.all([
        getProcessoKpis(codigoPs, period),
        getProcessoDailyVolume(codigoPs, period),
        getProcessoChannelData(codigoPs, period),
        getProcessoFunnelData(codigoPs, period),
        getProcessoInfo(codigoPs),
      ])
      data = { kpis, dailyVolume, channelData, funnelData, info }
    } catch {
      return (
        <div className="flex flex-col gap-5">
          <ProcessoSelector processos={processos} codigoPs={codigoPs} />
          <p
            className="text-sm text-center py-4"
            style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}
          >
            Erro ao carregar dados do processo. Tente novamente.
          </p>
        </div>
      )
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ProcessoSelector processos={processos} codigoPs={codigoPs} />

      {data ? (
        <div className="flex flex-col gap-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total de candidatos"
              value={data.kpis.totalCandidatos.toLocaleString('pt-BR')}
            />
            <KpiCard
              label="Vídeos enviados"
              value={data.kpis.videosEnviados.toLocaleString('pt-BR')}
            />
            <KpiCard
              label="Contratações confirmadas"
              value={data.kpis.contratados.toLocaleString('pt-BR')}
            />
            <KpiCard label="CPL" value={data.kpis.cpl} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Volume diário de candidatos">
              <VolumeChart data={data.dailyVolume} />
            </Card>
            <Card title="Distribuição por canal">
              <ChannelChart data={data.channelData} />
            </Card>
          </div>

          {/* Funil + Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Funil de conversão">
              <ConversionFunnel stages={data.funnelData} />
            </Card>
            <InfoCard info={data.info} />
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}
