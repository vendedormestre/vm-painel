-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)
-- The function lives in public schema and uses SECURITY DEFINER to cross into dashboard schema.

CREATE OR REPLACE FUNCTION get_processos_agrupados(period_start timestamptz DEFAULT NULL)
RETURNS TABLE (
  cargo                text,
  empresa              text,
  processo_id          uuid,
  processo_status      text,
  vagas_abertas        integer,
  meta_contratacoes    integer,
  data_inicio          date,
  observacoes          text,
  processo_created_at  timestamptz,
  total_candidatos     bigint,
  ultimo_candidato     timestamptz,
  canal_principal      text,
  funil_cadastrados    bigint,
  funil_contactados    bigint,
  funil_video_enviado  bigint,
  funil_aprovados      bigint,
  funil_contratados    bigint,
  parados              bigint,
  candidatos           jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, dashboard
AS $$
  WITH base AS (
    -- Explicit ::timestamptz cast ensures correct comparison regardless of
    -- whether aplicacao.created_at is stored as timestamp or timestamptz.
    SELECT
      a.cargo,
      a.empresa,
      a.fullname,
      a.email,
      a.whatsapp,
      a.created_at::timestamptz                 AS created_at,
      COALESCE(a.utm_source, 'Direto')           AS utm_source,
      COALESCE(f.status, 'novo')                 AS status_atual,
      FLOOR(
        EXTRACT(EPOCH FROM
          (NOW() - COALESCE(f.updated_at::timestamptz, a.created_at::timestamptz))
        ) / 86400
      )::int                                     AS dias_sem_atualizacao
    FROM public.aplicacao a
    LEFT JOIN dashboard.feedback_candidatos f ON f.candidato_email = a.email
    WHERE a.cargo IS NOT NULL AND a.empresa IS NOT NULL
  ),

  -- Query aplicacao directly (no feedback join needed here) so MAX returns a
  -- clean timestamptz that compares correctly with the period_start parameter.
  grupos AS (
    SELECT
      a.cargo,
      a.empresa,
      MAX(a.created_at::timestamptz) AS ultimo_candidato
    FROM public.aplicacao a
    WHERE a.cargo IS NOT NULL AND a.empresa IS NOT NULL
    GROUP BY a.cargo, a.empresa
  ),

  -- Filter: exclude encerrado groups; apply period window using ultimo_candidato.
  -- Both sides of >= are timestamptz — no implicit timezone cast.
  grupos_ativos AS (
    SELECT g.cargo, g.empresa
    FROM grupos g
    LEFT JOIN dashboard.processos_seletivos ps
           ON ps.cargo = g.cargo AND ps.empresa = g.empresa
    WHERE (ps.status IS NULL OR ps.status != 'encerrado')
      AND (period_start IS NULL OR g.ultimo_candidato >= period_start)
  ),

  -- Top utm_source per group by candidate count
  canal_ranked AS (
    SELECT cargo, empresa, utm_source
    FROM (
      SELECT
        b.cargo,
        b.empresa,
        b.utm_source,
        ROW_NUMBER() OVER (
          PARTITION BY b.cargo, b.empresa
          ORDER BY COUNT(*) DESC
        ) AS rn
      FROM base b
      JOIN grupos_ativos ga ON ga.cargo = b.cargo AND ga.empresa = b.empresa
      GROUP BY b.cargo, b.empresa, b.utm_source
    ) t
    WHERE rn = 1
  )

  SELECT
    b.cargo,
    b.empresa,
    ps.id                                        AS processo_id,
    COALESCE(ps.status, 'ativo')                 AS processo_status,
    ps.vagas_abertas,
    ps.meta_contratacoes,
    ps.data_inicio,
    ps.observacoes,
    ps.created_at                                AS processo_created_at,
    COUNT(*)::bigint                             AS total_candidatos,
    MAX(b.created_at)                            AS ultimo_candidato,
    MAX(cr.utm_source)                           AS canal_principal,

    COUNT(*)::bigint                             AS funil_cadastrados,
    COUNT(*) FILTER (WHERE b.status_atual IN (
      'contactado','video_enviado','aprovado_triagem','contratado'
    ))::bigint                                   AS funil_contactados,
    COUNT(*) FILTER (WHERE b.status_atual IN (
      'video_enviado','aprovado_triagem','contratado'
    ))::bigint                                   AS funil_video_enviado,
    COUNT(*) FILTER (WHERE b.status_atual IN (
      'aprovado_triagem','contratado'
    ))::bigint                                   AS funil_aprovados,
    COUNT(*) FILTER (WHERE b.status_atual = 'contratado')::bigint
                                                 AS funil_contratados,

    COUNT(*) FILTER (
      WHERE b.dias_sem_atualizacao > 2
        AND b.status_atual NOT IN ('contratado','reprovado','descartado')
    )::bigint                                    AS parados,

    jsonb_agg(
      jsonb_build_object(
        'fullname',             b.fullname,
        'email',                b.email,
        'whatsapp',             b.whatsapp,
        'created_at',           b.created_at,
        'status_atual',         b.status_atual,
        'dias_sem_atualizacao', b.dias_sem_atualizacao,
        'parado', (
          b.dias_sem_atualizacao > 2
          AND b.status_atual NOT IN ('contratado','reprovado','descartado')
        )
      )
      ORDER BY b.created_at DESC
    )                                            AS candidatos

  FROM base b
  JOIN grupos_ativos ga
    ON ga.cargo = b.cargo AND ga.empresa = b.empresa
  LEFT JOIN dashboard.processos_seletivos ps
    ON ps.cargo = b.cargo AND ps.empresa = b.empresa
  LEFT JOIN canal_ranked cr
    ON cr.cargo = b.cargo AND cr.empresa = b.empresa
  GROUP BY
    b.cargo, b.empresa,
    ps.id, ps.status, ps.vagas_abertas, ps.meta_contratacoes,
    ps.data_inicio, ps.observacoes, ps.created_at
  ORDER BY MAX(b.created_at) DESC
$$;
