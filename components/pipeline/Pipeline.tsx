import { Suspense } from 'react'
import { getDailyVolume, getFunnelData, getChannelData, Period } from '@/lib/data'
import { VolumeChart } from './VolumeChart'
import { ChannelChart } from './ChannelChart'
import { ConversionFunnel } from './ConversionFunnel'
import { CandidatesTable } from './CandidatesTable'
import { ProcessoViewBlock } from '@/components/processo-view/ProcessoViewBlock'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
      <h2
        className="text-base mb-6"
        style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 700, color: '#0D0B0A' }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function ProcessoViewSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg animate-pulse h-10" style={{ backgroundColor: '#F4F3F1', width: 300 }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl animate-pulse h-24" style={{ backgroundColor: '#F4F3F1', border: '1px solid #E8E7E4' }} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl animate-pulse h-56" style={{ backgroundColor: '#F4F3F1', border: '1px solid #E8E7E4' }} />
        <div className="rounded-xl animate-pulse h-56" style={{ backgroundColor: '#F4F3F1', border: '1px solid #E8E7E4' }} />
      </div>
    </div>
  )
}

type Props = {
  period: Period
  page: number
  pageSize: number
  cargo?: string
  empresa?: string
  status?: string
  codigoPs?: string
  pvPeriod: Period
}

export async function Pipeline({ period, page, pageSize, cargo, empresa, status, codigoPs, pvPeriod }: Props) {
  let volumeData, funnelData, channelData

  try {
    ;[volumeData, funnelData, channelData] = await Promise.all([
      getDailyVolume(period),
      getFunnelData(period),
      getChannelData(period),
    ])
  } catch {
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-barlow)' }}>
        Erro ao carregar o pipeline. Tente novamente.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Volume diário de candidatos">
          <VolumeChart data={volumeData} />
        </Card>
        <Card title="Distribuição por canal">
          <ChannelChart data={channelData} />
        </Card>
      </div>

      <Card title="Funil de conversão">
        <ConversionFunnel stages={funnelData} />
      </Card>

      {/* Visão por Processo — entre o funil e a tabela de candidatos */}
      <div>
        <h2
          className="mb-5"
          style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 800, fontSize: '1.125rem', color: '#0D0B0A' }}
        >
          Visão por Processo
        </h2>
        <Suspense fallback={<ProcessoViewSkeleton />}>
          <ProcessoViewBlock codigoPs={codigoPs} pvPeriod={pvPeriod} />
        </Suspense>
      </div>

      <Card title="Candidatos recentes">
        <CandidatesTable period={period} page={page} pageSize={pageSize} cargo={cargo} empresa={empresa} status={status} />
      </Card>
    </div>
  )
}
