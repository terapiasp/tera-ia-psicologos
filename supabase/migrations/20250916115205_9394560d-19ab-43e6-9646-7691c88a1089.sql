-- Fix security warning: Set search_path for the new function
CREATE OR REPLACE FUNCTION public.get_daily_sessions_for_notifications(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  session_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  scheduled_at_formatted TEXT,
  patient_name TEXT,
  psychologist_name TEXT,
  psychologist_phone TEXT,
  session_status TEXT,
  payment_status TEXT,
  consolidated_status TEXT,
  template_lembrete_sessao TEXT,
  timezone TEXT,
  session_value NUMERIC,
  duration_minutes INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id as session_id,
    s.scheduled_at,
    -- Format datetime in Brazilian format with timezone conversion
    TO_CHAR(
      s.scheduled_at AT TIME ZONE COALESCE(pr.timezone, 'America/Sao_Paulo'), 
      'DD/MM/YYYY "às" HH24:MI'
    ) as scheduled_at_formatted,
    p.name as patient_name,
    pr.name as psychologist_name,
    pr.phone as psychologist_phone,
    s.status as session_status,
    CASE 
      WHEN s.paid = true THEN 'pago'
      ELSE 'pendente'
    END as payment_status,
    -- Consolidated status for easier N8N processing
    CASE 
      WHEN s.status = 'scheduled' AND s.paid = true THEN 'confirmada_paga'
      WHEN s.status = 'scheduled' AND s.paid = false THEN 'confirmada_pendente'
      WHEN s.status = 'cancelled' THEN 'cancelada'
      WHEN s.status = 'completed' AND s.paid = true THEN 'realizada_paga'
      WHEN s.status = 'completed' AND s.paid = false THEN 'realizada_pendente'
      ELSE s.status
    END as consolidated_status,
    pr.template_lembrete_sessao,
    COALESCE(pr.timezone, 'America/Sao_Paulo') as timezone,
    s.value as session_value,
    s.duration_minutes
  FROM sessions s
  JOIN patients p ON s.patient_id = p.id AND p.is_archived = false
  JOIN profiles pr ON s.user_id = pr.user_id
  WHERE DATE(s.scheduled_at AT TIME ZONE COALESCE(pr.timezone, 'America/Sao_Paulo')) = target_date
  ORDER BY s.scheduled_at;
$$;