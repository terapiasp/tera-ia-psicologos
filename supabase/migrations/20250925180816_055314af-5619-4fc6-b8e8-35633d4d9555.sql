-- Corrigir warnings de segurança nas funções criadas
-- Adicionar search_path security definer para as novas funções

DROP FUNCTION public.get_session_link_resolved(public.patients);
DROP FUNCTION public.get_link_status(public.patients);

-- Recriar função para obter o link resolvido final com security definer
CREATE OR REPLACE FUNCTION public.get_session_link_resolved(patient_row public.patients)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Recriar função para verificar status do link com security definer
CREATE OR REPLACE FUNCTION public.get_link_status(patient_row public.patients)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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