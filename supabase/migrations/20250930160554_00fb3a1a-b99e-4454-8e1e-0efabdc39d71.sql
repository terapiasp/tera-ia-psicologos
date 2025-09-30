-- Agora corrigir sessões recorrentes que não têm schedule_id
-- Atualizar sessões que têm origin='recurring' mas schedule_id NULL
-- para adicionar o schedule_id correto baseado no paciente

UPDATE sessions s
SET schedule_id = rs.id
FROM recurring_schedules rs
WHERE s.patient_id = rs.patient_id
  AND s.origin = 'recurring'
  AND s.schedule_id IS NULL
  AND rs.is_active = true;