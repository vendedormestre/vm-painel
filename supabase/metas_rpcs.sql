-- RPC functions to access dashboard.metas from the public schema
-- Run this in the Supabase SQL Editor

-- Ensure all expected columns exist (idempotent)
ALTER TABLE dashboard.metas ADD COLUMN IF NOT EXISTS meta_candidatos   integer;
ALTER TABLE dashboard.metas ADD COLUMN IF NOT EXISTS meta_contratacoes integer;
ALTER TABLE dashboard.metas ADD COLUMN IF NOT EXISTS meta_leads        integer;
ALTER TABLE dashboard.metas ADD COLUMN IF NOT EXISTS verba_investida   numeric(12,2);
ALTER TABLE dashboard.metas ADD COLUMN IF NOT EXISTS meta_cpl          numeric(12,2);
ALTER TABLE dashboard.metas ADD COLUMN IF NOT EXISTS updated_at        timestamptz DEFAULT now();

-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_meta_por_periodo(p_periodo date)
RETURNS TABLE (
  id                uuid,
  periodo           date,
  meta_candidatos   integer,
  meta_contratacoes integer,
  meta_leads        integer,
  verba_investida   numeric,
  meta_cpl          numeric,
  created_at        timestamptz,
  updated_at        timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, dashboard
AS $$
  SELECT
    id,
    periodo,
    meta_candidatos,
    meta_contratacoes,
    meta_leads,
    verba_investida,
    meta_cpl,
    created_at,
    updated_at
  FROM dashboard.metas
  WHERE periodo = p_periodo;
$$;

-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_contratados_no_periodo(
  p_start timestamptz,
  p_end   timestamptz
)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, dashboard
AS $$
  SELECT COUNT(*)
  FROM dashboard.feedback_candidatos
  WHERE status = 'contratado'
    AND updated_at >= p_start
    AND updated_at <  p_end;
$$;

-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upsert_meta(
  p_periodo           date,
  p_meta_candidatos   integer,
  p_meta_contratacoes integer,
  p_meta_leads        integer,
  p_verba_investida   numeric,
  p_meta_cpl          numeric
)
RETURNS TABLE (
  id                uuid,
  periodo           date,
  meta_candidatos   integer,
  meta_contratacoes integer,
  meta_leads        integer,
  verba_investida   numeric,
  meta_cpl          numeric,
  created_at        timestamptz,
  updated_at        timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, dashboard
AS $$
  INSERT INTO dashboard.metas
    (periodo, meta_candidatos, meta_contratacoes, meta_leads, verba_investida, meta_cpl, updated_at)
  VALUES
    (p_periodo, p_meta_candidatos, p_meta_contratacoes, p_meta_leads, p_verba_investida, p_meta_cpl, now())
  ON CONFLICT (periodo) DO UPDATE SET
    meta_candidatos   = EXCLUDED.meta_candidatos,
    meta_contratacoes = EXCLUDED.meta_contratacoes,
    meta_leads        = EXCLUDED.meta_leads,
    verba_investida   = EXCLUDED.verba_investida,
    meta_cpl          = EXCLUDED.meta_cpl,
    updated_at        = now()
  RETURNING
    id, periodo, meta_candidatos, meta_contratacoes, meta_leads,
    verba_investida, meta_cpl, created_at, updated_at;
$$;
