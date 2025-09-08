-- Add session_duration column to patients table
ALTER TABLE public.patients 
ADD COLUMN session_duration INTEGER DEFAULT 50;