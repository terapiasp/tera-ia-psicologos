import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { AppRole } from './useRole';

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  profile: {
    name: string;
    phone?: string;
    crp_number?: string;
  } | null;
  roles: AppRole[];
}

export const useUserManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os usuários (apenas super admins)
  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      // Buscar perfis de todos os usuários
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, phone, crp_number, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles de todos os usuários
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combinar dados
      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        id: profile.user_id,
        email: profile.email,
        created_at: profile.created_at,
        profile: {
          name: profile.name,
          phone: profile.phone,
          crp_number: profile.crp_number,
        },
        roles: roles
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole),
      }));

      return usersWithRoles;
    },
    enabled: !!user?.id,
  });

  // Adicionar role a um usuário
  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role,
          created_by: user!.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({
        title: "Role adicionada",
        description: "Permissão atribuída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar role.",
        variant: "destructive",
      });
    },
  });

  // Remover role de um usuário
  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast({
        title: "Role removida",
        description: "Permissão removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover role.",
        variant: "destructive",
      });
    },
  });

  return {
    users: users ?? [],
    isLoading,
    addRole: addRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    isAddingRole: addRoleMutation.isPending,
    isRemovingRole: removeRoleMutation.isPending,
  };
};
