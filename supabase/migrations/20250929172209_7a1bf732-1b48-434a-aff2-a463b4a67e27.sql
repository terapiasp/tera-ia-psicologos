-- Remover dependências e recriar funções com segurança correta
DROP FUNCTION public.is_super_admin(_user_id UUID) CASCADE;
DROP FUNCTION public.has_role(_user_id UUID, _role app_role) CASCADE;

-- Recriar funções com search_path correto
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

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- Recriar todas as políticas RLS
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

CREATE POLICY "Super admins can view all patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Super admins can view all sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()) OR auth.uid() = user_id);

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