import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ServiceModality {
  id: string;
  user_id: string;
  name: string;
  type: string;
  session_value?: number;
  commission_value?: number;
  commission_percentage?: number;
  commission_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useServiceModalities = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modalities, isLoading, error } = useQuery({
    queryKey: ['service_modalities', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('service_modalities')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ServiceModality[];
    },
    enabled: !!user?.id,
  });

  const createModalityMutation = useMutation({
    mutationFn: async (modality: Omit<ServiceModality, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('service_modalities')
        .insert({
          ...modality,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_modalities', user?.id] });
      toast({
        title: "Modalidade criada",
        description: "Nova modalidade de serviço criada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar modalidade",
        variant: "destructive",
      });
    },
  });

  const updateModalityMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ServiceModality> }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('service_modalities')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_modalities', user?.id] });
      toast({
        title: "Modalidade atualizada",
        description: "Modalidade atualizada com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar modalidade",
        variant: "destructive",
      });
    },
  });

  const deleteModalityMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('service_modalities')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_modalities', user?.id] });
      toast({
        title: "Modalidade removida",
        description: "Modalidade removida com sucesso!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover modalidade",
        variant: "destructive",
      });
    },
  });

  return {
    modalities: modalities || [],
    isLoading,
    error,
    createModality: createModalityMutation.mutate,
    updateModality: updateModalityMutation.mutate,
    deleteModality: deleteModalityMutation.mutate,
    isCreating: createModalityMutation.isPending,
    isUpdating: updateModalityMutation.isPending,
    isDeleting: deleteModalityMutation.isPending,
  };
};