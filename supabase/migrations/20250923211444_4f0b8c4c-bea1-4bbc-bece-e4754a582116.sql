-- Add session_link column to patients table
ALTER TABLE public.patients 
ADD COLUMN session_link text;