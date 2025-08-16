
-- 1) Garantir 1 perfil por usuário
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 2) Novas colunas para perfis de psicólogos
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crp_number text,
  ADD COLUMN IF NOT EXISTS clinic_name text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- 3) Índice único para CRP (case-insensitive) permitindo valores nulos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'profiles_crp_unique'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX profiles_crp_unique
      ON public.profiles (lower(crp_number))
      WHERE crp_number IS NOT NULL;
  END IF;
END$$;

-- 4) Trigger para manter updated_at automático
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_profiles'
  ) THEN
    CREATE TRIGGER set_timestamp_profiles
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW
      EXECUTE PROCEDURE public.update_updated_at_column();
  END IF;
END$$;

-- 5) Trigger para criar profile automaticamente quando um usuário é criado no Auth
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END$$;
