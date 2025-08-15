-- Create service modalities table
CREATE TABLE public.service_modalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('terapia_sp', 'particular', 'outros')),
  session_value DECIMAL(10,2),
  commission_type TEXT CHECK (commission_type IN ('fixed_per_patient', 'percentage_per_session', 'session_value', 'subscription_value')),
  commission_value DECIMAL(10,2),
  commission_percentage DECIMAL(5,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service_modalities
ALTER TABLE public.service_modalities ENABLE ROW LEVEL SECURITY;

-- Create policies for service_modalities
CREATE POLICY "Users can view their own modalities" 
ON public.service_modalities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own modalities" 
ON public.service_modalities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own modalities" 
ON public.service_modalities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own modalities" 
ON public.service_modalities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_service_modalities_updated_at
BEFORE UPDATE ON public.service_modalities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update patients table with new fields
ALTER TABLE public.patients 
ADD COLUMN nickname TEXT,
ADD COLUMN whatsapp TEXT NOT NULL DEFAULT '',
ADD COLUMN therapy_type TEXT NOT NULL DEFAULT 'individual_adult' CHECK (therapy_type IN ('individual_adult', 'adolescent', 'couple')),
ADD COLUMN session_mode TEXT NOT NULL DEFAULT 'online' CHECK (session_mode IN ('online', 'presential')),
ADD COLUMN frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly', 'others')),
ADD COLUMN custom_frequency TEXT,
ADD COLUMN service_modality_id UUID REFERENCES public.service_modalities(id);

-- Remove old source column and replace with modality reference
ALTER TABLE public.patients DROP COLUMN source;

-- Insert default Terapia SP modality for existing users (this will need to be done manually for each user)
-- We'll create a function to help with this
CREATE OR REPLACE FUNCTION public.create_default_terapia_sp_modality(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
  modality_id UUID;
BEGIN
  INSERT INTO public.service_modalities (user_id, name, type, session_value, commission_type, commission_value)
  VALUES (target_user_id, 'Terapia SP', 'terapia_sp', 80.00, 'fixed_per_patient', 20.00)
  RETURNING id INTO modality_id;
  
  RETURN modality_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;