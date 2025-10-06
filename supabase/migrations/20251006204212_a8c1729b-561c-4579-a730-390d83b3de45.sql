-- Remove campos de geração de PIX que devem ser responsabilidade do n8n
-- Mantém apenas os dados essenciais de configuração

ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS pix_qr_code,
  DROP COLUMN IF EXISTS pix_copy_paste,
  DROP COLUMN IF EXISTS pix_allows_dynamic_value;

-- Comentário: 
-- pix_key_type e pix_key_value permanecem para armazenar a configuração básica
-- pix_bank_name permanece para identificação do banco (opcional)
-- pix_updated_at permanece para auditoria
-- A geração de QR Code e copy-paste será responsabilidade do n8n