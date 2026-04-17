import { Suspense } from 'react'
import { Period } from '@/lib/data'
import { ProcessosPeriod } from '@/lib/processos'  // still used for lp validation
import { PeriodFilter } from '@/components/PeriodFilter'
import { KpiBar } from '@/components/kpis/KpiBar'
import { Pipeline } from '@/components/pipeline/Pipeline'
import { ProcessosGrid } from '@/components/processos/ProcessosGrid'
import { LeadsB2B } from '@/components/leads-b2b/LeadsB2B'
import { FeedbackModule } from '@/components/feedback/FeedbackModule'
import { MetasModule } from '@/components/metas/MetasModule'

function ModuleSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.125rem', color: '#0A0A0A' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function GridSkeleton({ cols = 2, rows = 1, height = 96 }: { cols?: number; rows?: number; height?: number }) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', height }}
        />
      ))}
    </div>
  )
}

function BlockSkeleton({ height }: { height: number }) {
  return (
    <div
      className="rounded-xl animate-pulse"
      style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E7E4', height }}
    />
  )
}

const VALID_PERIODS = ['hoje', '7d', '30d', 'mes']

const VALID_PP: ProcessosPeriod[] = ['mes', '3m', 'all']

type PageProps = {
  searchParams: Promise<{
    period?: string
    page?: string
    cargo?: string
    empresa?: string
    status?: string
    pp?: string
    lp?: string
  }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = (VALID_PERIODS.includes(params.period ?? '') ? params.period : 'mes') as Period
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const lp = (VALID_PP.includes(params.lp as ProcessosPeriod) ? params.lp : 'all') as ProcessosPeriod

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto flex flex-col gap-10">
      {/* Header global */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.5rem', color: '#0A0A0A' }}>
          Métricas de Marketing
        </h1>
        <Suspense fallback={null}>
          <PeriodFilter />
        </Suspense>
      </div>

      {/* Módulo 1 — KPIs */}
      <Suspense fallback={<GridSkeleton cols={3} height={96} />}>
        <KpiBar period={period} />
      </Suspense>

      {/* Módulo 2 — Pipeline de Candidatos */}
      <ModuleSection title="Pipeline de Candidatos">
        <Suspense
          fallback={
            <div className="flex flex-col gap-6">
              <GridSkeleton cols={2} height={260} />
              <BlockSkeleton height={200} />
              <BlockSkeleton height={380} />
            </div>
          }
        >
          <Pipeline
            period={period}
            page={page}
            cargo={params.cargo}
            empresa={params.empresa}
            status={params.status}
          />
        </Suspense>
      </ModuleSection>

      {/* Módulo 3 — Processos Seletivos (Client Component — reads pp from URL itself) */}
      <ModuleSection title="Processos Seletivos">
        <Suspense fallback={<GridSkeleton cols={2} height={320} />}>
          <ProcessosGrid />
        </Suspense>
      </ModuleSection>

      {/* Módulo 4 — Leads B2B */}
      <ModuleSection title="Leads B2B">
        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <BlockSkeleton height={180} />
              <BlockSkeleton height={320} />
            </div>
          }
        >
          <LeadsB2B lp={lp} />
        </Suspense>
      </ModuleSection>

      {/* Módulo 5 — Feedback Comercial */}
      <ModuleSection title="Feedback Comercial">
        <Suspense
          fallback={
            <div className="flex flex-col gap-5">
              <BlockSkeleton height={240} />
              <BlockSkeleton height={200} />
            </div>
          }
        >
          <FeedbackModule />
        </Suspense>
      </ModuleSection>

      {/* Módulo 6 — Metas e Acompanhamento */}
      <ModuleSection title="Metas e Acompanhamento">
        <Suspense fallback={<GridSkeleton cols={2} height={360} />}>
          <MetasModule />
        </Suspense>
      </ModuleSection>
    </div>
  )
}
