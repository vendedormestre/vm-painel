import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createAdminClient() as any)
    .schema('dashboard')
    .from('meta_reports')
    .select('campanha_nome')
    .not('campanha_nome', 'is', null)
    .order('campanha_nome', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const names: string[] = [...new Set<string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data ?? []).map((r: any) => r.campanha_nome as string).filter(Boolean)
  )]

  return NextResponse.json(names)
}
