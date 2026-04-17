import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const store = await cookies()
  if (store.get('vm_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const [
    { count: totalRows, error: countError },
    { data: sample, error: sampleError },
    { data: oldest },
    { data: newest },
    { count: abrilCount, error: abrilError },
    { data: empresas, error: empresasError },
    { data: cargos, error: cargosError },
  ] = await Promise.all([
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }),
    supabase.from('aplicacao').select('*').limit(3),
    supabase.from('aplicacao').select('created_at').order('created_at', { ascending: true }).limit(1),
    supabase.from('aplicacao').select('created_at').order('created_at', { ascending: false }).limit(1),
    supabase.from('aplicacao').select('*', { count: 'exact', head: true }).gte('created_at', '2026-04-01T00:00:00.000Z'),
    supabase.from('aplicacao').select('empresa').not('empresa', 'is', null),
    supabase.from('aplicacao').select('cargo').not('cargo', 'is', null),
  ])

  const distinctEmpresas = [...new Set((empresas ?? []).map((r: Record<string, string>) => r.empresa))].sort()
  const distinctCargos = [...new Set((cargos ?? []).map((r: Record<string, string>) => r.cargo))].sort()

  return NextResponse.json({
    table: 'public.aplicacao',
    total_rows: totalRows,
    column_names: sample?.[0] ? Object.keys(sample[0]) : [],
    created_at_range: {
      oldest: oldest?.[0]?.created_at ?? null,
      newest: newest?.[0]?.created_at ?? null,
    },
    first_3_rows: sample ?? [],
    distinct_empresas: distinctEmpresas,
    distinct_cargos: distinctCargos,
    registros_abril_2026: abrilCount,
    errors: {
      count: countError?.message ?? null,
      sample: sampleError?.message ?? null,
      abril: abrilError?.message ?? null,
      empresas: empresasError?.message ?? null,
      cargos: cargosError?.message ?? null,
    },
    server_time: new Date().toISOString(),
  })
}
