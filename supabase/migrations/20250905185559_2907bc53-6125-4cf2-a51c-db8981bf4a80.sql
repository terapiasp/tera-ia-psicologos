-- Add session_value to patients to store default price per patient
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS session_value numeric;

-- Optional: backfill not needed; default remains NULL

-- Performance: lightweight index for querying distinct values per user
CREATE INDEX IF NOT EXISTS idx_patients_user_session_value
ON public.patients (user_id, session_value);
