import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminDb = () => createAdminClient() as any

const VALID_FIELDS = ['meta_candidatos', 'meta_cpl', 'meta_videos', 'meta_contratacoes'] as const
type MetaField = (typeof VALID_FIELDS)[number]

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { codigo_ps, field, value } = body as { codigo_ps?: string; field?: MetaField; value?: unknown }

  if (!codigo_ps || !field || !VALID_FIELDS.includes(field) || value == null) {
    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  }

  const parsed = field === 'meta_cpl' ? parseFloat(String(value)) : parseInt(String(value), 10)
  if (isNaN(parsed) || parsed <= 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
  }

  const { error } = await adminDb()
    .schema('dashboard')
    .from('processos_seletivos')
    .update({ [field]: parsed })
    .eq('codigo_ps', codigo_ps)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
