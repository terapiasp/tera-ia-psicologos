-- Adicionar campos para geração de PIX na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pix_bank_name text,
ADD COLUMN IF NOT EXISTS pix_allows_dynamic_value boolean DEFAULT false;

-- Criar política RLS específica para dados PIX
CREATE POLICY "Users can update own PIX data"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);