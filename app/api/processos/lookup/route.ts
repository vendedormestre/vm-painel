import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => createAdminClient() as any

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const cargo   = searchParams.get('cargo')
  const empresa = searchParams.get('empresa')

  if (!cargo || !empresa) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { data, error } = await adminDb()
    .schema('dashboard')
    .from('processos_seletivos')
    .select('id, campanha_meta, observacoes')
    .eq('cargo', cargo)
    .eq('empresa', empresa)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    id:            data?.id            ?? null,
    campanha_meta: data?.campanha_meta ?? null,
    observacoes:   data?.observacoes   ?? null,
  })
}
