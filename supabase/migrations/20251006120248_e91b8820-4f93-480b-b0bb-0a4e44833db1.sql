-- FASE 1: Adicionar campos de configuração de pagamento

-- Adicionar campos na tabela patients
ALTER TABLE public.patients
ADD COLUMN payment_scheme text DEFAULT 'fixed_day' CHECK (payment_scheme IN ('fixed_day', 'per_period', 'per_session')),
ADD COLUMN payment_day integer DEFAULT 10 CHECK (payment_day >= 1 AND payment_day <= 31),
ADD COLUMN payment_period_sessions integer DEFAULT 4 CHECK (payment_period_sessions >= 1);

COMMENT ON COLUMN public.patients.payment_scheme IS 'Esquema de pagamento: fixed_day (dia fixo mensal), per_period (a cada X sessões), per_session (por sessão)';
COMMENT ON COLUMN public.patients.payment_day IS 'Dia do mês para vencimento (1-31) quando payment_scheme = fixed_day';
COMMENT ON COLUMN public.patients.payment_period_sessions IS 'Número de sessões para cobrança quando payment_scheme = per_period';

-- Adicionar campos na tabela profiles (configuração padrão do psicólogo)
ALTER TABLE public.profiles
ADD COLUMN default_payment_scheme text DEFAULT 'fixed_day' CHECK (default_payment_scheme IN ('fixed_day', 'per_period', 'per_session')),
ADD COLUMN default_payment_day integer DEFAULT 10 CHECK (default_payment_day >= 1 AND default_payment_day <= 31),
ADD COLUMN default_payment_period_sessions integer DEFAULT 4 CHECK (default_payment_period_sessions >= 1);

COMMENT ON COLUMN public.profiles.default_payment_scheme IS 'Esquema de pagamento padrão para novos pacientes';
COMMENT ON COLUMN public.profiles.default_payment_day IS 'Dia do mês padrão para vencimento';
COMMENT ON COLUMN public.profiles.default_payment_period_sessions IS 'Número de sessões padrão para cobrança por período';