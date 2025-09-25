-- Remove Google Auth related columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS google_token_expires_at,
DROP COLUMN IF EXISTS google_calendar_connected,
DROP COLUMN IF EXISTS google_access_token,
DROP COLUMN IF EXISTS google_refresh_token,
DROP COLUMN IF EXISTS google_calendar_id;