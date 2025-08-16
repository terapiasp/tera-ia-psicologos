-- Fix function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';