-- Criar sistema de roles hierárquico
CREATE TYPE public.app_role AS ENUM ('super_admin', 'psychologist');

-- Tabela de roles dos usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  UNIQUE(user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função de segurança para verificar roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- RLS Policies para user_roles
CREATE POLICY "Super admins can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update user roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete user roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Atualizar RLS das outras tabelas para incluir super admins

-- Profiles: Super admins podem ver todos os perfis (dados administrativos)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

-- Patients: Super admins podem ver todos os pacientes (dados administrativos apenas)
CREATE POLICY "Super admins can view all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

-- Sessions: Super admins podem ver sessões (mas dados sensíveis serão criptografados)
CREATE POLICY "Super admins can view all sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

-- Patient Notes: APENAS psicólogos podem acessar (dados sensíveis)
-- Manter política existente, super admins NÃO têm acesso

-- Service Modalities: Super admins podem gerenciar
CREATE POLICY "Super admins can view all service modalities"
ON public.service_modalities
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Super admins can manage all service modalities"
ON public.service_modalities
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

-- Criar primeiro super admin (será o usuário atual)
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
  auth.uid(),
  'super_admin'::app_role,
  auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;