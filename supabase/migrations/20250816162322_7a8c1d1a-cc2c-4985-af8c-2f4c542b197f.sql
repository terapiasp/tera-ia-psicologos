
-- 1) Remover constraint de tipo e padronizar default
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_type_check;

ALTER TABLE public.sessions
  ALTER COLUMN type SET DEFAULT 'therapy';

-- 2) Adicionar coluna modality (atributo da sessão) e migrar dados
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS modality text;

-- Copiar o valor antigo de type para modality quando modality estiver nulo
UPDATE public.sessions
SET modality = COALESCE(modality, type)
WHERE modality IS NULL;

-- 3) Normalizar todos os tipos para 'therapy'
UPDATE public.sessions
SET type = 'therapy'
WHERE type IS DISTINCT FROM 'therapy';

-- 4) Índices úteis
CREATE INDEX IF NOT EXISTS sessions_user_scheduled_at_idx
ON public.sessions (user_id, scheduled_at);

-- Evitar duplicados de recorrência no mesmo instante (quando schedule_id não é nulo)
CREATE UNIQUE INDEX IF NOT EXISTS sessions_unique_schedule_occurrence
ON public.sessions (user_id, schedule_id, scheduled_at)
WHERE schedule_id IS NOT NULL;
