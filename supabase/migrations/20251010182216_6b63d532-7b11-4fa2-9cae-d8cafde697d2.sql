-- Create pix_codes table for quick PIX generation
CREATE TABLE public.pix_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  txid TEXT NOT NULL,
  pix_key_type TEXT NOT NULL,
  pix_key_value TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  qr_code_url TEXT,
  pix_code TEXT,
  type TEXT NOT NULL DEFAULT 'quick',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add constraint for description length
ALTER TABLE public.pix_codes
ADD CONSTRAINT pix_codes_description_length CHECK (char_length(description) <= 25);

-- Add constraint for txid length
ALTER TABLE public.pix_codes
ADD CONSTRAINT pix_codes_txid_length CHECK (char_length(txid) <= 25);

-- Enable RLS
ALTER TABLE public.pix_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own PIX codes"
ON public.pix_codes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PIX codes"
ON public.pix_codes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIX codes"
ON public.pix_codes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PIX codes"
ON public.pix_codes
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_pix_codes_updated_at
BEFORE UPDATE ON public.pix_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();