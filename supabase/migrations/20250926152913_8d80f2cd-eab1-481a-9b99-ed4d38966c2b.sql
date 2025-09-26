-- Função para detectar pacientes ativos com recorrência mas sem sessões futuras
CREATE OR REPLACE FUNCTION public.get_patients_with_missing_sessions(target_user_id UUID)
RETURNS TABLE(patient_id UUID, patient_name TEXT, schedule_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as patient_id,
    p.name as patient_name,
    rs.id as schedule_id
  FROM patients p
  LEFT JOIN recurring_schedules rs ON p.id = rs.patient_id AND rs.is_active = true
  LEFT JOIN sessions s ON rs.id = s.schedule_id AND s.scheduled_at > now()
  WHERE p.user_id = target_user_id
    AND p.is_archived = false
    AND rs.id IS NOT NULL
  GROUP BY p.id, p.name, rs.id
  HAVING COUNT(s.id) = 0
  ORDER BY p.name;
$$;