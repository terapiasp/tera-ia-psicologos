-- Fix search_path for get_daily_agenda function
CREATE OR REPLACE FUNCTION public.get_daily_agenda()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  patient_name TEXT,
  psychologist_name TEXT,
  psychologist_phone TEXT,
  template_lembrete_sessao TEXT,
  timezone TEXT
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id,
    s.user_id,
    s.scheduled_at,
    p.name as patient_name,
    pr.name as psychologist_name,
    pr.phone as psychologist_phone,
    pr.template_lembrete_sessao,
    pr.timezone
  FROM sessions s
  JOIN patients p ON s.patient_id = p.id
  JOIN profiles pr ON s.user_id = pr.user_id
  WHERE DATE(s.scheduled_at AT TIME ZONE COALESCE(pr.timezone, 'America/Sao_Paulo')) = CURRENT_DATE
  AND s.status = 'scheduled'
  ORDER BY s.scheduled_at;
$$;