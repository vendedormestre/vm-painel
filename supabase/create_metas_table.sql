-- Run in Supabase SQL Editor before deploying Módulos 5 and 6

-- 1. Add observacoes column to feedback_candidatos (idempotent)
ALTER TABLE dashboard.feedback_candidatos
  ADD COLUMN IF NOT EXISTS observacoes text;

-- 2. Create metas table
CREATE TABLE IF NOT EXISTS dashboard.metas (
  id                uuid          DEFAULT gen_random_uuid() PRIMARY KEY,
  periodo           date          NOT NULL UNIQUE, -- first day of month, e.g. '2026-04-01'
  meta_candidatos   integer,
  meta_contratacoes integer,
  meta_leads        integer,
  verba_investida   numeric(12,2),
  meta_cpl          numeric(12,2),
  created_at        timestamptz   DEFAULT now(),
  updated_at        timestamptz   DEFAULT now()
);
