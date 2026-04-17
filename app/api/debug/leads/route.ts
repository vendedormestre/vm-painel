import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  const store = await cookies()
  if (store.get('vm_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 1. Total count — no filters
  const { count: totalCount, error: countError } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  // 2. First 3 rows — reveals real column names and sample data
  const { data: sample, error: sampleError } = await supabase
    .from('leads')
    .select('*')
    .limit(3)

  // 3. Date range of all rows
  const { data: dateRange } = await supabase
    .from('leads')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1)

  const { data: dateRangeEnd } = await supabase
    .from('leads')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)

  return NextResponse.json({
    table: 'public.leads',
    total_rows: totalCount,
    count_error: countError?.message ?? null,
    sample_error: sampleError?.message ?? null,
    column_names: sample?.[0] ? Object.keys(sample[0]) : [],
    first_3_rows: sample ?? [],
    created_at_range: {
      oldest: dateRange?.[0]?.created_at ?? null,
      newest: dateRangeEnd?.[0]?.created_at ?? null,
    },
    current_server_time: new Date().toISOString(),
  })
}
