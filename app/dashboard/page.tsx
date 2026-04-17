import { Suspense } from 'react'
import { Period } from '@/lib/data'
import { PeriodFilter } from '@/components/PeriodFilter'
import { KpiBar } from '@/components/kpis/KpiBar'
import { Pipeline } from '@/components/pipeline/Pipeline'

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-6 animate-pulse"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', height: 96 }}
        >
          <div className="h-2.5 rounded mb-3" style={{ backgroundColor: '#E8E7E4', width: '55%' }} />
          <div className="h-8 rounded" style={{ backgroundColor: '#E8E7E4', width: '40%' }} />
        </div>
      ))}
    </div>
  )
}

function PipelineSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div
            key={i}
            className="rounded-xl animate-pulse"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', height: 280 }}
          />
        ))}
      </div>
      <div
        className="rounded-xl animate-pulse"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', height: 220 }}
      />
      <div
        className="rounded-xl animate-pulse"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', height: 400 }}
      />
    </div>
  )
}

const VALID_PERIODS = ['hoje', '7d', '30d', 'mes']

type PageProps = {
  searchParams: Promise<{
    period?: string
    page?: string
    cargo?: string
    empresa?: string
    status?: string
  }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = (VALID_PERIODS.includes(params.period ?? '') ? params.period : 'mes') as Period
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.5rem', color: '#0A0A0A' }}>
          Métricas de Marketing
        </h1>
        <Suspense fallback={null}>
          <PeriodFilter />
        </Suspense>
      </div>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiBar period={period} />
      </Suspense>

      <Suspense fallback={<PipelineSkeleton />}>
        <Pipeline
          period={period}
          page={page}
          cargo={params.cargo}
          empresa={params.empresa}
          status={params.status}
        />
      </Suspense>
    </div>
  )
}
