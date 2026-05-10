import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const campanha_nome = searchParams.get('campanha_nome') // exact match; omit to sum all

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (createAdminClient() as any)
    .schema('dashboard')
    .from('meta_reports')
    .select('verba_gasta')

  if (campanha_nome) {
    query = query.eq('campanha_nome', campanha_nome)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total_investido = ((data ?? []) as { verba_gasta: number | null }[])
    .reduce((s, r) => s + (Number(r.verba_gasta) || 0), 0)

  return NextResponse.json({ total_investido })
}
