-- Create frequency_presets table for custom recurrence patterns
CREATE TABLE public.frequency_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  recurrence_pattern JSONB NOT NULL,
  estimated_sessions_per_month NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.frequency_presets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own frequency presets" 
ON public.frequency_presets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own frequency presets" 
ON public.frequency_presets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own frequency presets" 
ON public.frequency_presets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own frequency presets" 
ON public.frequency_presets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add frequency_preset_id to patients table
ALTER TABLE public.patients 
ADD COLUMN frequency_preset_id UUID;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_frequency_presets_updated_at
BEFORE UPDATE ON public.frequency_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();