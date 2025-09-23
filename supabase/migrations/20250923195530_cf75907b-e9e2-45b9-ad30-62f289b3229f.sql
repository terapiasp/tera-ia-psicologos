-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_next_day_sessions_for_patient_notifications(date);

-- Create the function with psychologist_whatsapp included
CREATE OR REPLACE FUNCTION public.get_next_day_sessions_for_patient_notifications(target_date date DEFAULT ((CURRENT_DATE + '1 day'::interval))::date)
 RETURNS TABLE(session_id uuid, scheduled_at timestamp with time zone, scheduled_at_formatted text, patient_name text, patient_phone text, patient_whatsapp text, psychologist_name text, psychologist_whatsapp text, session_status text, payment_status text, consolidated_status text, template_lembrete_sessao text, timezone text, session_value numeric, duration_minutes integer, clinic_name text, psychologist_crp text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    s.id as session_id,
    s.scheduled_at,
    -- Format datetime in Brazilian format with timezone conversion
    TO_CHAR(
      s.scheduled_at AT TIME ZONE COALESCE(pr.timezone, 'America/Sao_Paulo'), 
      'DD/MM/YYYY "às" HH24:MI'
    ) as scheduled_at_formatted,
    p.name as patient_name,
    p.phone as patient_phone,
    p.whatsapp as patient_whatsapp,
    pr.name as psychologist_name,
    pr.phone as psychologist_whatsapp,
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
    s.duration_minutes,
    pr.clinic_name,
    pr.crp_number as psychologist_crp
  FROM sessions s
  JOIN patients p ON s.patient_id = p.id AND p.is_archived = false
  JOIN profiles pr ON s.user_id = pr.user_id
  WHERE DATE(s.scheduled_at AT TIME ZONE COALESCE(pr.timezone, 'America/Sao_Paulo')) = target_date
    AND s.status = 'scheduled' -- Only send reminders for scheduled sessions
    AND (p.whatsapp IS NOT NULL AND p.whatsapp != '') -- Only patients with WhatsApp
  ORDER BY s.scheduled_at;
$function$