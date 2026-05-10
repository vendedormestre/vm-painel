import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase'

async function auth() {
  const store = await cookies()
  return store.get('vm_session')?.value === 'authenticated'
}

export async function GET(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const campanha_meta = searchParams.get('campanha_meta')

  if (!campanha_meta) return NextResponse.json({ total_investido: 0 })

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .schema('dashboard')
    .from('meta_reports')
    .select('verba_gasta')
    .ilike('campanha_nome', `%${campanha_meta}%`)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total_investido = ((data ?? []) as { verba_gasta: number | null }[])
    .reduce((s, r) => s + (Number(r.verba_gasta) || 0), 0)

  return NextResponse.json({ total_investido })
}
