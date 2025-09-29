import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'super_admin' | 'psychologist';

export const useRole = () => {
  const { user } = useAuth();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      return data.map(r => r.role as AppRole);
    },
    enabled: !!user?.id,
  });

  const isSuperAdmin = roles?.includes('super_admin') ?? false;
  const isPsychologist = roles?.includes('psychologist') ?? false;

  return {
    roles: roles ?? [],
    isSuperAdmin,
    isPsychologist,
    isLoading,
    hasRole: (role: AppRole) => roles?.includes(role) ?? false,
  };
};
