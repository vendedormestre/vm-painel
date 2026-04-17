import { getDailyVolume, getFunnelData, getChannelData, Period } from '@/lib/data'
import { VolumeChart } from './VolumeChart'
import { ChannelChart } from './ChannelChart'
import { ConversionFunnel } from './ConversionFunnel'
import { CandidatesTable } from './CandidatesTable'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4' }}>
      <h2
        className="text-base mb-6"
        style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: '#0A0A0A' }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

type Props = {
  period: Period
  page: number
  cargo?: string
  empresa?: string
  status?: string
}

export async function Pipeline({ period, page, cargo, empresa, status }: Props) {
  let volumeData, funnelData, channelData

  try {
    ;[volumeData, funnelData, channelData] = await Promise.all([
      getDailyVolume(period),
      getFunnelData(period),
      getChannelData(period),
    ])
  } catch {
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8A8986', fontFamily: 'var(--font-dm-sans)' }}>
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

      <Card title="Candidatos recentes">
        <CandidatesTable period={period} page={page} cargo={cargo} empresa={empresa} status={status} />
      </Card>
    </div>
  )
}
