-- Add PIX configuration columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pix_key_type TEXT CHECK (pix_key_type IN ('email', 'cpf', 'cnpj', 'telefone', 'random')),
ADD COLUMN IF NOT EXISTS pix_key_value TEXT,
ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
ADD COLUMN IF NOT EXISTS pix_copy_paste TEXT,
ADD COLUMN IF NOT EXISTS pix_updated_at TIMESTAMP WITH TIME ZONE;

-- Create payment_transfers table
CREATE TABLE IF NOT EXISTS public.payment_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  transfer_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  reference TEXT,
  sender_name TEXT,
  sender_bank TEXT,
  receiver_name TEXT,
  receiver_bank TEXT,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'approved', 'divergent', 'manual')),
  validation_method TEXT,
  validation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT DEFAULT 'n8n_webhook'
);

-- Enable RLS on payment_transfers
ALTER TABLE public.payment_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_transfers
CREATE POLICY "Users can view their own payment transfers"
ON public.payment_transfers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment transfers"
ON public.payment_transfers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment transfers"
ON public.payment_transfers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment transfers"
ON public.payment_transfers
FOR DELETE
USING (auth.uid() = user_id);

-- Super admins can view all payment transfers
CREATE POLICY "Super admins can view all payment transfers"
ON public.payment_transfers
FOR SELECT
USING (is_super_admin(auth.uid()) OR auth.uid() = user_id);

-- Trigger to update updated_at column
CREATE TRIGGER update_payment_transfers_updated_at
BEFORE UPDATE ON public.payment_transfers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_payment_transfers_user_id ON public.payment_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_patient_id ON public.payment_transfers(patient_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_transfer_date ON public.payment_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_validation_status ON public.payment_transfers(validation_status);