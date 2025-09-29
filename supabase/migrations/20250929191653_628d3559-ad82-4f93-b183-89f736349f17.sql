-- Remove todas as roles de super_admin existentes
DELETE FROM public.user_roles WHERE role = 'super_admin';

-- Comentário: Após criar a conta gestao@terapiasp.com.br no sistema,
-- execute o seguinte comando SQL para atribuir a role de super_admin:
-- 
-- INSERT INTO public.user_roles (user_id, role, created_by)
-- SELECT id, 'super_admin', id 
-- FROM auth.users 
-- WHERE email = 'gestao@terapiasp.com.br';