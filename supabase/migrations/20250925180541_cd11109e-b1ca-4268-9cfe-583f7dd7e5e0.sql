-- Migração para sistema de links de sessão inteligente
-- Adicionar novos campos para controle de links por paciente

-- Primeiro, adicionar as novas colunas
ALTER TABLE public.patients 
ADD COLUMN recurring_meet_code text,
ADD COLUMN external_session_link text,
ADD COLUMN link_type text CHECK (link_type IN ('recurring_meet', 'external')),
ADD COLUMN link_created_at timestamp with time zone,
ADD COLUMN link_last_used timestamp with time zone;

-- Migrar dados existentes do campo session_link
UPDATE public.patients 
SET 
  external_session_link = session_link,
  link_type = 'external',
  link_created_at = now()
WHERE session_link IS NOT NULL AND session_link != '';

-- Adicionar constraint para garantir que apenas um tipo de link esteja ativo
ALTER TABLE public.patients 
ADD CONSTRAINT patients_single_link_type 
CHECK (
  (link_type = 'recurring_meet' AND recurring_meet_code IS NOT NULL AND external_session_link IS NULL) OR
  (link_type = 'external' AND external_session_link IS NOT NULL AND recurring_meet_code IS NULL) OR
  (link_type IS NULL AND recurring_meet_code IS NULL AND external_session_link IS NULL)
);

-- Criar função para obter o link resolvido final
CREATE OR REPLACE FUNCTION public.get_session_link_resolved(patient_row public.patients)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  CASE patient_row.link_type
    WHEN 'recurring_meet' THEN
      RETURN 'https://meet.google.com/' || patient_row.recurring_meet_code;
    WHEN 'external' THEN
      RETURN patient_row.external_session_link;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

-- Criar função para verificar status do link
CREATE OR REPLACE FUNCTION public.get_link_status(patient_row public.patients)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  days_since_last_use integer;
BEGIN
  IF patient_row.link_type IS NULL THEN
    RETURN 'none';
  END IF;
  
  IF patient_row.link_type = 'external' THEN
    RETURN 'active';
  END IF;
  
  -- Para links do Google Meet, verificar último uso
  IF patient_row.link_last_used IS NULL THEN
    days_since_last_use := EXTRACT(DAY FROM (now() - patient_row.link_created_at));
  ELSE
    days_since_last_use := EXTRACT(DAY FROM (now() - patient_row.link_last_used));
  END IF;
  
  IF days_since_last_use >= 30 THEN
    RETURN 'expired';
  ELSIF days_since_last_use >= 25 THEN
    RETURN 'expiring';
  ELSE
    RETURN 'active';
  END IF;
END;
$$;