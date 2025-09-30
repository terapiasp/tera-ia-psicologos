-- Deletar sessões duplicadas que não têm schedule_id
-- Mantém apenas as sessões que já têm schedule_id correto

-- Primeiro, identificar e deletar sessões com origin='recurring' mas schedule_id NULL
-- quando existe uma sessão equivalente com schedule_id preenchido

DELETE FROM sessions s1
WHERE s1.origin = 'recurring'
  AND s1.schedule_id IS NULL
  AND EXISTS (
    SELECT 1 FROM sessions s2
    WHERE s2.patient_id = s1.patient_id
      AND s2.scheduled_at = s1.scheduled_at
      AND s2.schedule_id IS NOT NULL
      AND s2.origin = 'recurring'
  );