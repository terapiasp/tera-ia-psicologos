-- Add archiving columns to patients table
ALTER TABLE public.patients 
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when filtering archived patients
CREATE INDEX idx_patients_is_archived ON public.patients(is_archived) WHERE is_archived = false;

-- Update updated_at trigger to handle archived_at
CREATE OR REPLACE FUNCTION public.handle_patient_archive()
RETURNS TRIGGER AS $$
BEGIN
  -- Set archived_at when is_archived changes to true
  IF NEW.is_archived = true AND OLD.is_archived = false THEN
    NEW.archived_at = now();
  END IF;
  
  -- Clear archived_at when is_archived changes to false
  IF NEW.is_archived = false AND OLD.is_archived = true THEN
    NEW.archived_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for archive handling
CREATE TRIGGER trigger_patient_archive
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_patient_archive();