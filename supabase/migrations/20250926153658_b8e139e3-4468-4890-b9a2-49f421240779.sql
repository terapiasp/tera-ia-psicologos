-- Regeneração direta das sessões dos 3 pacientes usando INSERT simples
-- Primeiro, deletar sessões futuras existentes
DELETE FROM sessions 
WHERE schedule_id IN (
  '247e5cc5-e171-4c8a-944c-7746af3487a4', -- Dan
  'e4836d01-7001-4723-8362-9be3601fe63e', -- Jean  
  '1422b436-b58f-4f6e-a6f5-1fcfecef6384'  -- Nereu
) 
AND origin = 'recurring' 
AND scheduled_at >= NOW();

-- Dan: Quintas-feiras 13:00 (semanal)
INSERT INTO sessions (user_id, patient_id, schedule_id, scheduled_at, duration_minutes, type, modality, value, status, paid, origin)
SELECT 
  rs.user_id,
  rs.patient_id,
  rs.id,
  date_series + time '13:00',
  rs.duration_minutes,
  'therapy',
  rs.session_type,
  rs.session_value,
  'scheduled',
  false,
  'recurring'
FROM recurring_schedules rs,
     generate_series(
       CURRENT_DATE + ((4 - EXTRACT(DOW FROM CURRENT_DATE))::int % 7), -- Próxima quinta
       CURRENT_DATE + interval '12 months',
       interval '1 week'
     ) AS date_series
WHERE rs.id = '247e5cc5-e171-4c8a-944c-7746af3487a4'
AND date_series + time '13:00' > NOW();

-- Jean: Quintas-feiras 16:00 (semanal)  
INSERT INTO sessions (user_id, patient_id, schedule_id, scheduled_at, duration_minutes, type, modality, value, status, paid, origin)
SELECT 
  rs.user_id,
  rs.patient_id,
  rs.id,
  date_series + time '16:00',
  rs.duration_minutes,
  'therapy',
  rs.session_type,
  rs.session_value,
  'scheduled',
  false,
  'recurring'
FROM recurring_schedules rs,
     generate_series(
       CURRENT_DATE + ((4 - EXTRACT(DOW FROM CURRENT_DATE))::int % 7), -- Próxima quinta
       CURRENT_DATE + interval '12 months',
       interval '1 week'
     ) AS date_series
WHERE rs.id = 'e4836d01-7001-4723-8362-9be3601fe63e'
AND date_series + time '16:00' > NOW();

-- Nereu: Quintas-feiras 08:00 (quinzenal)
INSERT INTO sessions (user_id, patient_id, schedule_id, scheduled_at, duration_minutes, type, modality, value, status, paid, origin)
SELECT 
  rs.user_id,
  rs.patient_id,
  rs.id,
  date_series + time '08:00',
  rs.duration_minutes,
  'therapy',
  rs.session_type,
  rs.session_value,
  'scheduled',
  false,
  'recurring'
FROM recurring_schedules rs,
     generate_series(
       CURRENT_DATE + ((4 - EXTRACT(DOW FROM CURRENT_DATE))::int % 7), -- Próxima quinta
       CURRENT_DATE + interval '12 months',
       interval '2 weeks'  -- Quinzenal
     ) AS date_series
WHERE rs.id = '1422b436-b58f-4f6e-a6f5-1fcfecef6384'
AND date_series + time '08:00' > NOW();