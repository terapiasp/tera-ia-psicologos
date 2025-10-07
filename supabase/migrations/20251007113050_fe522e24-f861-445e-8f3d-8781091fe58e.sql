-- Criar tabela para armazenar pagamentos PIX gerados
CREATE TABLE pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  
  -- Dados enviados para n8n (baseados no profile)
  pix_key_value TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  city TEXT NOT NULL,
  pix_bank_name TEXT,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  
  -- Dados retornados pelo n8n
  qr_code_url TEXT,
  pix_code TEXT,
  
  -- Metadados
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'paid', 'expired', 'failed')),
  generated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE pix_payments ENABLE ROW LEVEL SECURITY;

-- Policies: usuário só acessa seus próprios PIX
CREATE POLICY "Users can view their own PIX payments"
  ON pix_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PIX payments"
  ON pix_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PIX payments"
  ON pix_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PIX payments"
  ON pix_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_pix_payments_user_id ON pix_payments(user_id);
CREATE INDEX idx_pix_payments_session_id ON pix_payments(session_id);
CREATE INDEX idx_pix_payments_status ON pix_payments(status);
CREATE INDEX idx_pix_payments_created_at ON pix_payments(created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_pix_payments_updated_at
  BEFORE UPDATE ON pix_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar relacionamento opcional em payment_transfers
ALTER TABLE payment_transfers 
  ADD COLUMN pix_payment_id UUID REFERENCES pix_payments(id) ON DELETE SET NULL;

-- Índice para vincular transferências a PIX gerados
CREATE INDEX idx_payment_transfers_pix_payment ON payment_transfers(pix_payment_id);

-- Comentários para documentação
COMMENT ON TABLE pix_payments IS 'Armazena QR Codes PIX gerados para cobranças';
COMMENT ON TABLE payment_transfers IS 'Armazena transferências PIX recebidas (validadas manualmente ou via webhook n8n)';
COMMENT ON COLUMN payment_transfers.pix_payment_id IS 'Vincula transferência recebida a um QR Code gerado previamente (opcional)';